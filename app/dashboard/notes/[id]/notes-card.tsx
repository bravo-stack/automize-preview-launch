'use client'

import { useState } from 'react'
import EditNotes from '../editNotes'

const NotesCard = ({ notes, client }) => {
  return (
    <div className="col-span-full rounded-md border border-zinc-900 bg-night-starlit p-5">
      <div className="flex justify-between">
        <h2 className="font-semibold tracking-tighter">Stored Notes</h2>

        <EditNotes client={client} />
      </div>

      <div className="mt-2 space-y-2">
        {notes.map((note, index) => (
          <CollapsibleNote
            key={index}
            heading={note.heading}
            content={note.content}
          />
        ))}
      </div>
    </div>
  )
}

const CollapsibleNote = ({ heading, content }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={`border-b  ${isOpen ? 'rounded-t-md border-zinc-800 bg-night-dusk' : 'border-zinc-900 hover:border-zinc-800'}`}
    >
      <button
        className="flex w-full items-center justify-between p-2 text-sm font-medium tracking-tight 2xl:text-base"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{heading}</span>
        <span
          className={`transition-all duration-500 ${isOpen ? 'rotate-180 text-white' : 'text-zinc-700'}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5 "
          >
            <path
              fillRule="evenodd"
              d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="p-2 text-neutral-100 2xl:text-sm">
          {content || 'N/A'}
        </div>
      )}
    </div>
  )
}

export default NotesCard
