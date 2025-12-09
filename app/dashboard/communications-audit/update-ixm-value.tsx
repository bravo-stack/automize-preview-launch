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
  high_priority_days: number
  high_priority_color: string
  role?: string
}

const UpdateIxmValue = ({
  didnt_reach_out_hours,
  client_silent_days,
  high_priority_days,
  high_priority_color,
  role,
}: Props) => {
  // STATES
  const [timeFrame, setTimeFrame] = useState(() => ({
    didnt_reach_out_hours: didnt_reach_out_hours,
    client_silent_days: client_silent_days,
    high_priority_days: high_priority_days,
    high_priority_color: high_priority_color,
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
      isNaN(timeFrame.high_priority_days) ||
      timeFrame.high_priority_days < 0
    ) {
      toast.error('Please enter a valid number of days for "High Priority".')
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

    if (timeFrame.high_priority_days < 2) {
      toast.error('Out of range: "High Priority" must be at least 2 days.')
      return
    }

    startTransition(async () => {
      try {
        const { error } = await updateItem(
          'timeframe',
          {
            didnt_reach_out_hours: timeFrame.didnt_reach_out_hours,
            client_silent_days: timeFrame.client_silent_days,
            high_priority_days: timeFrame.high_priority_days,
            high_priority_color: timeFrame.high_priority_color,
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

      <div className="flex flex-col gap-2">
        <label
          htmlFor="high-priority-days"
          className="text-sm font-medium text-zinc-300"
        >
          High Priority (Days):
        </label>

        <Input
          disabled={isSubmitting}
          type="number"
          id="high-priority-days"
          min={2}
          value={timeFrame.high_priority_days}
          onChange={(e) =>
            setTimeFrame({
              ...timeFrame,
              high_priority_days: +e.target.value,
            })
          }
          className="bg-background/50"
        />
      </div>

      {role === 'exec' && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="high-priority-color"
            className="text-sm font-medium text-zinc-300"
          >
            High Priority Color:
          </label>
          <Input
            disabled={isSubmitting}
            type="color"
            id="high-priority-color"
            value={timeFrame.high_priority_color}
            onChange={(e) =>
              setTimeFrame({
                ...timeFrame,
                high_priority_color: e.target.value,
              })
            }
            className="h-10 w-20 cursor-pointer bg-background/50"
          />
        </div>
      )}
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
