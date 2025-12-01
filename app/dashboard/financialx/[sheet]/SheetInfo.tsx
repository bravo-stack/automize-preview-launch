'use client'

import NotificationModal from '@/components/NotificationModal'
import { deleteSheet } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface SheetInfoProps {
  links: string[]
  data: any
}

export default function SheetInfo({ links, data }: SheetInfoProps) {
  const { sheet, lastRefresh } = data
  const status = sheet.title === 'Churned' ? 'left' : 'active'
  const router = useRouter()

  const [activeSection, setActiveSection] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const [notificationState, setNotificationState] = useState<{
    state: string
    message: string
  } | null>(null)

  const handleDelete = async () => {
    await deleteSheet(sheet.sheet_id)
    router.push('/dashboard/autometric')
  }

  const handleDataRefresh = async () => {
    const sheetID = sheet.sheet_id
    const sheetNumericId = sheet.id
    const datePreset = sheet.refresh

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
    let snapshotId: string | null = null

    try {
      const { financialize } = await import('@/lib/actions')
      const { appendDataToSheet } = await import('@/lib/api')
      const {
        createRefreshSnapshot,
        updateSnapshotStatus,
        saveSnapshotMetrics,
      } = await import('@/lib/db/refresh-snapshots')

      const snapshotResult = await createRefreshSnapshot({
        sheetId: sheetNumericId,
        refreshType: 'financialx',
        datePreset: datePreset,
        metadata: { totalAccounts: accounts.length, totalBatches },
      })

      if (!snapshotResult.success) {
        throw new Error(snapshotResult.error)
      }

      snapshotId = snapshotResult.snapshotId

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
          message: `Batch ${batchNumber} of ${totalBatches} complete...`,
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

      allRows.push([
        'n/a',
        'TOTAL/AVG',
        new Date().toDateString(),
        totals.fbLast30Spend.toLocaleString(),
        avgRoas30.toFixed(2),
        totals.fbLast30Revenue.toLocaleString(),
        totals.revenueLast30.toLocaleString(),
        totals.fbSinceRebillSpend.toLocaleString(),
        avgRoasRebill.toFixed(2),
        totals.fbSinceRebillRevenue.toLocaleString(),
        totals.revenueSinceRebill.toLocaleString(),
        'n/a',
        'n/a',
        totals.ordersLast30.toLocaleString(),
        totals.ordersSinceRebill.toLocaleString(),
      ])

      await appendDataToSheet(sheetID, allRows)

      if (snapshotId) {
        const metricsToSave = allRows
          .filter((row) => row[1] !== 'TOTAL/AVG')
          .map((row) => {
            // Helper to extract numeric value and detect errors
            const extractNumeric = (
              val: any,
              fieldName: string,
              errors: Array<{
                field: string
                message: string
                raw_value?: string | number | null
              }>,
            ): number | undefined => {
              if (typeof val === 'number') return val
              if (typeof val === 'string') {
                // Check if it's an error message (contains common error patterns)
                const isError =
                  /log in|access token|error|invalid|expired|could not|bad request|forbidden|not found|rate limit|network|no data|missing/i.test(
                    val,
                  )
                if (isError) {
                  errors.push({
                    field: fieldName,
                    message: val,
                    raw_value: val,
                  })
                  return undefined
                }
              }
              return undefined
            }

            const errors: Array<{
              field: string
              message: string
              raw_value?: string | number | null
            }> = []

            const metric = {
              account_name: row[1],
              pod: row[2],
              is_monitored: row[0] === 'Yes',
              ad_spend_timeframe: extractNumeric(
                row[3],
                'ad_spend_timeframe',
                errors,
              ),
              roas_timeframe: extractNumeric(row[4], 'roas_timeframe', errors),
              fb_revenue_timeframe: extractNumeric(
                row[5],
                'fb_revenue_timeframe',
                errors,
              ),
              shopify_revenue_timeframe: extractNumeric(
                row[6],
                'shopify_revenue_timeframe',
                errors,
              ),
              ad_spend_rebill: extractNumeric(
                row[7],
                'ad_spend_rebill',
                errors,
              ),
              roas_rebill: extractNumeric(row[8], 'roas_rebill', errors),
              fb_revenue_rebill: extractNumeric(
                row[9],
                'fb_revenue_rebill',
                errors,
              ),
              shopify_revenue_rebill: extractNumeric(
                row[10],
                'shopify_revenue_rebill',
                errors,
              ),
              rebill_status: typeof row[11] === 'string' ? row[11] : undefined,
              last_rebill_date:
                typeof row[12] === 'string' && row[12] !== 'Missing rebill date'
                  ? row[12]
                  : undefined,
              orders_timeframe: extractNumeric(
                row[13],
                'orders_timeframe',
                errors,
              ),
              orders_rebill: extractNumeric(row[14], 'orders_rebill', errors),
              is_error: errors.length > 0,
              error_detail:
                errors.length > 0
                  ? { errors, error_count: errors.length }
                  : undefined,
            }

            return metric
          })

        await saveSnapshotMetrics({
          snapshotId,
          metrics: metricsToSave,
        })

        await updateSnapshotStatus(snapshotId, 'completed')
      }

      setNotificationState({
        state: 'success',
        message: 'All batches processed and data saved!',
      })
    } catch (error) {
      console.error('Error refreshing data:', error)

      if (snapshotId) {
        const { updateSnapshotStatus } = await import(
          '@/lib/db/refresh-snapshots'
        )
        await updateSnapshotStatus(
          snapshotId,
          'failed',
          error instanceof Error ? error.message : 'Failed to refresh data',
        )
      }

      setNotificationState({
        state: 'error',
        message: `Error during batch ${batchNumber}`,
      })
    } finally {
      setTimeout(() => {
        setNotificationState(null)
      }, 5000)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <nav className="grid grid-cols-2 gap-3">
        {links.map((link, index: number) => (
          <button
            key={link}
            onClick={() => setActiveSection(index)}
            className={`w-full overflow-hidden rounded border border-zinc-800 p-3 font-medium transition-colors hover:border-zinc-700 lg:p-7 ${activeSection === index ? 'bg-night-dusk' : ''}`}
          >
            {link}
          </button>
        ))}
      </nav>

      <div className="space-y-3 overflow-clip text-ellipsis lg:col-span-2">
        {activeSection === 0 && (
          <div className="space-y-3">
            <h4>Frequency</h4>
            {sheet.refresh === 'none' ? (
              <span className="text-sm">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-red-600"></span>
                No Automations Active
              </span>
            ) : (
              <span className="text-sm">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-teal-400" />
                Active - {sheet.refresh.replace(/_/g, ' ')}
              </span>
            )}

            <div>
              <h4>Last Refresh</h4>
              <span className="text-sm">{lastRefresh}</span>
            </div>

            <button
              onClick={handleDataRefresh}
              className="rounded bg-white px-3 py-2 font-medium text-black"
            >
              Refresh Finance Data
            </button>
          </div>
        )}

        {activeSection === 1 && (
          <div className="flex h-full min-h-40 flex-col justify-between">
            <h4>Automation</h4>
            <p className="text-sm">
              Set up automatic refreshes to avoid refreshing manually.
            </p>

            <button className="w-fit rounded border px-3 py-2">
              Create Automation
            </button>
          </div>
        )}

        {activeSection === 2 && (
          <>
            <h4>Create Backups</h4>
            <p className="text-sm">
              Automatically create backups with our backup tool.
            </p>
          </>
        )}

        {activeSection === 3 && (
          <div className="flex h-full min-h-40 flex-col justify-between">
            <h4>Section 3 Placeholder</h4>
            <p className="text-sm">Content for section 3 will go here.</p>

            <div className="flex space-x-4">
              <button
                className="hover:border-xps-deepBlue hover:text-xps-deepBlue rounded-sm border border-red-950 bg-red-950/30 px-2 py-1 text-red-950 transition-colors"
                onClick={() => setConfirm(true)}
              >
                Delete Sheet
              </button>
              <button
                className={`rounded-full border border-red-950 bg-red-950/30 px-2 py-1 text-red-950 ${confirm ? 'flex' : 'hidden'}`}
                onClick={handleDelete}
              >
                Confirm
              </button>
              <button
                className={`border-xps-grey text-xps-grey rounded-full border px-2 py-1 ${confirm ? 'flex' : 'hidden'}`}
                onClick={() => setConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {notificationState && (
        <NotificationModal
          state={notificationState.state}
          onClose={() => setNotificationState(null)}
          message={notificationState.message}
        />
      )}
    </div>
  )
}
