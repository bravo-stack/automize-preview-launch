import { convertTo12HourFormat } from '@/lib/utils'
import { useState } from 'react'

interface TimeSelectorProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  availableTimeSlots: any[]
  onSelectTimeSlot: (slot: string) => void
  selectedTimeSlot: any
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  selectedDate,
  onDateChange,
  availableTimeSlots,
  onSelectTimeSlot,
  selectedTimeSlot,
}) => {
  const getStartOfWeek = (date: Date) => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(date.setDate(diff))
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  const [currentWeekStart, setCurrentWeekStart] = useState(
    getStartOfWeek(new Date()),
  )

  const handleNextWeek = () => {
    const nextWeekStart = new Date(currentWeekStart)
    nextWeekStart.setDate(nextWeekStart.getDate() + 7)
    setCurrentWeekStart(nextWeekStart)
  }

  const handlePrevWeek = () => {
    const prevWeekStart = new Date(currentWeekStart)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
    setCurrentWeekStart(prevWeekStart)
  }

  const getWeekdays = (startDate: Date) => {
    const weekdays: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        weekdays.push(date)
      }
    }
    return weekdays
  }

  return (
    <div className="col-span-full flex flex-col justify-center rounded border border-neutral-300 bg-neutral-100 p-2">
      <div className="col-span-2 flex flex-col items-center justify-center">
        <div className="mb-1 text-sm font-medium tracking-tighter">
          Week {Math.ceil((currentWeekStart.getDate() + 6) / 7)} of{' '}
          {currentWeekStart.toLocaleString('default', { month: 'short' })}
        </div>

        <div className="flex items-center justify-center space-x-5">
          <button onClick={handlePrevWeek} type="button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="grid grid-cols-5 items-center space-x-2">
            {getWeekdays(currentWeekStart).map((date, index) => (
              <button
                key={index}
                type="button"
                className={`w-10 rounded-sm border border-blue-700/50 py-1 text-sm transition-colors hover:border-blue-700/60 ${
                  isSameDay(date, selectedDate)
                    ? 'bg-blue-500/25 font-bold text-blue-700'
                    : ''
                }`}
                onClick={() => onDateChange(date)}
              >
                {date.getDate()}
              </button>
            ))}
          </div>

          <button onClick={handleNextWeek} type="button" className="">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="mx-auto mt-2.5 flex w-full max-w-96 flex-col gap-y-2 p-5 pt-0">
        {availableTimeSlots.map((timeSlot, index) => {
          const [time, period] = convertTo12HourFormat(timeSlot.time)
          const startHour = parseInt(time.split(':')[0])
          const startMinute = parseInt(time.split(':')[1])
          const endTime = new Date(selectedDate)
          endTime.setHours(
            period === 'PM' && startHour !== 12 ? startHour + 12 : startHour,
          )
          endTime.setMinutes(startMinute + 75)
          const [endHour, endPeriod] = convertTo12HourFormat(
            endTime.toTimeString().split(' ')[0],
          )

          return (
            <button
              key={index}
              type="button"
              className={`w-full rounded px-1.5 py-1 transition-colors ${
                timeSlot.available
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'cursor-not-allowed bg-gray-300 text-gray-600'
              } ${timeSlot.time === selectedTimeSlot ? 'shadow-lg ring-2 ring-blue-700' : ''}`}
              onClick={() => onSelectTimeSlot(timeSlot.time)}
              disabled={!timeSlot.available}
            >
              {time} {period} - {endHour} {endPeriod}
            </button>
          )
        })}
      </div>

      <div className="col-span-2 text-center">
        {selectedTimeSlot === 'contact' ? (
          <p className="font-medium">
            Our team will contact you. You may now submit the form.
          </p>
        ) : (
          <>
            <p className="font-medium">
              {selectedTimeSlot
                ? `Booking selected for ${selectedDate.toDateString()} ${convertTo12HourFormat(selectedTimeSlot).join(' ')}`
                : 'No timeslot selected'}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Can&apos;t find the right time?{' '}
              <button
                type="button"
                className="text-blue-500 hover:underline"
                onClick={() => {
                  onSelectTimeSlot('contact')
                }}
              >
                Click here and our team will be in touch.
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default TimeSelector
