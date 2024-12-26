'use client'

import { useState } from 'react'
import { deleteItem } from '@/lib/actions/db'
interface CancelMeetingButtonProps {
  meetingId: string
  meetingTitle: string
  meetingTime: string
}

export default function CancelMeetingButton({
  meetingId,
  meetingTitle,
  meetingTime,
}: CancelMeetingButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleCancelClick = () => {
    setIsConfirming(true)
  }

  const handleConfirm = async () => {
    try {
      const success = await deleteItem('bookings', meetingId)
      if (success) {
        console.log(`Successfully cancelled meeting with ID: ${meetingId}`)
        // Refresh the page
        window.location.reload()
      } else {
        console.error(`Failed to cancel meeting with ID: ${meetingId}`)
      }
    } catch (error) {
      console.error('Error cancelling meeting:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancel = () => {
    setIsConfirming(false)
  }

  return (
    <>
      <button
        onClick={handleCancelClick}
        className="rounded bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
      >
        Cancel Meeting
      </button>

      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-md rounded-lg bg-night-dusk p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-white">
              Cancel Meeting
            </h2>
            <p className="mb-4 text-sm text-gray-400">
              Are you sure you want to cancel the meeting for{' '}
              <strong>{meetingTitle}</strong> at <strong>{meetingTime}</strong>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancel}
                className="rounded bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="rounded bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
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
