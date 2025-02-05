'use client'

export function AddToCalendarButton({
  startTime,
  endTime,
  meetingId,
  title = 'InsightXMedia Onboarding',
}: {
  startTime: string
  endTime: string
  meetingId: string
  title?: string
}) {
  const handleAddToCalendar = () => {
    // Format dates to ICS specification
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
      'DESCRIPTION:Your scheduled meeting with InsightXMedia',
      'LOCATION:Online Meeting',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    // Create data URL and trigger calendar prompt
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
