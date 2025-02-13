'use client'

import { useState, useEffect } from 'react'
import { createItem, updateItem } from '@/lib/actions/db'
import { useRouter } from 'next/navigation'

export default function AddMeeting({ pods, closing = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState<string>('')
  const [newStartTime, setNewStartTime] = useState<string>('')
  const [newEndTime, setNewEndTime] = useState<string>('')
  const [newNotes, setNewNotes] = useState<string>('')
  const [minDateTime, setMinDateTime] = useState<string>('')
  const [pod, setPod] = useState('none')

  const router = useRouter()

  useEffect(() => {
    const now = new Date()
    const isoString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setMinDateTime(isoString)
  }, [])

  const handleRescheduleClick = () => {
    setIsEditing(true)
  }

  const handleConfirm = async () => {
    try {
      if (!newStartTime || !newEndTime) {
        alert('Please select valid start and end times.')
        return
      }

      const success = await createItem('booking', {
        name: meetingTitle,
        start_time: newStartTime,
        end_time: newEndTime,
        notes: newNotes,
        pod: pod === 'none' ? null : pod,
        type: closing ? 'closing' : null,
      })
      if (success) {
        router.refresh()
        alert(`Successfully created ${meetingTitle} meeting.`)
      } else {
        alert('Error updating meeting.')
        console.error(`Failed to reschedule meeting with ID: `)
      }
    } catch (error) {
      alert('Error updating meeting.')
      console.error('Error rescheduling meeting:', error)
    } finally {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  return (
    <>
      <button
        onClick={handleRescheduleClick}
        className="my-2 ml-2.5 rounded-md bg-neutral-800/50 px-5 py-3 text-neutral-400 transition-all hover:bg-neutral-800"
      >
        New {closing && 'Closing'} Meeting
      </button>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-1/2 max-w-xl rounded-lg bg-night-dusk p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-white">
              Reschedule Meeting
            </h2>

            <div className="mb-4">
              <label
                htmlFor="newEndTime"
                className="block text-sm font-semibold text-gray-400"
              >
                Meeting Title
              </label>
              <input
                id="meetingTitle"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="E.g. Filler"
                className="mt-2 w-full rounded border-gray-300 px-4 py-2 text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="newStartTime"
                className="block text-sm font-semibold text-gray-400"
              >
                New Start Date and Time
              </label>
              <input
                type="datetime-local"
                id="newStartTime"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                min={minDateTime}
                className="mt-2 w-full rounded border-gray-300 px-4 py-2 text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="newEndTime"
                className="block text-sm font-semibold text-gray-400"
              >
                New End Date and Time
              </label>
              <input
                type="datetime-local"
                id="newEndTime"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                min={newStartTime}
                className="mt-2 w-full rounded border-gray-300 px-4 py-2 text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-400">
                Pod
              </label>
              <select
                value={pod}
                onChange={(e) => setPod(e.target.value)}
                className="mt-2 w-full rounded border-gray-300 px-4 py-2 text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              >
                <option value="none">None</option>
                {pods.map((pod, index) => (
                  <option key={index} value={pod.name}>
                    {pod.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="newNotes"
                className="block text-sm font-semibold text-gray-400"
              >
                Notes (Optional)
              </label>
              <textarea
                id="newNotes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={3}
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
