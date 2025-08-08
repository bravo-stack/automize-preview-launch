'use client'

import { financialize } from '@/lib/actions'
import { appendDataToSheet } from '@/lib/api'
import { useState } from 'react'
import NotificationModal from './NotificationModal'

export default function FinancialX({
  stores,
  sheetId,
  batchStores = false,
}: {
  stores: any[]
  sheetId?: string
  batchStores?: boolean
}) {
  const [notificationState, setNotificationState] = useState<{
    state: string
    message: string
  } | null>(null)

  const handleRefresh = async () => {
    const BATCH_SIZE = 75
    const totalBatches = Math.ceil(stores.length / BATCH_SIZE)

    if (batchStores) {
      setNotificationState({
        state: 'loading',
        message: `Starting batch processing (${totalBatches} total)...`,
      })
    } else {
      setNotificationState({
        state: 'loading',
        message: 'Refreshing data...',
      })
    }

    const allRows: any[][] = []
    let batchNumber = 0

    try {
      if (batchStores) {
        for (let i = 0; i < stores.length; i += BATCH_SIZE) {
          const batch = stores.slice(i, i + BATCH_SIZE)

          // Batch mode: batch = true
          const batchRows = (await financialize(
            batch,
            sheetId,
            sheetId ? true : false,
            batchStores,
          )) as any[][]

          allRows.push(...batchRows)

          batchNumber++
          setNotificationState({
            state: 'loading',
            message: `✅ Batch ${batchNumber} of ${totalBatches} complete...`,
          })
        }

        if (batchStores) {
          // ✅ Step 1: Flattened data is already in allRows — now we sort globally
          // Clean all number fields (cols 2 to 5) before sorting
          // CLEAN numeric fields (cols 2–5) ONLY if they look numeric
          for (let row of allRows) {
            for (let i of [2, 3, 4, 5]) {
              const val = row[i]

              if (
                typeof val === 'string' &&
                /^[\d,.\s]+$/.test(val) // Matches numbers with optional commas/decimals
              ) {
                row[i] = parseFloat(val.replace(/,/g, '')) || 0
              }
              // else keep original message like "Could not retrieve"
            }
          }

          allRows.sort((a, b) => {
            const revenueA = typeof a[2] === 'number' ? a[2] : -Infinity
            const revenueB = typeof b[2] === 'number' ? b[2] : -Infinity
            const spendA = typeof a[3] === 'number' ? a[3] : -Infinity
            const spendB = typeof b[3] === 'number' ? b[3] : -Infinity

            return revenueB - revenueA || spendB - spendA
          })

          // ✅ Step 2: Compute totals & averages
          const totals = allRows.reduce(
            (acc, row) => {
              const toNum = (val: any) => {
                if (
                  typeof val === 'string' &&
                  /^[\d,.\s]+$/.test(val) // Only parse if it's a numeric-looking string
                ) {
                  return parseFloat(val.replace(/,/g, ''))
                } else if (typeof val === 'number') {
                  return val
                }
                return null // non-numeric or error string
              }

              const r30 = toNum(row[2])
              const s30 = toNum(row[3])
              const rRebill = toNum(row[4])
              const sRebill = toNum(row[5])
              const roas30 = toNum(row[6])
              const roasRebill = toNum(row[7])

              if (r30 !== null) acc.revenueLast30 += r30
              if (s30 !== null) acc.fbLast30Spend += s30
              if (rRebill !== null) acc.revenueSinceRebill += rRebill
              if (sRebill !== null) acc.fbSinceRebillSpend += sRebill

              if (roas30 !== null) {
                acc.fbLast30RoasSum += roas30
                acc.fbLast30RoasCount++
              }

              if (roasRebill !== null) {
                acc.fbSinceRebillRoasSum += roasRebill
                acc.fbSinceRebillRoasCount++
              }

              return acc
            },
            {
              revenueLast30: 0,
              fbLast30Spend: 0,
              revenueSinceRebill: 0,
              fbSinceRebillSpend: 0,
              fbLast30RoasSum: 0,
              fbLast30RoasCount: 0,
              fbSinceRebillRoasSum: 0,
              fbSinceRebillRoasCount: 0,
            },
          )

          // ✅ Step 3: Compute average ROAS
          const avgRoas30 =
            totals.fbLast30RoasCount > 0
              ? totals.fbLast30RoasSum / totals.fbLast30RoasCount
              : 0

          const avgRoasRebill =
            totals.fbSinceRebillRoasCount > 0
              ? totals.fbSinceRebillRoasSum / totals.fbSinceRebillRoasCount
              : 0

          // ✅ Step 4: Append totals row
          allRows.push([
            'TOTAL/AVG',
            new Date().toDateString(),
            totals.revenueLast30.toLocaleString(),
            totals.fbLast30Spend.toLocaleString(),
            totals.revenueSinceRebill.toLocaleString(),
            totals.fbSinceRebillSpend.toLocaleString(),
            avgRoas30.toFixed(2),
            avgRoasRebill.toFixed(2),
            '',
            '',
            '',
          ])

          // ✅ Step 5: Write to sheet
          await appendDataToSheet(
            '19lCLSuG9cU7U0bL1DiqWUd-QbfBGPEQgG7joOnu9gyY',
            allRows,
          )

          setNotificationState({
            state: 'success',
            message: '✅ All batches processed and data saved!',
          })
        }
      } else {
        const result = await financialize(
          stores,
          sheetId,
          sheetId ? true : false,
          false, // batch = false
        )

        if (result) {
          setNotificationState({
            state: 'success',
            message: '✅ Data refreshed successfully!',
          })
        } else {
          setNotificationState({
            state: 'error',
            message: 'Error refreshing data',
          })
        }
      }
    } catch (err) {
      console.error(err)
      setNotificationState({
        state: 'error',
        message: `❌ Error during batch ${batchNumber}`,
      })
    }

    setTimeout(() => {
      setNotificationState(null)
    }, 5000)
  }

  return (
    <>
      <button onClick={handleRefresh} className="rounded border px-2 py-1.5">
        Refresh FinanceX
      </button>

      {notificationState && (
        <NotificationModal
          state={notificationState.state}
          onClose={() => setNotificationState(null)}
          message={notificationState.message}
        />
      )}
    </>
  )
}
