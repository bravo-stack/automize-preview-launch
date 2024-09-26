'use client'

import { useState } from 'react'
import { financialize } from '@/lib/actions'
import NotificationModal from './NotificationModal'

export default function FinancialX({ stores }: { stores: any[] }) {
  const [notificationState, setNotificationState] = useState<{
    state: string
    message: string
  } | null>(null)

  const handleRefresh = async () => {
    setNotificationState({ state: 'loading', message: 'Refreshing data...' })
    const data = await financialize(stores)

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
        Refresh Data
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
