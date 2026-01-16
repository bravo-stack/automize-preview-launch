'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  CommunicationReport,
  CommunicationsAuditData,
} from '@/types/communications-audit'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  MessageSquareWarning,
  Moon,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  Users,
} from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import TimeSlotSection, { type TimeSlot } from './time-slot-section'

interface ClientQueueViewProps {
  initialData: CommunicationsAuditData
  ixmDidntReachOutHours: number
  clientSilentDays: number
  highPriorityDays: number
  highPriorityColor: string
  userRole: string
}

// Define time slots for the day (in 24-hour format)
const TIME_SLOTS: TimeSlot[] = [
  {
    id: 'morning',
    label: 'Morning Queue',
    startHour: 6,
    endHour: 11,
    description: '6:00 AM - 11:00 AM',
    icon: 'morning',
  },
  {
    id: 'midday',
    label: 'Midday Queue',
    startHour: 11,
    endHour: 14,
    description: '11:00 AM - 2:00 PM',
    icon: 'midday',
  },
  {
    id: 'afternoon',
    label: 'Afternoon Queue',
    startHour: 14,
    endHour: 18,
    description: '2:00 PM - 6:00 PM',
    icon: 'afternoon',
  },
  {
    id: 'evening',
    label: 'Evening Queue',
    startHour: 18,
    endHour: 23,
    description: '6:00 PM - 11:00 PM',
    icon: 'evening',
  },
]

function getCurrentTimeSlotIndex(): number {
  const now = new Date()
  const currentHour = now.getHours()

  for (let i = 0; i < TIME_SLOTS.length; i++) {
    const slot = TIME_SLOTS[i]
    if (currentHour >= slot.startHour && currentHour < slot.endHour) {
      return i
    }
  }

  // Before first slot or after last slot
  if (currentHour < TIME_SLOTS[0].startHour) {
    return 0
  }
  return TIME_SLOTS.length - 1
}

function getSlotIcon(icon: TimeSlot['icon']) {
  switch (icon) {
    case 'morning':
      return <Sunrise className="h-5 w-5" />
    case 'midday':
      return <Sun className="h-5 w-5" />
    case 'afternoon':
      return <Sunset className="h-5 w-5" />
    case 'evening':
      return <Moon className="h-5 w-5" />
    default:
      return <Clock className="h-5 w-5" />
  }
}

function isClientNeedsResponse(report: CommunicationReport): boolean {
  // Client needs response if:
  // 1. Client has sent a message
  // 2. No team response yet OR last client message is after last team message
  if (!report.last_client_message_at) return false

  if (!report.last_team_message_at) return true

  const clientMsgTime = new Date(report.last_client_message_at).getTime()
  const teamMsgTime = new Date(report.last_team_message_at).getTime()

  return clientMsgTime > teamMsgTime
}

// Statuses that indicate the client is inactive/churned/transferred
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
  const [currentSlotIndex, setCurrentSlotIndex] = useState(
    getCurrentTimeSlotIndex,
  )
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showAllSlots, setShowAllSlots] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      setCurrentSlotIndex(getCurrentTimeSlotIndex())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Filter clients that need responses
  const pendingClients = useMemo(() => {
    return initialData.reports.filter((report) => {
      // Exclude inactive/churned/transferred clients
      if (shouldExcludeClient(report)) return false

      // Check if client needs a response
      return isClientNeedsResponse(report)
    })
  }, [initialData.reports])

  // Stats for summary
  const stats = useMemo(() => {
    const critical = pendingClients.filter(
      (c) => (c.days_since_client_message ?? 0) >= clientSilentDays,
    ).length

    const high = pendingClients.filter((c) => {
      const daysSince = c.days_since_client_message ?? 0
      return (
        daysSince < clientSilentDays &&
        c.last_client_message_at &&
        (!c.last_team_message_at ||
          new Date(c.last_client_message_at) > new Date(c.last_team_message_at))
      )
    }).length

    return {
      total: pendingClients.length,
      critical,
      high,
      normal: pendingClients.length - critical - high,
    }
  }, [pendingClients, clientSilentDays])

  // Distribute clients across time slots based on priority
  // Critical clients go first, then high priority, etc.
  const clientsBySlot = useMemo(() => {
    const distribution: Map<string, CommunicationReport[]> = new Map()
    TIME_SLOTS.forEach((slot) => distribution.set(slot.id, []))

    // Sort by priority (critical first)
    const sortedClients = [...pendingClients].sort((a, b) => {
      const aDays = a.days_since_client_message ?? 0
      const bDays = b.days_since_client_message ?? 0
      return bDays - aDays // Higher days = more urgent
    })

    // Distribute evenly across slots, respecting current time
    // Clients for past slots roll over to current slot
    const currentIdx = getCurrentTimeSlotIndex()

    sortedClients.forEach((client, index) => {
      // Distribute based on client index to spread load
      const targetSlotIdx = Math.min(
        currentIdx + Math.floor(index / Math.ceil(sortedClients.length / 4)),
        TIME_SLOTS.length - 1,
      )
      const targetSlot = TIME_SLOTS[Math.max(currentIdx, targetSlotIdx)]
      const slotClients = distribution.get(targetSlot.id) || []
      slotClients.push(client)
      distribution.set(targetSlot.id, slotClients)
    })

    return distribution
  }, [pendingClients])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    // Allow parent to handle refresh via revalidation
    window.location.reload()
  }, [])

  const currentSlot = TIME_SLOTS[currentSlotIndex]
  const slotsToShow = showAllSlots
    ? TIME_SLOTS
    : TIME_SLOTS.slice(currentSlotIndex)

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Current Time
            </CardTitle>
            <Clock className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {currentTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </div>
            <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
              {getSlotIcon(currentSlot.icon)}
              <span>{currentSlot.label}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Pending Responses
            </CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-zinc-500">Clients awaiting response</p>
          </CardContent>
        </Card>

        <Card className="border-red-900/30 bg-gradient-to-br from-red-950/30 to-red-900/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-400">
              Critical
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {stats.critical}
            </div>
            <p className="text-xs text-red-400/70">
              {clientSilentDays}+ days waiting
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-900/30 bg-gradient-to-br from-amber-950/30 to-amber-900/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-400">
              High Priority
            </CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {stats.high}
            </div>
            <p className="text-xs text-amber-400/70">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllSlots(!showAllSlots)}
            className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showAllSlots ? 'Show Current & Upcoming' : 'Show All Slots'}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Calendar className="h-4 w-4" />
          <span>
            Report Date:{' '}
            {initialData.latestDate
              ? new Date(initialData.latestDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : 'N/A'}
          </span>
        </div>
      </div>

      {/* Time Slot Sections */}
      {pendingClients.length > 0 ? (
        <div className="space-y-6">
          {slotsToShow.map((slot, idx) => {
            const actualIdx = showAllSlots ? idx : currentSlotIndex + idx
            return (
              <TimeSlotSection
                key={slot.id}
                slot={slot}
                clients={clientsBySlot.get(slot.id) || []}
                isCurrentSlot={actualIdx === currentSlotIndex}
                isPastSlot={actualIdx < currentSlotIndex}
                highPriorityColor={highPriorityColor}
                ixmDidntReachOutHours={ixmDidntReachOutHours}
                clientSilentDays={clientSilentDays}
                highPriorityDays={highPriorityDays}
              />
            )
          })}
        </div>
      ) : (
        <Card className="border-green-900/30 bg-gradient-to-br from-green-950/20 to-green-900/10">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="mb-4 h-16 w-16 text-green-500/70" />
            <h3 className="mb-2 text-xl font-semibold text-green-400">
              All Caught Up!
            </h3>
            <p className="max-w-md text-center text-zinc-400">
              Great job! All clients have been responded to. Check back later
              for new messages or refresh the page to get the latest data.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-4 border-green-700/50 bg-green-900/20 hover:bg-green-800/30"
            >
              {isRefreshing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Footer */}
      {pendingClients.length > 0 && (
        <div className="flex items-center justify-center gap-6 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-zinc-400">
              Critical: <span className="text-white">{stats.critical}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: highPriorityColor || '#f59e0b' }}
            />
            <span className="text-zinc-400">
              High: <span className="text-white">{stats.high}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-zinc-500" />
            <span className="text-zinc-400">
              Normal: <span className="text-white">{stats.normal}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(ClientQueueView)
