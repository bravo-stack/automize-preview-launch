'use client'

import { useState } from 'react'
import NotificationModal from '@/components/NotificationModal'

export default function RefreshPodButtons({ data, pod }) {
  const sheet = data
  const [notificationState, setNotificationState] = useState<{
    state: string
    message: string
  } | null>(null)

  const handleDataRefresh: () => Promise<void> = async () => {
    const sheetID = sheet.sheet_id
    const datePreset = sheet.refresh

    setNotificationState({ state: 'loading', message: 'Refreshing data...' })

    try {
      const response = await fetch('/api/pods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetID,
          datePreset,
          pod,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to refresh data')
      }
      const data = await response.json()
      console.log(data)
      setNotificationState({
        state: 'success',
        message: 'Data refreshed successfully!',
      })
    } catch (error) {
      console.error('Error fetching ad data:', error)
      setNotificationState({
        state: 'error',
        message: 'Failed to refresh data',
      })
    } finally {
      setTimeout(() => {
        setNotificationState(null)
      }, 5000)
    }
  }

  const handleROASRefresh: () => Promise<void> = async () => {
    const sheetID = sheet.sheet_id
    setNotificationState({ state: 'loading', message: 'Refreshing data...' })

    try {
      const response = await fetch('/api/roas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetID,
          pod,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to refresh data')
      }
      const data = await response.json()
      console.log(data)
      setNotificationState({
        state: 'success',
        message: 'Data refreshed successfully!',
      })
    } catch (error) {
      console.error('Error fetching ad data:', error)
      setNotificationState({
        state: 'error',
        message: 'Failed to refresh data',
      })
    } finally {
      setTimeout(() => {
        setNotificationState(null)
      }, 5000)
    }
  }

  const handleLowRefresh: () => Promise<void> = async () => {
    const sheetID = sheet.sheet_id
    setNotificationState({ state: 'loading', message: 'Refreshing data...' })

    try {
      const response = await fetch('/api/roas/low', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetID,
          pod,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to refresh data')
      }
      const data = await response.json()
      console.log(data)
      setNotificationState({
        state: 'success',
        message: 'Data refreshed successfully!',
      })
    } catch (error) {
      console.error('Error fetching ad data:', error)
      setNotificationState({
        state: 'error',
        message: 'Failed to refresh data',
      })
    } finally {
      setTimeout(() => {
        setNotificationState(null)
      }, 5000)
    }
  }

  return (
    <>
      <button
        onClick={handleDataRefresh}
        className="rounded border border-neutral-500 px-2 py-1.5 text-sm text-neutral-400 hover:bg-neutral-50/5 hover:text-neutral-300"
      >
        Refresh General
      </button>

      <button
        onClick={handleROASRefresh}
        className="rounded border border-neutral-500 px-2 py-1.5 text-sm text-neutral-400 hover:bg-neutral-50/5 hover:text-neutral-300"
      >
        Refresh ROAS
      </button>

      <button
        onClick={handleLowRefresh}
        className="rounded border border-neutral-500 px-2 py-1.5 text-sm text-neutral-400 hover:bg-neutral-50/5 hover:text-neutral-300"
      >
        Refresh Low ROAS
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
