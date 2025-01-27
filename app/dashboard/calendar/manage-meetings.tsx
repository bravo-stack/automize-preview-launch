'use client'

import { useState } from 'react'
import CancelMeetingButton from './cancel-meeting'
import RescheduleMeetingButton from './edit-meeting'
import EditMeeting from './edit-meeting'

interface ManageMeetingsButtonProps {
  events: {
    id: string
    title: string
    people: string[]
    start: string
    end: string
    notes: string
    pod: string
  }[]
  pods: any
}

function formatDateTime(dateTime: string): string {
  const date = new Date(dateTime)
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function ManageMeetingsButton({
  events,
  pods,
}: ManageMeetingsButtonProps) {
  const [isManagingMeetings, setIsManagingMeetings] = useState(false)

  const handleOpen = () => setIsManagingMeetings(true)
  const handleClose = () => setIsManagingMeetings(false)

  return (
    <>
      <button
        onClick={handleOpen}
        className="my-2 mb-5 rounded-md  bg-neutral-800/50 px-5 py-3  text-neutral-400 transition-all hover:bg-neutral-800"
      >
        Manage Meetings
      </button>

      {isManagingMeetings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-11/12 max-w-2xl rounded-lg bg-night-dusk shadow-lg">
            {/* Close Button */}
            <button
              className="absolute right-4 top-4 text-xl font-bold text-gray-500 hover:text-gray-800"
              onClick={handleClose}
            >
              &times;
            </button>

            <div className="flex flex-col space-y-4 p-6">
              <h2 className="text-lg font-bold text-white">Manage Meetings</h2>

              <div className="max-h-96 overflow-y-auto">
                {events.length > 0 ? (
                  <ul>
                    {events.map((meeting, index) => (
                      <li
                        key={meeting.id}
                        className={`pb-4 ${index !== events.length - 1 ? 'mb-3 border-b border-gray-600  ' : ''}`}
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
                          <EditMeeting
                            meetingId={meeting.id}
                            meetingTitle={meeting.title}
                            startTime={meeting.start}
                            endTime={meeting.end}
                            notes={meeting.notes}
                            mediabuyer={meeting.pod}
                            pods={pods}
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
      )}
    </>
  )
}
