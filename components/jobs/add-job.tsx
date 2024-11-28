'use client'

import { createJob } from '@/lib/jobs'
import { useState } from 'react'

export default function AddJob() {
  const [title, setTitle] = useState('')
  const [channelName, setChannelName] = useState('')
  const [message, setMessage] = useState('')
  const [scheduleType, setScheduleType] = useState('daily') // "daily" or "weekly"
  const [time, setTime] = useState('12:00') // Default time in HH:mm format
  const [dayOfWeek, setDayOfWeek] = useState('Monday') // For weekly schedule
  const [open, setOpen] = useState(false)

  const parseSchedule = () => {
    const [hours, minutes] = time.split(':').map(Number)
    let wdays = [-1] // Default to every day of the week
    let mdays = [-1] // Default to every day of the month
    let months = [-1] // Default to every month

    if (scheduleType === 'daily') {
      return {
        hours: [hours], // Set hour to the selected one
        minutes: [minutes], // Set minute to the selected one
        months, // Every month
        mdays, // Every day of the month
        wdays, // Every day of the week
        timezone: 'America/Toronto', // Set timezone
      }
    }

    if (scheduleType === 'weekly') {
      const dayOfWeekMapping = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      }
      wdays = [dayOfWeekMapping[dayOfWeek]] // Set selected day of the week

      return {
        hours: [hours], // Set hour to the selected one
        minutes: [minutes], // Set minute to the selected one
        months, // Every month
        mdays, // Every day of the month
        wdays, // Only selected day of the week
        timezone: 'America/Toronto', // Set timezone
      }
    }

    return {} // Default return if something is wrong
  }

  const handleSave = async (e) => {
    e.preventDefault()

    const jobData = {
      job: {
        title,
        url: 'https://ixm-bot.onrender.com/api/sendMessage',
        schedule: {
          timezone: 'America/Toronto',
          ...parseSchedule(),
        },
        enabled: true,
        extendedData: {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelName,
            message,
          }), // Payload as body in extendedData
        },
        requestMethod: 1,
      },
    }

    try {
      const res = await createJob(jobData)

      alert(
        res ? 'Scheduling saved successfully' : 'Failed to schedule message.',
      )
    } catch (error) {
      console.error('Error saving job:', error)
    }

    // Reset the form
    setTitle('')
    setChannelName('')
    setMessage('')
    setScheduleType('daily')
    setTime('12:00')
    setDayOfWeek('Monday')
    setOpen(false)
  }

  const handleCancel = () => {
    setTitle('')
    setChannelName('')
    setMessage('')
    setScheduleType('daily')
    setTime('12:00')
    setDayOfWeek('Monday')
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-white px-3 py-1.5 font-medium text-black"
      >
        New Message +
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Schedule Discord Message</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  Automation Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="E.g., Reminder Message"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Discord Channel Name
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  required
                  placeholder="E.g., general"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Message Content
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="E.g., Don't forget our meeting at 3 PM!"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Schedule Type
                </label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {scheduleType === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium">
                    Day of Week
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                  >
                    {[
                      'Sunday',
                      'Monday',
                      'Tuesday',
                      'Wednesday',
                      'Thursday',
                      'Friday',
                      'Saturday',
                    ].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md bg-black px-4 py-2 text-white shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-800 px-4 py-2 shadow-sm transition-colors hover:bg-zinc-800/10"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
