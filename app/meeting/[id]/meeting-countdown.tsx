'use client'

import { useState, useEffect, useCallback } from 'react'
import { DateTime } from 'luxon'

interface MeetingCountdownProps {
  startTime: string // Should receive UTC ISO string
  endTime: string // Should receive UTC ISO string
}

export const MeetingCountdown = ({
  startTime,
  endTime,
}: MeetingCountdownProps) => {
  const [currentTime, setCurrentTime] = useState(DateTime.now())
  const [timer, setTimer] = useState<string>('')

  // Parse the UTC times, treat them as EST (America/New_York), then convert to local timezone
  const startDateTime = DateTime.fromISO(startTime, {
    zone: 'America/New_York',
  }).toLocal()
  const endDateTime = DateTime.fromISO(endTime, {
    zone: 'America/New_York',
  }).toLocal()

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(DateTime.now())
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  const calculateTimeLeft = useCallback(() => {
    if (!startDateTime.isValid) return ''

    const diff = startDateTime.diff(currentTime, [
      'hours',
      'minutes',
      'seconds',
    ])

    if (diff.as('milliseconds') > 0) {
      return `${Math.floor(diff.hours)}h ${Math.floor(diff.minutes)}m ${Math.floor(diff.seconds)}s`
    }

    return ''
  }, [startDateTime, currentTime])

  const isMeetingStarted =
    currentTime >= startDateTime && currentTime <= endDateTime
  const isMeetingNotStarted = currentTime < startDateTime

  useEffect(() => {
    if (isMeetingNotStarted) {
      setTimer(calculateTimeLeft())
    } else {
      setTimer('')
    }
  }, [currentTime, calculateTimeLeft, isMeetingNotStarted])

  return (
    <div>
      {isMeetingStarted ? (
        <div>
          <p className="mb-4 text-lg text-white">
            Meeting is currently live from{' '}
            {startDateTime.toLocaleString(DateTime.TIME_SIMPLE)} to{' '}
            {endDateTime.toLocaleString(DateTime.TIME_SIMPLE)}
          </p>
          <a
            className="block rounded-lg border border-green-500/50 bg-green-500/25 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-green-500/50"
            href="https://insightxmedia.daily.co/Onboarding"
          >
            Join Meeting
          </a>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-lg text-white">
            {isMeetingNotStarted ? (
              <>
                The meeting has not started yet. After the meeting begins, a
                <span className="font-semibold"> Join Meeting</span> button will
                appear.
              </>
            ) : (
              'The meeting has ended.'
            )}
          </p>
          {isMeetingNotStarted && (
            <div className="text-xl text-gray-200">
              <p>Time until start:</p>
              <span className="font-semibold">{timer}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
