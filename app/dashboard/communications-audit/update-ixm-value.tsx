'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateItem } from '@/lib/actions/db'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
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
    didnt_reach_out_hours: didnt_reach_out_hours,
    client_silent_days: client_silent_days,
  }))
  const [isSubmitting, startTransition] = useTransition()

  //   HOOKS
  const router = useRouter()

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

    if (
      timeFrame.didnt_reach_out_hours < 1 ||
      timeFrame.didnt_reach_out_hours > 168
    ) {
      toast.error(
        'Out of range: "Didn\'t Reach Out" must be between 1 and 168 hours.',
      )
      return
    }

    if (
      timeFrame.client_silent_days < 1 ||
      timeFrame.client_silent_days > 100
    ) {
      toast.error(
        'Out of range: "Client Silent" must be between 1 and 100 days.',
      )
      return
    }

    startTransition(async () => {
      try {
        const { error } = await updateItem(
          'timeframe',
          {
            didnt_reach_out_hours: timeFrame.didnt_reach_out_hours,
            client_silent_days: timeFrame.client_silent_days,
            updated_at: new Date().toISOString(),
          },
          1,
        )

        if (error) {
          throw new Error('Failed to update timeframe')
        }

        toast.success('Timeframe updated successfully!')
        router.refresh()
      } catch (error) {
        console.error('Error updating timeframe:', error)
        toast.error('An error occurred while updating the timeframe.')
      }
    })
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
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
      <Button
        disabled={isSubmitting}
        type="submit"
        className="w-full sm:w-auto"
      >
        {isSubmitting ? 'Updating...' : 'Update'}
      </Button>
    </form>
  )
}

export default UpdateIxmValue
