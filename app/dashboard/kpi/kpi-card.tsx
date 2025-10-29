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
  { label: 'ROAS', value: 3 },
  { label: 'Revenue', value: 4 },
  { label: 'Ad Spend Since Rebill', value: 5 },
  { label: 'ROAS Since Rebill', value: 6 },
  { label: 'Revenue Since Rebill', value: 7 },
  { label: 'Orders', value: 8 },
  { label: 'Orders Since Rebill', value: 9 },
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
function normalizeKey(key: string): string {
  const lowerKey = key.toLowerCase()

  if (lowerKey.includes('since rebill')) {
    if (lowerKey.startsWith('ad spend')) return 'ad spend since rebill'
    if (lowerKey.startsWith('roas')) return 'roas since rebill'
    if (lowerKey.startsWith('revenue')) return 'revenue since rebill'

    if (lowerKey.includes('order')) return 'orders since rebill'
  }

  if (lowerKey.startsWith('ad spend')) return 'ad spend'
  if (lowerKey.startsWith('roas')) return 'roas'
  if (lowerKey.startsWith('revenue')) return 'revenue'

  if (lowerKey.includes('order')) return 'order'

  return lowerKey
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
      const { financialize } = await import('@/lib/actions')
      const { appendDataToSheet } = await import('@/lib/api')

      for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
        const batch = accounts.slice(i, i + BATCH_SIZE)
        batchNumber++

        const batchRows = (await financialize(
          batch,
          sheetID,
          true,
          true,
          datePreset,
        )) as any[][]

        allRows.push(...batchRows)

        setNotificationState({
          state: 'loading',
          message: `✅ Batch ${batchNumber} of ${totalBatches} complete...`,
        })
      }

      for (let row of allRows) {
        for (let i of [3, 4, 5, 6, 7, 8, 11, 12]) {
          const val = row[i]

          if (typeof val === 'string' && /^[\d,.\s]+$/.test(val)) {
            row[i] = parseFloat(val.replace(/,/g, '')) || 0
          }
        }
      }

      allRows.sort((a, b) => {
        const revenueA = typeof a[5] === 'number' ? a[5] : -Infinity
        const revenueB = typeof b[5] === 'number' ? b[5] : -Infinity
        const spendA = typeof a[3] === 'number' ? a[3] : -Infinity
        const spendB = typeof b[3] === 'number' ? b[3] : -Infinity

        return revenueB - revenueA || spendB - spendA
      })

      // Compute totals & averages
      const totals = allRows.reduce(
        (acc, row) => {
          const toNum = (val: any) => {
            if (typeof val === 'string' && /^[\d,.\s]+$/.test(val)) {
              return parseFloat(val.replace(/,/g, ''))
            } else if (typeof val === 'number') {
              return val
            }
            return null
          }

          const fbLast30Spend = toNum(row[3])
          const roas30 = toNum(row[4])
          const revenueLast30 = toNum(row[5])
          const fbSinceRebillSpend = toNum(row[6])
          const roasRebill = toNum(row[7])
          const revenueSinceRebill = toNum(row[8])
          const ordersLast30 = toNum(row[11])
          const ordersSinceRebill = toNum(row[12])

          if (fbLast30Spend !== null) acc.fbLast30Spend += fbLast30Spend
          if (revenueLast30 !== null) acc.revenueLast30 += revenueLast30
          if (fbSinceRebillSpend !== null)
            acc.fbSinceRebillSpend += fbSinceRebillSpend
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

      const avgRoas30 =
        totals.fbLast30RoasCount > 0
          ? totals.fbLast30RoasSum / totals.fbLast30RoasCount
          : 0

      const avgRoasRebill =
        totals.fbSinceRebillRoasCount > 0
          ? totals.fbSinceRebillRoasSum / totals.fbSinceRebillRoasCount
          : 0

      allRows.push([
        'n/a',
        'TOTAL/AVG',
        new Date().toDateString(),
        totals.fbLast30Spend.toLocaleString(),
        avgRoas30.toFixed(2),
        totals.revenueLast30.toLocaleString(),
        totals.fbSinceRebillSpend.toLocaleString(),
        avgRoasRebill.toFixed(2),
        totals.revenueSinceRebill.toLocaleString(),
        'n/a',
        'n/a',
        totals.ordersLast30.toLocaleString(),
        totals.ordersSinceRebill.toLocaleString(),
      ])

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
          <div className="grid grid-flow-col grid-cols-3 grid-rows-3 gap-4">
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
