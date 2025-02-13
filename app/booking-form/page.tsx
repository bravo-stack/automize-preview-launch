import Image from 'next/image'
import BookingForm from './booking-form'
import img from '@/public/ixm.jpeg'
import { createClient } from '@/lib/db/server'
import { format, parseISO } from 'date-fns'

export const metadata = {
  title: 'InsightX Media - Booking Form',
}

export default async function OnboardingFormPage() {
  const db = createClient()

  const { data: bookings } = await db
    .from('booking')
    .select('*')
    .eq('type', 'closing')
    .not('start_time', 'is', null)
    .not('end_time', 'is', null)

  const parsedBookings = bookings?.map((item) => {
    const start = parseISO(item.start_time)
    const end = parseISO(item.end_time)

    return [
      format(start, 'MM/dd/yyyy'), // Date in MM/DD/YYYY format
      `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`, // Time range in HH:mm - HH:mm format
    ]
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 px-2 py-20 md:p-20">
      {/* IXM Logo */}
      <Image
        src={img}
        alt="InsightX Media logo"
        className="mx-auto mb-2.5 w-48 rounded-md md:w-64"
      />

      <BookingForm existingTimeSlots={parsedBookings || []} />
    </main>
  )
}
