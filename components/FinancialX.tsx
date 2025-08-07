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
        await appendDataToSheet(
          '19lCLSuG9cU7U0bL1DiqWUd-QbfBGPEQgG7joOnu9gyY',
          allRows,
        )
      }

      setNotificationState({
        state: 'success',
        message: '✅ All batches processed and data saved!',
      })
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
