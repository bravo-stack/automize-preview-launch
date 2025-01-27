'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { addHours, convertTo12HourFormat } from '@/lib/utils'
import { createClient } from '@/lib/db/client'
import NotificationModal from './NotificationModal'
import TimeSelector from './TimeSelector'
import React from 'react'

interface Booking {
  id: number
  client_id: number
  name: string
  start_time: string
  end_time: string
  created_at: string
}

interface TimeSlot {
  time: string
  available: boolean
}

function OnboardingForm({
  clientID,
  slots,
}: {
  clientID: string
  slots: Booking[]
}) {
  const [section, setSection] = useState(1)

  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [carType, setCarType] = useState('')
  const [carModel, setCarModel] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  const db = createClient()

  // Calculate the total duration of the booking (1 hour)
  const totalDuration = useMemo(() => 1, [])

  const generateTimeSlots = useCallback(() => {
    const availableTimeSlots: TimeSlot[] = []
    const today = new Date()
    const currentDate = selectedDate || today
    const currentTime = today.getHours() * 60 + today.getMinutes()

    // Convert database time slots into comparable values
    const existingSlots = slots.map((slot) => {
      const slotStartTime =
        new Date(slot.start_time).getHours() * 60 +
        new Date(slot.start_time).getMinutes()
      const slotEndTime =
        new Date(slot.end_time).getHours() * 60 +
        new Date(slot.end_time).getMinutes()
      const slotDate = new Date(slot.start_time)
      return {
        date: slotDate.toLocaleDateString(),
        slotStartTime,
        slotEndTime,
      }
    })

    // Generate time slots from 9AM to 9PM in 15-minute intervals
    for (let i = 9 * 60; i <= 21 * 60; i += 15) {
      const hour = Math.floor(i / 60)
      const minute = (i % 60).toString().padStart(2, '0')
      const time = `${hour}:${minute}`

      // Check if the time slot conflicts with existing time slots or it's in the past
      const isAvailable =
        (selectedDate !== null || i > currentTime) &&
        i + totalDuration * 60 <= 21 * 60 &&
        currentDate >= today &&
        !existingSlots.some(
          ({ date, slotStartTime, slotEndTime }) =>
            date === currentDate.toLocaleDateString() &&
            i >= slotStartTime &&
            i <= slotEndTime,
        )

      if (isAvailable) {
        const canFit = !existingSlots.some(
          ({ date, slotStartTime, slotEndTime }) => {
            if (date !== currentDate.toLocaleDateString()) return false
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
  }, [slots, selectedDate, totalDuration])

  useEffect(() => {
    if (selectedDate) {
      setTimeSlots(generateTimeSlots())
    }
  }, [generateTimeSlots, selectedDate])

  const handleTimeSlotChange = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot)
  }

  const handleConfirmation = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (
      (!name || !phoneNumber || !carModel || !carType || !selectedTimeSlot,
      !selectedDate)
    ) {
      setShowModal(true)
      return
    }

    setLoading(true)

    // Convert selectedTimeSlot and selectedDate to a Date object
    const [hours, minutes] = selectedTimeSlot.split(':').map(Number)
    const bookingStartTime = new Date(selectedDate)
    bookingStartTime.setHours(hours, minutes, 0, 0)

    // Calculate booking end time from duration
    const bookingEndTime = new Date(bookingStartTime)
    bookingEndTime.setHours(bookingStartTime.getHours() + totalDuration)

    const bookingData = {
      client_id: parseInt(clientID),
      name: name,
      start_time: bookingStartTime.toISOString(),
      end_time: bookingEndTime.toISOString(),
    }

    try {
      const { data, error } = await db
        .from('booking')
        .insert(bookingData)
        .select()
        .single()

      if (error) {
        setSuccess(false)
        console.error(error)
      } else {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Network error:', error)
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const phoneNumber = event.target.value.replace(/\D/g, '') // Remove all non-numeric characters from the input
    let formattedPhoneNumber = phoneNumber.substring(0, 3)

    if (phoneNumber.length > 3) {
      formattedPhoneNumber += '-' + phoneNumber.substring(3, 6)
    }
    if (phoneNumber.length > 6) {
      formattedPhoneNumber += '-' + phoneNumber.substring(6, 10)
    }

    setPhoneNumber(formattedPhoneNumber)
  }

  return (
    <form className="" onSubmit={handleConfirmation}>
      <div className="z-10 flex flex-col justify-center space-y-5 rounded-md bg-neutral-800 p-5 text-white shadow-lg">
        {section === 1 && (
          <>
            <h2 className="text-center text-2xl font-semibold">
              Contact Information
            </h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-2">
              <div className="flex flex-col">
                <label htmlFor="name" className="text-sm font-semibold">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="h-full rounded-md border-2 bg-neutral-700 px-1.5 py-1.5 placeholder:opacity-0 sm:placeholder:opacity-100"
                  placeholder="Enter your name here"
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                  required
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="phoneNumber" className="text-sm font-semibold">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                  required
                  className="h-full rounded-md border-2 bg-neutral-700 px-1.5"
                  placeholder="E.g. 555-555-5555"
                  onChange={handlePhoneNumberChange}
                  value={phoneNumber}
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="carModel" className="text-sm font-semibold">
                  Car Model
                </label>
                <input
                  type="text"
                  id="carModel"
                  className="h-full rounded-md border-2 bg-neutral-700 px-1.5 py-1.5"
                  placeholder="E.g. Honda Civic"
                  onChange={(event) => setCarModel(event.target.value)}
                  value={carModel}
                  required
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="carType" className="text-sm font-semibold">
                  Car Type
                </label>
                <select
                  id="carType"
                  onChange={(event) => setCarType(event.target.value)}
                  value={carType}
                  className="h-full rounded-md border-2 bg-neutral-700 py-1.5"
                  required
                >
                  <option value="">--</option>
                  <option value="SUV">SUV</option>
                  <option value="Truck">Truck</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </>
        )}

        {section === 2 && (
          <TimeSelector
            selectedDate={selectedDate}
            onDateChange={(date) => setSelectedDate(date)}
            availableTimeSlots={timeSlots}
            onSelectTimeSlot={handleTimeSlotChange}
            selectedTimeSlot={selectedTimeSlot}
          />
        )}

        {(loading || success || error) && (
          <NotificationModal
            state={loading ? 'loading' : success ? 'success' : 'error'}
            onClose={() => {
              setLoading(false)
              setSuccess(false)
              setError(false)
            }}
          />
        )}

        {showModal && (
          <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center p-3 sm:p-0">
            <div className="flex flex-col justify-center rounded-md border-2 bg-white p-5 text-black shadow-lg">
              <p>Please fill out all required fields.</p>
              <button
                className="mt-3 rounded-md bg-neutral-300 px-4 py-2  transition-colors hover:saturate-150"
                onClick={() => setShowModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 text-center">
          {selectedTimeSlot && {
              label: 'Time Slot:',
              value: `${convertTo12HourFormat(selectedTimeSlot)} - ${convertTo12HourFormat(addHours(selectedTimeSlot, totalDuration))}`,
            } && (
              <React.Fragment>
                <p className="text-left font-semibold">Time Slot:</p>
                <p className="text-right font-semibold">
                  {`${convertTo12HourFormat(selectedTimeSlot)} - ${convertTo12HourFormat(addHours(selectedTimeSlot, totalDuration))}`.replace(
                    /,/g,
                    ' ',
                  )}
                </p>
              </React.Fragment>
            )}
        </div>

        {section === 1 ? (
          <button
            type="button"
            onClick={() => {
              !name || !phoneNumber || !carModel || !carType
                ? setShowModal(true)
                : setSection(2)
              setTimeSlots(generateTimeSlots())
            }}
            className="hmdetails mt-5 rounded-md border border-neutral-500 px-5 py-3 font-semibold text-white transition-all hover:brightness-110 hover:saturate-150"
          >
            Choose a Date
          </button>
        ) : (
          <>
            <button
              type="button"
              className="rounded-md border font-light transition-all hover:border-black/60 hover:font-normal"
              onClick={() => setSection(1)}
            >
              Back
            </button>
            <button
              type="submit"
              className="hmdetails mt-5 rounded-md border border-neutral-500 px-5 py-3 font-semibold text-white transition-all hover:brightness-110 hover:saturate-150"
            >
              Confirm Booking
            </button>
          </>
        )}
      </div>
    </form>
  )
}

export default OnboardingForm
