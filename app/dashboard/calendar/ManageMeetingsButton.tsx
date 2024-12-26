'use client'

import { useState } from 'react'
import ManageMeetings from './ManageMeetings'

interface ManageMeetingsButtonProps {
  events: {
    id: string
    title: string
    people: string[]
    start: string
    end: string
  }[]
}

export default function ManageMeetingsButton({
  events,
}: ManageMeetingsButtonProps) {
  const [isManagingMeetings, setIsManagingMeetings] = useState(false)

  // Open and close modal handlers
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
        <ManageMeetings events={events} onClose={handleClose} />
      )}
    </>
  )
}
