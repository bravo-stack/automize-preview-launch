'use client'

import {
  ScheduleXCalendar,
  useNextCalendarApp,
} from '@schedule-x/react/dist/index'
import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { createCurrentTimePlugin } from '@schedule-x/current-time'
import '@schedule-x/theme-default/dist/index.css'
import { useState } from 'react'

import './theme.css'
import Link from 'next/link'
import EditMeeting from './edit-meeting'

interface CalendarEvent {
  id: string
  title: string
  people: string[]
  start: string
  end: string
  link: string
  notes: string
  pod: string
}

interface CalendarAppProps {
  events: CalendarEvent[]
  pods: any
}

function CalendarApp({ events, pods }: CalendarAppProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const plugins = [createEventsServicePlugin(), createCurrentTimePlugin()]

  const calendar = useNextCalendarApp(
    {
      views: [
        createViewDay(),
        createViewWeek(),
        createViewMonthGrid(),
        createViewMonthAgenda(),
      ],
      events,
      callbacks: {
        onEventClick(event) {
          handleEventClick(event)
        },
      },
    },
    plugins,
  )

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className="calender">
      <ScheduleXCalendar calendarApp={calendar} />

      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">{selectedEvent.title}</h2>

            <div className="space-y-1.5">
              <p>
                Meeting Time:{' '}
                {new Date(selectedEvent.start).toLocaleString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  weekday: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(selectedEvent.end).toLocaleString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p>Client: {selectedEvent.people}</p>
              <p>Notes: {selectedEvent.notes}</p>
              <p>Pod: {selectedEvent.pod || 'No pod assigned.'}</p>
            </div>

            <div className="mt-4 flex justify-between gap-2.5">
              <button
                type="button"
                onClick={handleCloseModal}
                className="block rounded-md bg-black px-4 py-2 text-white shadow-sm"
              >
                Close
              </button>

              <div className="flex gap-2">
                <EditMeeting
                  meetingId={selectedEvent.id}
                  meetingTitle={selectedEvent.title}
                  startTime={selectedEvent.start}
                  endTime={selectedEvent.end}
                  notes={selectedEvent.notes}
                  mediabuyer={selectedEvent.pod}
                  pods={pods}
                  normal
                />

                <Link
                  href={selectedEvent.link}
                  className="block rounded-md border border-black  px-4 py-2 shadow-sm"
                  target="_blank"
                >
                  Open Meeting Link
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarApp
