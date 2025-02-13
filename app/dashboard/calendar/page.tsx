import { DateTime } from 'luxon'
import { createClient } from '@/lib/db/server'
import CalendarApp from './calendar'
import ManageMeetingsButton from './manage-meetings'
import EditMeeting from './edit-meeting'
import AddMeeting from './add-meeting'

export default async function Page() {
  const db = createClient()

  const { data: bookings, error: bookingsError } = await db
    .from('booking')
    .select('id, pod, name, start_time, end_time, notes, type, clients (brand)')

  const { data: pods } = await db
    .from('pod')
    .select('id, name, discord_id, user_id')
    .order('name')

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError)
    return <p>Failed to load bookings.</p>
  }

  // Convert EST time to UTC ISO string
  const parseEstToUTC = (dateStr: string) => {
    return DateTime.fromISO(dateStr, { zone: 'America/New_York' })
      .toUTC()
      .toISO({ suppressMilliseconds: true })
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

  const { validEvents, incompleteMeetings, closingEvents } = bookings.reduce<{
    validEvents: Event[]
    incompleteMeetings: Event[]
    closingEvents: Event[]
  }>(
    (acc, booking) => {
      if (booking.start_time && booking.end_time) {
        const event = {
          id: booking.id?.toString() || 'N/A',
          title: booking.name || 'N/A',
          people: [(booking.clients as any)?.brand || 'N/A'],
          start: parseEstToUTC(booking.start_time),
          end: parseEstToUTC(booking.end_time),
          notes: booking.notes || 'N/A',
          link: `/meeting/${booking.id}`,
          pod: booking.pod,
        }

        if (booking.type === 'closing') {
          acc.closingEvents.push(event)
        } else {
          acc.validEvents.push(event)
        }
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
    { validEvents: [], incompleteMeetings: [], closingEvents: [] },
  )

  return (
    <main className="space-y-20 p-7">
      <section className="mx-auto max-w-7xl">
        <ManageMeetingsButton events={validEvents} pods={pods} />
        <AddMeeting pods={pods} />

        <div className="my-7 grid grid-cols-3 gap-2.5">
          <h2 className="col-span-full text-2xl font-semibold">
            Meetings Without Scheduled Times
          </h2>
          {incompleteMeetings.length > 0 ? (
            incompleteMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="group mt-4 rounded-lg border border-zinc-800 bg-night-starlit p-4"
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
            ))
          ) : (
            <p className="col-span-full text-lg">
              No meetings without scheduled times
            </p>
          )}
        </div>
      </section>

      <section>
        <hgroup className="mb-4">
          <h2 className="mb-2 text-2xl font-semibold">Main Calendar</h2>
          <p>IMPORTANT:</p>
          <p>
            1. The calendar is automatically converted to your timezone. E.g.,
            if you are in the UK, the calendar is in BST.
          </p>
          <p>
            2. All meetings added/edited are automatically in EST timezone. They
            are NOT added based on local timezone.
          </p>
        </hgroup>
        <CalendarApp events={validEvents} pods={pods} />
      </section>

      <section>
        <hgroup className="mb-4">
          <h2 className="mb-2 text-2xl font-semibold">Closing Calendar</h2>
          <p>IMPORTANT:</p>
          <p>
            1. The calendar is automatically converted to your timezone. E.g.,
            if you are in the UK, the calendar is in BST.
          </p>
          <p>
            2. All meetings added/edited are automatically in EST timezone. They
            are NOT added based on local timezone.
          </p>
          <p>
            3. To allow clients to book closing meetings, send them this link:{' '}
            <a
              href="https://automize.vercel.app/booking-form"
              target="_blank"
              className="font-medium underline"
            >
              https://automize.vercel.app/booking-form
            </a>
          </p>
        </hgroup>
        <CalendarApp events={closingEvents} pods={pods} />
      </section>
    </main>
  )
}
