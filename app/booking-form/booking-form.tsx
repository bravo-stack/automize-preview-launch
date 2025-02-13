'use client'

import TimeSelector from '@/components/booking/time-selector'
import { createItem } from '@/lib/actions/db'
import { normalizeToStartOfDay } from '@/lib/utils'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function BookingForm({ existingTimeSlots }) {
  const [clientName, setClientName] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [timeSlots, setTimeSlots] = useState<
    { time: string; available: boolean }[]
  >([])

  const [success, setSuccess] = useState<boolean | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookingID, setBookingID] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedDate === null || selectedTimeSlot === null) {
      toast.error('Missing information!')
      return
    }

    setLoading(true) // Disable submit button and show spinner

    let bookingData
    if (selectedTimeSlot !== 'contact') {
      const date = new Date(selectedDate)
      const [year, month, day] = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      ]
      const [hour, minute] = selectedTimeSlot.split(':').map(Number)
      // Use UTC methods to prevent timezone conversion
      const combinedDate = new Date(
        Date.UTC(year, month - 1, day, hour, minute),
      )
      const oneHourLater = new Date(
        Date.UTC(year, month - 1, day, hour + 1, minute),
      )
      bookingData = {
        name: `Closing for ${clientName}`,
        start_time: combinedDate,
        end_time: oneHourLater,
        type: 'closing',
        notes,
      }
    } else {
      bookingData = {
        name: `Onboarding for ${clientName}`,
        start_time: null,
        end_time: null,
        type: 'closing',
        notes,
      }
    }

    const {
      data: { id },
      error,
    } = await createItem('booking', bookingData)

    setBookingID(id)
    setLoading(false)
    setSuccess(!error)
  }

  // BOOKING LOGIC

  const totalDuration = 75
  const generateTimeSlots = useCallback(() => {
    const availableTimeSlots: { time: string; available: boolean }[] = []
    const today = new Date()
    const currentDate = selectedDate || today
    const currentTime = today.getHours() * 60 + today.getMinutes()

    // Convert existing time slots into a more manageable format
    const existingSlots = existingTimeSlots.map((slot: [any, any]) => {
      const [date, timeRange] = slot
      const [startTime, endTime] = timeRange.split(' - ')
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const [endHour, endMinute] = endTime.split(':').map(Number)
      const slotDate = new Date(date)
      slotDate.setHours(startHour)
      slotDate.setMinutes(startMinute)
      const slotStartTime = slotDate.getHours() * 60 + slotDate.getMinutes()
      slotDate.setHours(endHour)
      slotDate.setMinutes(endMinute)
      const slotEndTime = slotDate.getHours() * 60 + slotDate.getMinutes()
      return { date, slotStartTime, slotEndTime }
    })

    // Generate time slots from 8:45AM to 7:00PM in 15-minute intervals, excluding 3:00-5:00PM
    for (let i = 8 * 60 + 45; i <= 19 * 60; i += 75) {
      // Skip time slots between 3:00PM and 5:00PM
      if (i >= 14 * 60 && i < 17 * 60) continue

      const hour = Math.floor(i / 60)
      const minute = (i % 60).toString().padStart(2, '0')
      const time = `${hour}:${minute}`

      // Check if the time slot conflicts with existing time slots or it's in the past
      const isAvailable =
        (selectedDate !== null || i > currentTime) &&
        normalizeToStartOfDay(currentDate) >= normalizeToStartOfDay(today) &&
        !existingSlots.some(
          ({ date, slotStartTime, slotEndTime }) =>
            date ===
              currentDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              }) &&
            i >= slotStartTime &&
            i <= slotEndTime,
        ) // Check past times if it's today

      // Check if the total duration can fit before the next unavailable slot
      if (isAvailable) {
        const canFit = !existingSlots.some(
          ({
            date,
            slotStartTime,
            slotEndTime,
          }: {
            date: string
            slotStartTime: number
            slotEndTime: number
          }) => {
            // if td then set unavailable
            if (date !== currentDate.toLocaleDateString()) {
              return false
            }
            // if out of bounds then set unavailable
            if (i < slotStartTime && i + totalDuration * 60 > slotStartTime)
              return true

            return false
          },
        )

        availableTimeSlots.push({ time, available: canFit })
      } else {
        availableTimeSlots.push({ time, available: false })
      }
    }

    return availableTimeSlots
  }, [existingTimeSlots, selectedDate, totalDuration])

  useEffect(() => {
    if (selectedDate) {
      setTimeSlots(generateTimeSlots())
    }
  }, [generateTimeSlots, selectedDate])

  if (success === true) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded bg-white px-2.5 py-5 text-center md:p-10">
        <h1 className="text-4xl font-bold text-green-600">Thank You!</h1>

        {selectedTimeSlot === 'contact' ? (
          <>
            <p className="mt-4 text-pretty text-center text-neutral-600 md:text-lg">
              Your onboarding form has been received and is currently being
              processed into our system. Our team has recieved your request for
              a custom meeting time and will be in touch.
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 text-pretty text-center text-neutral-600 md:text-lg">
              Your onboarding form has been received and is currently being
              processed into our system. Please visit the link below to track
              and join your meeting booked at{' '}
              <span className="font-semibold">
                {selectedDate.toDateString()} {selectedTimeSlot}
              </span>
              .
            </p>
            <Link
              href={`/meeting/${bookingID}`}
              target="_blank"
              className="mt-4 text-pretty rounded-full border border-green-700 bg-green-500 p-5 text-center font-medium text-white md:text-xl"
            >
              Meeting Link
            </Link>
          </>
        )}
      </div>
    )
  }

  if (success === false) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded bg-white px-2.5 py-5 text-center md:p-10">
        <h1 className="text-4xl font-bold text-neutral-900">Sorry!</h1>
        <p className="mt-4 text-pretty text-center text-neutral-600 md:text-lg">
          There was an issue with the form submission. Please contact our team
          and we&apos;ll have it sorted for you.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl divide-y divide-neutral-300 rounded bg-neutral-100 text-neutral-900 shadow-md shadow-neutral-300/50"
    >
      <div className="px-3.5 py-7 md:p-10">
        <h1 className="text-2xl font-semibold md:text-4xl">
          MEETING BOOKING FORM
        </h1>
        <p className="font-medium text-neutral-600">
          Welcome to InsightX Media&apos;s meeting booking form. Please fill
          this form to set an appointment.
        </p>
      </div>

      <div className="grid px-3.5 py-7 md:grid-cols-2 md:p-10">
        <p className="col-span-full mb-2.5 text-lg font-medium">
          Your Name <span className="text-red-500">*</span>
        </p>
        <div className="mb-7">
          <input
            type="text"
            name="clientName"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
          />
        </div>

        <p className="col-span-full mb-2.5 text-lg font-medium">
          Meeting Notes (optional)
        </p>
        <div className="col-span-full mb-7">
          <textarea
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
            rows={3}
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
          />
        </div>

        <p className="col-span-full mb-2.5 mt-7 text-lg font-medium">
          Schedule A Meeting <span className="text-red-500">*</span>
        </p>
        <TimeSelector
          selectedDate={selectedDate}
          onDateChange={(date) => setSelectedDate(date)}
          availableTimeSlots={timeSlots}
          onSelectTimeSlot={(timeslot) => setSelectedTimeSlot(timeslot)}
          selectedTimeSlot={selectedTimeSlot}
        />
      </div>

      <div className="flex justify-between px-3.5 py-7 md:p-10">
        <button
          type="button"
          onClick={handleSubmit}
          className={`block rounded-md bg-green-600 py-3 text-lg font-medium text-white ${loading ? 'px-7' : 'px-10'}`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              Submitting
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-spin"
                fill="white"
              >
                <path
                  d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
                  opacity=".25"
                />
                <path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z" />
              </svg>
            </div>
          ) : (
            'Submit'
          )}
        </button>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900">Missing Fields</h2>
            <p className="mt-4 text-sm text-gray-600">
              Please fill out the following required fields:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
              {selectedDate === null && <li>Meeting Date</li>}
              {selectedTimeSlot === null && <li>Meeting Time Slot</li>}
            </ul>
            <button
              onClick={() => setShowPopup(false)}
              className="mt-6 rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
