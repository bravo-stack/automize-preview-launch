'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import toast from 'react-hot-toast'

type Props = {
  didnt_reach_out_hours: number
  client_silent_days: number
}

const UpdateIxmValue = ({
  didnt_reach_out_hours,
  client_silent_days,
}: Props) => {
  // STATES
  const [timeFrame, setTimeFrame] = useState(() => ({
    didnt_reach_out_hours: didnt_reach_out_hours ?? 48,
    client_silent_days: client_silent_days ?? 5,
  }))

  //   HANDLERS
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      isNaN(timeFrame.didnt_reach_out_hours) ||
      timeFrame.didnt_reach_out_hours < 0
    ) {
      toast.error(
        'Please enter a valid number of hours for "Didn\'t Reach Out".',
      )
      return
    }

    if (
      isNaN(timeFrame.client_silent_days) ||
      timeFrame.client_silent_days < 0
    ) {
      toast.error('Please enter a valid number of days for "Client Silent".')
      return
    }

    console.log('Updated IXM Values:', timeFrame)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-stretch gap-2 md:flex-row md:items-end"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="date-select"
          className="text-sm font-medium text-zinc-300"
        >
          Didn&apos;t Reach Out (Hours):
        </label>
        <Input
          type="text"
          value={timeFrame.didnt_reach_out_hours}
          onChange={(e) =>
            setTimeFrame({
              ...timeFrame,
              didnt_reach_out_hours: +e.target.value,
            })
          }
          className="bg-background/50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="date-select"
          className="text-sm font-medium text-zinc-300"
        >
          Client Silent (Days):
        </label>

        <Input
          type="text"
          value={timeFrame.client_silent_days}
          onChange={(e) =>
            setTimeFrame({
              ...timeFrame,
              client_silent_days: +e.target.value,
            })
          }
          className="bg-background/50"
        />
      </div>
      <Button type="submit" className="w-full sm:w-auto">
        Update
      </Button>
    </form>
  )
}

export default UpdateIxmValue
