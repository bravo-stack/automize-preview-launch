'use server'

import { createClient } from '@/lib/db/server'
import CalendarApp from './calendarUI'

export default async function Page() {
  const db = createClient()

  // Fetch bookings from the database
  const { data: bookings, error: bookingsError } = await db
    .from('bookings')
    .select('*')

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError)
    return <p>Failed to load bookings.</p>
  }

  // Transform bookings to include the required event fields
  const events = bookings.map((booking) => {
    const startDate = new Date(booking.time.toLocaleString())
    const duration = booking.duration || 60
    const endDate = new Date(startDate.getTime() + duration * 60000)

    // Format date into 'YYYY-MM-DD HH:mm'
    const formatDate = (date: Date) =>
      date.toISOString().slice(0, 16).replace('T', ' ')

    return {
      id: booking.id?.toString() || 'N/A',
      title: (booking.brand_name || booking.client_name || 'N/A').toString(),
      people: [booking.client_name.toString()],
      start: formatDate(startDate),
      end: formatDate(endDate),
    }
  })

  return (
    <main className="space-y-7 p-7">
      <section className="mx-auto max-w-7xl">
        <CalendarApp events={events} /> {/* Pass events to CalendarApp */}
      </section>
    </main>
  )
}
