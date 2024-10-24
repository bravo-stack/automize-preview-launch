'use client'

import { deleteSheet } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import NotificationModal from '@/components/NotificationModal'

interface SheetInfoProps {
  links: string[]
  data: any
  pod: string
}

export default function SheetInfo({ links, data, pod }: SheetInfoProps) {
  const { sheet, lastRefresh } = data
  const [activeSection, setActiveSection] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const [notificationState, setNotificationState] = useState<{
    state: string
    message: string
  } | null>(null)

  const router = useRouter()

  const handleDelete = async () => {
    await deleteSheet(sheet.sheet_id)
    router.push('/dashboard/pods')
  }

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
              className="mr-3 rounded bg-white px-3 py-2 font-medium text-black"
            >
              Refresh General
            </button>

            <button
              onClick={handleROASRefresh}
              className="mr-3 rounded bg-white px-3 py-2 font-medium text-black"
            >
              Refresh ROAS
            </button>

            <button
              onClick={handleLowRefresh}
              className="rounded bg-rose-950 px-3 py-2 font-medium text-white"
            >
              Refresh Low ROAS
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
