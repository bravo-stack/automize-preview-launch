'use client'

import { useEffect } from 'react'
import CancelMeetingButton from './CancelMeetingButton'
import RescheduleMeetingButton from './RescheduleMeetingButton'

interface ManageMeetingsProps {
  events: {
    id: string
    title: string
    people: string[]
    start: string
    end: string
  }[]
  onClose: () => void
}

export default function ManageMeetings({
  events,
  onClose,
}: ManageMeetingsProps) {
  useEffect(() => {
    const body = document.body
    body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = 'auto'
    }
  }, [])

  const upcomingMeetings = events
    .filter((event) => new Date(event.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-11/12 max-w-2xl rounded-lg bg-night-dusk shadow-lg">
        {/* Close Button */}
        <button
          className="absolute right-4 top-4 text-xl font-bold text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          &times;
        </button>

        <div className="flex flex-col space-y-4 p-6">
          <h2 className="text-lg font-bold text-white">Manage Meetings</h2>

          <div className="max-h-96 overflow-y-auto">
            {upcomingMeetings.length > 0 ? (
              <ul>
                {upcomingMeetings.map((meeting, index) => (
                  <li
                    key={meeting.id}
                    className={`pb-4 ${index !== upcomingMeetings.length - 1 ? 'mb-3 border-b border-gray-600  ' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-md font-semibold text-white">
                          {meeting.title}
                        </p>
                        <p className="text-sm text-gray-400">
                          Start: {formatDateTime(meeting.start)}
                        </p>
                        <p className="text-sm text-gray-400">
                          End: {formatDateTime(meeting.end)}
                        </p>
                        {meeting.people.length > 0 && (
                          <p className="text-sm text-gray-400">
                            Participants: {meeting.people.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-4">
                      <CancelMeetingButton
                        meetingId={meeting.id}
                        meetingTitle={meeting.title}
                        meetingTime={formatDateTime(meeting.start)}
                      />
                      <RescheduleMeetingButton
                        meetingId={meeting.id}
                        meetingTitle={meeting.title}
                        meetingTime={formatDateTime(meeting.start)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No upcoming meetings.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to format date and time
function formatDateTime(dateTime: string): string {
  const date = new Date(dateTime)
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
