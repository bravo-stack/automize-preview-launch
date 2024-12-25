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

import '@schedule-x/theme-default/dist/index.css'

import './theme.css'

interface CalendarAppProps {
  events: {
    id: string
    title: string
    people: unknown
    start: string
    end: string
  }[]
}

function CalendarApp({ events }: CalendarAppProps) {
  const plugins = [createEventsServicePlugin()]

  const calendar = useNextCalendarApp(
    {
      views: [
        createViewDay(),
        createViewWeek(),
        createViewMonthGrid(),
        createViewMonthAgenda(),
      ],
      events, // Dynamically include events
    },
    plugins,
  )

  return (
    <div className="calender">
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  )
}

export default CalendarApp
