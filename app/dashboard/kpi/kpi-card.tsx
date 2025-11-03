'use client'

import NotificationModal from '@/components/NotificationModal'
import { Fragment, useState } from 'react'

type KpiValue = {
  key: string
  value: string | null
}

type KPICardProps = {
  title: string
  kpi: KpiValue[]
  sheetId: string
  sheetRefresh: string
  sheetTitle: string
}

const layout = [
  { label: 'Ad Spend', value: 2 },
  { label: 'Ad Spend Since Rebill', value: 6 },
  { label: 'Orders', value: 10 },
  { label: 'ROAS', value: 3 },
  { label: 'ROAS Since Rebill', value: 7 },
  { label: 'Orders Since Rebill', value: 11 },
  { label: 'FB Rev', value: 4 },
  { label: 'FB Rev Since Rebill', value: 8 },
  { label: 'Shopify Rev', value: 5 },
  { label: 'Shopify Rev Since Rebill', value: 9 },
]

function KpiCell({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex flex-col">
      <span className="truncate text-sm text-zinc-400" title={label}>
        {label}
      </span>
      <span className="break-words text-lg font-bold text-white">
        {value || '-'}
      </span>
    </div>
  )
}

export function KPICard({
  title,
  kpi,
  sheetId,
  sheetRefresh,
  sheetTitle,
}: KPICardProps) {
  // STATES
  const [notificationState, setNotificationState] = useState<{
    state: string
    message: string
  } | null>(null)

  // DATA INIT
  const kpiMapTest = new Map(
    kpi.map((item, index) => {
      return [index + 1, item?.value]
    }),
  )

  //   HANDLERS
  const handleRefresh = async () => {
    const sheetID = sheetId
    const datePreset = sheetRefresh
    const status = sheetTitle === 'Churned' ? 'left' : 'active'

    // First, fetch accounts for batching
    const response = await fetch('/api/accounts-for-batching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      setNotificationState({
        state: 'error',
        message: 'Failed to fetch accounts data',
      })
      return
    }

    const { accounts } = await response.json()

    if (!accounts || accounts.length === 0) {
      setNotificationState({
        state: 'error',
        message: 'No accounts found for processing',
      })
      return
    }

    const BATCH_SIZE = 75
    const totalBatches = Math.ceil(accounts.length / BATCH_SIZE)
    let batchNumber = 0

    setNotificationState({
      state: 'loading',
      message: `Starting batch processing (${totalBatches} total)...`,
    })

    const allRows: any[][] = []

    try {
      // Import financialize and appendDataToSheet for client-side processing
      const { financialize } = await import('@/lib/actions')
      const { appendDataToSheet } = await import('@/lib/api')

      // Process in batches
      for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
        const batch = accounts.slice(i, i + BATCH_SIZE)
        batchNumber++

        // Batch mode: batch = true
        const batchRows = (await financialize(
          batch,
          sheetID,
          true, // subsheet = true
          true, // batch = true
          datePreset,
        )) as any[][]

        allRows.push(...batchRows)

        setNotificationState({
          state: 'loading',
          message: `✅ Batch ${batchNumber} of ${totalBatches} complete...`,
        })
      }

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

      // Sort globally by revenue (timeframe) then spend (timeframe)
      allRows.sort((a, b) => {
        const revenueA = typeof a[6] === 'number' ? a[6] : -Infinity // Revenue (timeframe) is now column 6
        const revenueB = typeof b[6] === 'number' ? b[6] : -Infinity
        const spendA = typeof a[3] === 'number' ? a[3] : -Infinity // Ad spend (timeframe)
        const spendB = typeof b[3] === 'number' ? b[3] : -Infinity

        return revenueB - revenueA || spendB - spendA
      })

      // Compute totals & averages
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
          if (fbLast30Revenue !== null) acc.fbLast30Revenue += fbLast30Revenue
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

      // Compute average ROAS
      const avgRoas30 =
        totals.fbLast30RoasCount > 0
          ? totals.fbLast30RoasSum / totals.fbLast30RoasCount
          : 0

      const avgRoasRebill =
        totals.fbSinceRebillRoasCount > 0
          ? totals.fbSinceRebillRoasSum / totals.fbSinceRebillRoasCount
          : 0

      // Append totals row
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

      // Write to sheet
      await appendDataToSheet(sheetID, allRows)

      setNotificationState({
        state: 'success',
        message: '✅ All batches processed and data saved!',
      })
    } catch (error) {
      console.error('Error refreshing data:', error)
      setNotificationState({
        state: 'error',
        message: `❌ Error during batch ${batchNumber}`,
      })
    } finally {
      setTimeout(() => {
        setNotificationState(null)
      }, 5000)
    }
  }

  return (
    <Fragment>
      <div className="relative flex flex-col gap-6 rounded-lg border border-zinc-700 bg-zinc-900 p-6">
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full items-center justify-between gap-1">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-zinc-500">
              Last Refreshed: {kpiMapTest.get(1)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded bg-zinc-700 px-3 py-1.5 text-center text-sm font-medium transition-colors hover:bg-zinc-600"
            >
              Visit Sheet
            </a>

            <button
              onClick={handleRefresh}
              disabled={notificationState?.state === 'loading'}
              className="flex-1 rounded bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {notificationState?.state === 'loading'
                ? 'Refreshing...'
                : 'Refresh Data'}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-3 grid-rows-3 gap-4">
            {layout.map(({ label, value }, columnIndex) => {
              return (
                <KpiCell
                  key={columnIndex}
                  label={label}
                  value={kpiMapTest.get(value)}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {notificationState && (
        <NotificationModal
          state={notificationState.state}
          onClose={() => setNotificationState(null)}
          message={notificationState.message}
        />
      )}
    </Fragment>
  )
}
