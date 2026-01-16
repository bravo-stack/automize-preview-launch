'use client'

import { Button } from '@/components/ui/button'
import type {
  CommunicationReport,
  CommunicationsAuditData,
} from '@/types/communications-audit'
import { CheckCircle2, Clock, RefreshCw, Users } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import ClientListItem from './client-list-item'

interface ClientQueueViewProps {
  initialData: CommunicationsAuditData
  ixmDidntReachOutHours: number
  clientSilentDays: number
  highPriorityDays: number
  highPriorityColor: string
  userRole: string
}

// Define time slots for the day (in 24-hour format)
const TIME_SLOTS = [
  {
    id: 'morning',
    label: 'Morning',
    startHour: 6,
    endHour: 11,
    time: '6:00 AM - 11:00 AM',
  },
  {
    id: 'midday',
    label: 'Midday',
    startHour: 11,
    endHour: 14,
    time: '11:00 AM - 2:00 PM',
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    startHour: 14,
    endHour: 18,
    time: '2:00 PM - 6:00 PM',
  },
  {
    id: 'evening',
    label: 'Evening',
    startHour: 18,
    endHour: 23,
    time: '6:00 PM - 11:00 PM',
  },
]

function getCurrentTimeSlot() {
  const now = new Date()
  const currentHour = now.getHours()

  for (const slot of TIME_SLOTS) {
    if (currentHour >= slot.startHour && currentHour < slot.endHour) {
      return slot
    }
  }

  if (currentHour < TIME_SLOTS[0].startHour) {
    return TIME_SLOTS[0]
  }
  return TIME_SLOTS[TIME_SLOTS.length - 1]
}

function isClientNeedsResponse(report: CommunicationReport): boolean {
  if (!report.last_client_message_at) return false
  if (!report.last_team_message_at) return true

  const clientMsgTime = new Date(report.last_client_message_at).getTime()
  const teamMsgTime = new Date(report.last_team_message_at).getTime()

  return clientMsgTime > teamMsgTime
}

const EXCLUDED_STATUSES = [
  'inactive',
  'transferred',
  'churned',
  'imessage',
  'no messages found',
  'team only - no client messages',
  'team only',
]

function shouldExcludeClient(report: CommunicationReport): boolean {
  const status = report.status?.toLowerCase().trim() || ''
  return EXCLUDED_STATUSES.some(
    (excluded) =>
      status === excluded || status.includes(excluded.toLowerCase()),
  )
}

function ClientQueueView({
  initialData,
  ixmDidntReachOutHours,
  clientSilentDays,
  highPriorityDays,
  highPriorityColor,
  userRole,
}: ClientQueueViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const pendingClients = useMemo(() => {
    return initialData.reports
      .filter((report) => {
        if (shouldExcludeClient(report)) return false
        return isClientNeedsResponse(report)
      })
      .sort((a, b) => {
        const aDays = a.days_since_client_message ?? 0
        const bDays = b.days_since_client_message ?? 0
        return bDays - aDays
      })
  }, [initialData.reports])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    window.location.reload()
  }, [])

  const currentSlot = getCurrentTimeSlot()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <Clock className="h-4 w-4" />
          <span className="text-sm">
            {currentTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-sm">
            {currentSlot.label} ({currentSlot.time})
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Users className="h-4 w-4" />
            <span>{pendingClients.length} clients to respond</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Client List */}
      {pendingClients.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900/30">
          <div className="border-b border-zinc-800/50 bg-zinc-800/30 px-4 py-3">
            <h2 className="text-sm font-medium text-zinc-300">
              Clients Awaiting Response
            </h2>
          </div>
          <div>
            {pendingClients.map((client, index) => (
              <ClientListItem key={client.id} report={client} index={index} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800/50 bg-zinc-900/30 py-16">
          <CheckCircle2 className="mb-4 h-12 w-12 text-zinc-600" />
          <h3 className="mb-2 text-lg font-medium text-white">
            All Caught Up!
          </h3>
          <p className="max-w-md text-center text-sm text-zinc-400">
            All clients have been responded to. Refresh to check for new
            messages.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-4 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      )}
    </div>
  )
}

export default memo(ClientQueueView)
