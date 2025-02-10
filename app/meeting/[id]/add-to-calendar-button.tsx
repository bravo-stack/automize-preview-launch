// components/add-to-calendar-button.tsx
'use client'

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
    // Generate meeting URL
    const meetingUrl = `${window.location.origin}/meeting/${meetingId}`

    // Format dates
    const start = new Date(startTime)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/g, '')
    const end = new Date(endTime)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/g, '')

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

    // Create data URL
    const data = encodeURIComponent(icsContent)
    const link = document.createElement('a')
    link.href = `data:text/calendar;charset=utf8,${data}`
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
