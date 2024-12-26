'use client'

import { useState, useEffect } from 'react'
import { updateItem } from '@/lib/actions/db'

interface RescheduleMeetingButtonProps {
  meetingId: string
  meetingTitle: string
  meetingTime: string
}

export default function RescheduleMeetingButton({
  meetingId,
  meetingTitle,
  meetingTime,
}: RescheduleMeetingButtonProps) {
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [newDateTime, setNewDateTime] = useState<string>('')
  const [minDateTime, setMinDateTime] = useState<string>('')

  useEffect(() => {
    const now = new Date()
    const isoString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setMinDateTime(isoString)
  }, [])

  const handleRescheduleClick = () => {
    setIsRescheduling(true)
  }

  const handleConfirm = async () => {
    try {
      if (!newDateTime) {
        alert('Please select a valid date and time.')
        return
      }
      const success = await updateItem(
        'bookings',
        { time: newDateTime },
        meetingId,
      )
      if (success) {
        console.log(`Successfully rescheduled meeting with ID: ${meetingId}`)
        // Refresh the page
        window.location.reload()
      } else {
        console.error(`Failed to reschedule meeting with ID: ${meetingId}`)
      }
    } catch (error) {
      console.error('Error rescheduling meeting:', error)
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleCancel = () => {
    setIsRescheduling(false)
  }

  return (
    <>
      <button
        onClick={handleRescheduleClick}
        className="rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
      >
        Reschedule
      </button>

      {isRescheduling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-md rounded-lg bg-night-dusk p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-white">
              Reschedule Meeting
            </h2>
            <p className="mb-4 text-sm text-gray-400">
              Reschedule the meeting for <strong>{meetingTitle}</strong>{' '}
              currently scheduled at <strong>{meetingTime}</strong>.
            </p>
            <div className="mb-4">
              <label
                htmlFor="newDateTime"
                className="block text-sm font-semibold text-gray-400"
              >
                New Date and Time
              </label>
              <input
                type="datetime-local"
                id="newDateTime"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                min={minDateTime}
                className="mt-2 w-full rounded border-gray-300 px-4 py-2 text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancel}
                className="rounded bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
