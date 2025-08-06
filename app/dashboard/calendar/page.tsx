import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createClient } from '@/lib/db/server'
import { AlertCircle, Calendar, Clock, Users } from 'lucide-react'
import { DateTime } from 'luxon'
import AddMeeting from './add-meeting'
import CalendarApp from './calendar'
import EditMeeting from './edit-meeting'
import ManageMeetingsButton from './manage-meetings'

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
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Bookings
            </CardTitle>
            <CardDescription>
              There was an issue loading your calendar data. Please try
              refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // EST time to UTC ISO string
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
    type: string
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
          type: booking.type,
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
          type: booking.type,
        }

        acc.incompleteMeetings.push(event)
      }
      return acc
    },
    { validEvents: [], incompleteMeetings: [], closingEvents: [] },
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-night-midnight via-night-dusk to-night-twilight">
      {/* Header Section */}
      <div className="border-b border-border/50 bg-card/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                Calendar Management
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Manage your meetings, schedules, and client interactions
              </p>
            </div>
            {/* <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Calendar className="mr-2 h-3 w-3" />
                {validEvents.length} Meetings
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                <Users className="mr-2 h-3 w-3" />
                {closingEvents.length} Closings
              </Badge>
              {incompleteMeetings.length > 0 && (
                <Badge variant="destructive" className="px-3 py-1">
                  <AlertCircle className="mr-2 h-3 w-3" />
                  {incompleteMeetings.length} Pending
                </Badge>
              )}
            </div> */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Incomplete Meetings Section */}
          {incompleteMeetings.length > 0 && (
            <section>
              <Card className="border-destructive/20 bg-card/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Meetings Without Scheduled Times
                  </CardTitle>
                  <CardDescription>
                    These meetings need time slots assigned. Click on each
                    meeting to schedule them.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {incompleteMeetings.map((meeting) => (
                      <Card
                        key={meeting.id}
                        className="group border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10 transition-all hover:border-destructive/40 hover:shadow-lg"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                              <CardTitle className="text-base font-medium text-foreground">
                                {meeting.title}
                              </CardTitle>
                            </div>
                          </div>
                          <CardDescription>
                            Client{' '}
                            <strong className="text-foreground">
                              {meeting.people[0]}
                            </strong>{' '}
                            requested a custom meeting time
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <EditMeeting
                            meetingId={meeting.id}
                            meetingTitle={meeting.title}
                            startTime={meeting.start}
                            endTime={meeting.end}
                            notes={meeting.notes}
                            mediabuyer={meeting.pod}
                            pods={pods}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Main Calendar Section */}
          <section>
            <Card className="bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Calendar className="h-6 w-6" />
                  Main Calendar
                </CardTitle>
                <div className="space-y-2">
                  <CardDescription>
                    View and manage all your regular meetings and onboarding
                    sessions.
                  </CardDescription>
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                    <h4 className="mb-2 font-medium text-foreground">
                      Important Notes:
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        The calendar automatically converts to your timezone
                        (e.g., UK shows BST)
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        All meetings are added/edited in EST timezone regardless
                        of your local timezone
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        Shows all meetings excluding closing meetings
                        (onboarding & manual meetings)
                      </li>
                    </ul>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-wrap gap-3">
                  <ManageMeetingsButton events={validEvents} pods={pods} />
                  <AddMeeting pods={pods} />
                </div>
                <div className="overflow-hidden rounded-lg border border-border/50">
                  <CalendarApp events={validEvents} pods={pods} />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Closing Calendar Section */}
          <section>
            <Card className="bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Users className="h-6 w-6" />
                  Closing Calendar
                </CardTitle>
                <div className="space-y-2">
                  <CardDescription>
                    Manage closing meetings with your clients. Share the booking
                    link for client self-scheduling.
                  </CardDescription>
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                    <h4 className="mb-2 font-medium text-foreground">
                      Important Notes:
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        The calendar automatically converts to your timezone
                        (e.g., UK shows BST)
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        All meetings are added/edited in EST timezone regardless
                        of your local timezone
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        For client bookings, share:{' '}
                        <a
                          href="https://automize.vercel.app/booking-form"
                          target="_blank"
                          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                        >
                          booking link
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-wrap gap-3">
                  <ManageMeetingsButton
                    events={closingEvents}
                    pods={pods}
                    closing
                  />
                  <AddMeeting pods={pods} closing />
                </div>
                <div className="overflow-hidden rounded-lg border border-border/50">
                  <CalendarApp events={closingEvents} pods={pods} />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
