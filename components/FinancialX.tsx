'use client'

import { useState } from 'react'
import { financialize } from '@/lib/actions'
import NotificationModal from './NotificationModal'

export default function FinancialX({
  stores,
  sheetId,
}: {
  stores: any[]
  sheetId?: string
}) {
  const [notificationState, setNotificationState] = useState<{
    state: string
    message: string
  } | null>(null)

  const handleRefresh = async () => {
    setNotificationState({ state: 'loading', message: 'Refreshing data...' })
    const data = await financialize(stores, sheetId, sheetId ? true : false)
    if (data) {
      setNotificationState({
        state: 'success',
        message: 'Data refreshed successfully!',
      })
    } else {
      setNotificationState({
        state: 'error',
        message: 'Failed to refresh data',
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
