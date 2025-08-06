'use client'

import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from '@schedule-x/calendar'
import { createCurrentTimePlugin } from '@schedule-x/current-time'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import {
  ScheduleXCalendar,
  useNextCalendarApp,
} from '@schedule-x/react/dist/index'
import '@schedule-x/theme-default/dist/index.css'
import { useState } from 'react'

import DeleteItem from '@/components/actions/delete-item'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, ExternalLink, User } from 'lucide-react'
import Link from 'next/link'
import EditMeeting from './edit-meeting'
import './theme.css'

interface CalendarEvent {
  id: string
  title: string
  people: string[]
  start: string
  end: string
  link: string
  notes: string
  pod: string
  type: string
}

interface CalendarAppProps {
  events: CalendarEvent[]
  pods: any
}

function CalendarApp({ events, pods }: CalendarAppProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const plugins = [createEventsServicePlugin(), createCurrentTimePlugin()]

  // calendar.tsx
  // In your calendar component
  const formatUTCToLocal = (utcDate: string) => {
    if (!utcDate) return ''

    const date = new Date(utcDate)
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  // Process events before passing to calendar
  const processedEvents = events.map((event) => ({
    ...event,
    start: formatUTCToLocal(event.start),
    end: formatUTCToLocal(event.end),
  }))

  const calendar = useNextCalendarApp(
    {
      views: [
        createViewDay(),
        createViewWeek(),
        createViewMonthGrid(),
        createViewMonthAgenda(),
      ],
      events: processedEvents,
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
    <div className="calender relative">
      <ScheduleXCalendar calendarApp={calendar} />

      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl border-border/50 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Calendar className="h-5 w-5" />
                    {selectedEvent.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <User className="mr-1 h-3 w-3" />
                      {selectedEvent.people}
                    </Badge>
                    {selectedEvent.pod && (
                      <Badge variant="outline" className="text-xs">
                        Pod: {selectedEvent.pod}
                      </Badge>
                    )}
                    {selectedEvent.type && (
                      <Badge
                        variant={
                          selectedEvent.type === 'closing'
                            ? 'destructive'
                            : 'default'
                        }
                        className="text-xs"
                      >
                        {selectedEvent.type}
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Meeting Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Meeting Time</p>
                    <p className="text-sm text-muted-foreground">
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
                  </div>
                </div>

                {selectedEvent.notes && selectedEvent.notes !== 'N/A' && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                    <p className="mb-1 text-sm font-medium">Notes</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.notes}
                    </p>
                  </div>
                )}

                {/* Meeting Link */}
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                  <p className="mb-2 text-sm font-medium">Meeting Link</p>
                  <a
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                    target="_blank"
                    href={
                      selectedEvent.type === 'closing'
                        ? 'https://insightxmedia.daily.co/closing'
                        : 'https://insightxmedia.daily.co/Onboarding'
                    }
                  >
                    <ExternalLink className="h-3 w-3" />
                    {selectedEvent.type === 'closing'
                      ? 'https://insightxmedia.daily.co/closing'
                      : 'https://insightxmedia.daily.co/Onboarding'}
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="order-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80 sm:order-1"
                >
                  Close
                </button>

                <div className="order-1 flex flex-wrap gap-2 sm:order-2">
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-1">
                    <DeleteItem table="booking" id={selectedEvent.id} filled />
                  </div>

                  <div className="rounded-lg border border-border/50 bg-muted/20 p-1">
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
                  </div>

                  <Link
                    href={selectedEvent.link}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                    target="_blank"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Meeting
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default CalendarApp
