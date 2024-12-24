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

  // Fetch all clients to map their brands
  const { data: clients, error: clientsError } = await db
    .from('clients')
    .select('*')

  if (clientsError) {
    console.error('Error fetching clients:', clientsError)
    return <p>Failed to load client data.</p>
  }

  // Map client_id to brand
  const clientMap = clients.reduce((map, client) => {
    map[client.id] = client.brand
    return map
  }, {})

  // Transform bookings to include the required event fields
  const events = bookings.map((booking) => {
    const startDate = new Date(booking.time.toLocaleString())
    const endDate = new Date(startDate.getTime() + booking.duration * 60000)

    // Format date into 'YYYY-MM-DD HH:mm'
    const formatDate = (date: Date) =>
      date.toISOString().slice(0, 16).replace('T', ' ')

    return {
      id: booking.id.toString(),
      title: clientMap[booking.client_id] || 'Unknown', // Use brand name as the title
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
