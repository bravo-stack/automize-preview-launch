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
          // Clean all number fields before sorting
          // New column order: Monitored(0), Name(1), Pod(2), Ad spend timeframe(3), ROAS timeframe(4), FB Revenue timeframe(5), Revenue timeframe(6), Ad spend rebill(7), ROAS rebill(8), FB Revenue rebill(9), Revenue rebill(10), Is rebillable(11), Last rebill date(12), Orders timeframe(13), Orders rebill(14)
          for (let row of allRows) {
            for (let i of [3, 4, 5, 6, 7, 8, 9, 10, 13, 14]) {
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
            const revenueA = typeof a[6] === 'number' ? a[6] : -Infinity // Revenue (timeframe) is now column 6
            const revenueB = typeof b[6] === 'number' ? b[6] : -Infinity
            const spendA = typeof a[3] === 'number' ? a[3] : -Infinity // Ad spend (timeframe) is column 3
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

              // New column order: Monitored(0), Name(1), Pod(2), Ad spend timeframe(3), ROAS timeframe(4), FB Revenue timeframe(5), Revenue timeframe(6), Ad spend rebill(7), ROAS rebill(8), FB Revenue rebill(9), Revenue rebill(10), Is rebillable(11), Last rebill date(12), Orders timeframe(13), Orders rebill(14)
              const fbLast30Spend = toNum(row[3]) // Ad spend (timeframe)
              const roas30 = toNum(row[4]) // ROAS (timeframe)
              const fbLast30Revenue = toNum(row[5]) // FB Revenue (timeframe)
              const revenueLast30 = toNum(row[6]) // Revenue (timeframe)
              const fbSinceRebillSpend = toNum(row[7]) // Ad spend (rebill)
              const roasRebill = toNum(row[8]) // ROAS (rebill)
              const fbSinceRebillRevenue = toNum(row[9]) // FB Revenue (rebill)
              const revenueSinceRebill = toNum(row[10]) // Revenue (rebill)
              const ordersLast30 = toNum(row[13]) // Orders (timeframe)
              const ordersSinceRebill = toNum(row[14]) // Orders (rebill)

              if (fbLast30Spend !== null) acc.fbLast30Spend += fbLast30Spend
              if (fbLast30Revenue !== null)
                acc.fbLast30Revenue += fbLast30Revenue
              if (revenueLast30 !== null) acc.revenueLast30 += revenueLast30
              if (fbSinceRebillSpend !== null)
                acc.fbSinceRebillSpend += fbSinceRebillSpend
              if (fbSinceRebillRevenue !== null)
                acc.fbSinceRebillRevenue += fbSinceRebillRevenue
              if (revenueSinceRebill !== null)
                acc.revenueSinceRebill += revenueSinceRebill
              if (ordersLast30 !== null) acc.ordersLast30 += ordersLast30
              if (ordersSinceRebill !== null)
                acc.ordersSinceRebill += ordersSinceRebill

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
              fbLast30Revenue: 0,
              revenueSinceRebill: 0,
              fbSinceRebillSpend: 0,
              fbSinceRebillRevenue: 0,
              ordersLast30: 0,
              ordersSinceRebill: 0,
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
            'n/a', // Monitored
            'TOTAL/AVG', // Name
            new Date().toDateString(), // Pod
            totals.fbLast30Spend.toLocaleString(), // Ad spend (timeframe)
            avgRoas30.toFixed(2), // ROAS (timeframe)
            totals.fbLast30Revenue.toLocaleString(), // FB Revenue (timeframe)
            totals.revenueLast30.toLocaleString(), // Revenue (timeframe)
            totals.fbSinceRebillSpend.toLocaleString(), // Ad spend (rebill)
            avgRoasRebill.toFixed(2), // ROAS (rebill)
            totals.fbSinceRebillRevenue.toLocaleString(), // FB Revenue (rebill)
            totals.revenueSinceRebill.toLocaleString(), // Revenue (rebill)
            'n/a', // Is rebillable
            'n/a', // Last rebill date
            totals.ordersLast30.toLocaleString(), // Orders (timeframe)
            totals.ordersSinceRebill.toLocaleString(), // Orders (rebill)
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
