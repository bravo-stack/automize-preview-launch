import { createClient } from '@/lib/db/server'
import CalendarApp from './calendar'
import ManageMeetingsButton from './manage-meetings'
import EditMeeting from './edit-meeting'
import AddMeeting from './add-meeting'

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

  // Format date function
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  type Event = {
    id: string
    title: string
    people: string[]
    start: string
    end: string
    notes: string
    link: string
    pod: string
  }

  const { validEvents, incompleteMeetings } = bookings.reduce<{
    validEvents: Event[]
    incompleteMeetings: Event[]
  }>(
    (acc, booking) => {
      if (booking.start_time && booking.end_time) {
        const event = {
          id: booking.id?.toString() || 'N/A',
          title: booking.name || 'N/A',
          people: [(booking.clients as any)?.brand || 'N/A'],
          start: formatDate(booking.start_time),
          end: formatDate(booking.end_time),
          notes: booking.notes || 'N/A',
          link: `/meeting/${booking.id}`,
          pod: booking.pod,
        }
        acc.validEvents.push(event)
      } else {
        const event = {
          id: booking.id?.toString() || 'N/A',
          title: booking.name || 'N/A',
          people: [(booking.clients as any)?.brand || 'N/A'],
          start: '',
          end: '',
          notes: booking.notes || 'N/A',
          link: `/meeting/${booking.id}`,
          pod: booking.pod,
        }
        acc.incompleteMeetings.push(event)
      }

      return acc
    },
    { validEvents: [], incompleteMeetings: [] },
  )

  return (
    <main className="space-y-7 p-7">
      <section className="mx-auto max-w-7xl">
        <ManageMeetingsButton events={validEvents} pods={pods} />
        <AddMeeting pods={pods} />

        <div className="my-7 grid grid-cols-3 gap-2.5">
          <h2 className="col-span-full mb-4 text-xl font-semibold">
            Meetings Without Scheduled Times
          </h2>
          {incompleteMeetings.length > 0 &&
            incompleteMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="group rounded-lg border border-zinc-800 bg-night-starlit p-4"
              >
                <hgroup>
                  <h3 className="font-medium">
                    <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500 " />
                    {meeting.title}
                  </h3>
                  <p className="mb-2.5">
                    Client <strong>{meeting.people[0]}</strong> requested a
                    custom meeting time
                  </p>
                </hgroup>

                <EditMeeting
                  meetingId={meeting.id}
                  meetingTitle={meeting.title}
                  startTime={meeting.start}
                  endTime={meeting.end}
                  notes={meeting.notes}
                  mediabuyer={meeting.pod}
                  pods={pods}
                />
              </div>
            ))}
        </div>

        <CalendarApp events={validEvents} pods={pods} />
      </section>
    </main>
  )
}
