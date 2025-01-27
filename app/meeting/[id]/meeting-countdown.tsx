'use client'

import { useState, useEffect, useCallback } from 'react'

interface MeetingCountdownProps {
  startTime: string
  endTime: string
}

export const MeetingCountdown = ({
  startTime,
  endTime,
}: MeetingCountdownProps) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timer, setTimer] = useState<string>('')

  const startDateTime = new Date(startTime)
  const endDateTime = new Date(endTime)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(intervalId) // Cleanup on unmount
  }, [])

  const calculateTimeLeft = useCallback(() => {
    const timeDiff = startDateTime.getTime() - currentTime.getTime()

    if (timeDiff > 0) {
      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
      return `${hours}h ${minutes}m ${seconds}s`
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
            {startDateTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            to{' '}
            {endDateTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <a
            className="block rounded-lg border border-green-500/50 bg-green-500/25 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-green-500/50 "
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
