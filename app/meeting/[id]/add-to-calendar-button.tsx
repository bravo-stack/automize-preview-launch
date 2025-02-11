'use client'

import { DateTime } from 'luxon'

export function AddToCalendarButton({
  startTime,
  endTime,
  meetingId,
  title = 'IXM Meeting',
}: {
  startTime: string
  endTime: string
  meetingId: string
  title?: string
}) {
  const handleAddToCalendar = () => {
    const meetingUrl = `${window.location.origin}/meeting/${meetingId}`

    // Convert stored EST times to UTC
    const startUtc = DateTime.fromISO(startTime, {
      zone: 'America/New_York',
    }).toUTC()
    const endUtc = DateTime.fromISO(endTime, {
      zone: 'America/New_York',
    }).toUTC()

    // Format as YYYYMMDDTHHMMSSZ for ICS
    const start = startUtc.toFormat("yyyyMMdd'T'HHmmss'Z'")
    const end = endUtc.toFormat("yyyyMMdd'T'HHmmss'Z'")

    // Construct ICS file content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `UID:${meetingId}@insightxmedia.com`,
      `SUMMARY:${title}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `DESCRIPTION:Meeting Link: ${meetingUrl}\\n\\nYou can join the meeting at the scheduled time using this link.`,
      `URL:${meetingUrl}`,
      'LOCATION:Online Meeting',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    // Create downloadable ICS file
    const data = encodeURIComponent(icsContent)
    const link = document.createElement('a')
    link.href = `data:text/calendar;charset=utf8,${data}`
    link.download = `${title}.ics`
    link.click()
  }

  return (
    <button
      onClick={handleAddToCalendar}
      className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Add to Calendar
    </button>
  )
}
