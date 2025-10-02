'use client'

import { financialize } from '@/lib/actions'
import { appendDataToSheet } from '@/lib/api'
import { useState } from 'react'
import NotificationModal from './NotificationModal'

export default function FinancialX({
  stores,
  sheetId,
  batchStores = false,
  main = false,
}: {
  stores: any[]
  sheetId?: string
  batchStores?: boolean
  main?: boolean
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
          // Clean all number fields (cols 3 to 8) before sorting - shifted by 1 due to new Monitored column
          // CLEAN numeric fields (cols 3–8) ONLY if they look numeric
          for (let row of allRows) {
            for (let i of [3, 4, 5, 6, 7, 8]) {
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
            const revenueA = typeof a[4] === 'number' ? a[4] : -Infinity // Revenue is now in column 4
            const revenueB = typeof b[4] === 'number' ? b[4] : -Infinity
            const spendA = typeof a[5] === 'number' ? a[5] : -Infinity // Spend is now in column 5
            const spendB = typeof b[5] === 'number' ? b[5] : -Infinity

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

              const ordersLast30 = toNum(row[3]) // Shifted by 1 due to new Monitored column
              const revenueLast30 = toNum(row[4])
              const fbLast30Spend = toNum(row[5])
              const ordersSinceRebill = toNum(row[6])
              const revenueSinceRebill = toNum(row[7])
              const fbSinceRebillSpend = toNum(row[8])
              const roas30 = toNum(row[9])
              const roasRebill = toNum(row[10])

              if (ordersLast30 !== null) acc.ordersLast30 += ordersLast30
              if (revenueLast30 !== null) acc.revenueLast30 += revenueLast30
              if (fbLast30Spend !== null) acc.fbLast30Spend += fbLast30Spend
              if (ordersSinceRebill !== null)
                acc.ordersSinceRebill += ordersSinceRebill
              if (revenueSinceRebill !== null)
                acc.revenueSinceRebill += revenueSinceRebill
              if (fbSinceRebillSpend !== null)
                acc.fbSinceRebillSpend += fbSinceRebillSpend

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
              ordersLast30: 0,
              revenueLast30: 0,
              fbLast30Spend: 0,
              ordersSinceRebill: 0,
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
            '',
            totals.ordersLast30.toLocaleString(),
            totals.revenueLast30.toLocaleString(),
            totals.fbLast30Spend.toLocaleString(),
            totals.ordersSinceRebill.toLocaleString(),
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
        Refresh {main && 'Main'} Finance Sheet
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
