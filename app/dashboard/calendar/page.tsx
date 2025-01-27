import { createClient } from '@/lib/db/server'
import CalendarApp from './calendar'
import ManageMeetingsButton from './manage-meetings'

export default async function Page() {
  const db = createClient()

  const { data: bookings, error: bookingsError } = await db
    .from('booking')
    .select('id, pod, name, start_time, end_time, notes, clients (brand)')

  const { data: pods } = await db
    .from('pod')
    .select('id, name, discord_id, user_id')
    .order('name')

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError)
    return <p>Failed to load bookings.</p>
  }

  // Transform bookings to include the required event fields
  const events = bookings.map((booking) => {
    // Format date into 'YYYY-MM-DD HH:mm' without timezone conversion
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}`
    }

    return {
      id: booking.id?.toString() || 'N/A',
      title: booking.name || 'N/A',
      people: [(booking.clients as any)?.brand || 'N/A'],
      start: formatDate(booking.start_time),
      end: formatDate(booking.end_time),
      notes: booking.notes || 'N/A',
      link: `/meeting/${booking.id}`,
      pod: booking.pod,
    }
  })

  return (
    <main className="space-y-7 p-7">
      <section className="mx-auto max-w-7xl">
        <ManageMeetingsButton events={events} pods={pods} />
        <CalendarApp events={events} pods={pods} />
      </section>
    </main>
  )
}
