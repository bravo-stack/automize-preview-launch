'use client'

import { Button } from '@/components/ui/button'
import type {
  CommunicationReport,
  CommunicationsAuditData,
} from '@/types/communications-audit'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
} from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import ClientListItem from './client-list-item'

const ITEMS_PER_PAGE = 15

// Working hours configuration (EST timezone)
const WORK_START_HOUR = 9 // 9:00 AM EST
const WORK_END_HOUR = 18 // 6:00 PM EST
const PRE_LOGOUT_HOUR = 16.5 // 4:30 PM EST
const FINAL_CHECK_HOUR = 17 // 4:59 PM / 5:00 PM EST
const ALERT_HOUR = 18 // 6:00 PM EST - VA/Ops alert

interface TimeSlot {
  id: string
  label: string
  hour: number
  minute: number
  displayTime: string
  isSpecial?: boolean
  specialType?: 'pre-logout' | 'final-check' | 'alert'
}

interface ClientQueueViewProps {
  initialData: CommunicationsAuditData
  ixmDidntReachOutHours: number
  clientSilentDays: number
  highPriorityDays: number
  highPriorityColor: string
  userRole: string
}

// Generate hourly time slots within working hours (9 AM - 6 PM EST)
// Includes special slots: 4:30 PM (pre-logout), 5:00 PM (final check), 6:00 PM (alert)
function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = []

  for (let hour = WORK_START_HOUR; hour <= WORK_END_HOUR; hour++) {
    const isPM = hour >= 12
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const period = isPM ? 'PM' : 'AM'

    // Add 4:30 PM special slot before 5 PM
    if (hour === 17) {
      slots.push({
        id: 'pre-logout',
        label: 'Pre-Logout Check',
        hour: 16,
        minute: 30,
        displayTime: '4:30 PM',
        isSpecial: true,
        specialType: 'pre-logout',
      })
    }

    const slot: TimeSlot = {
      id: `hour-${hour}`,
      label: `${displayHour}:00 ${period}`,
      hour,
      minute: 0,
      displayTime: `${displayHour}:00 ${period}`,
    }

    // Mark special slots
    if (hour === FINAL_CHECK_HOUR) {
      slot.isSpecial = true
      slot.specialType = 'final-check'
      // Keep label as hour only
    } else if (hour === ALERT_HOUR) {
      slot.isSpecial = true
      slot.specialType = 'alert'
      // Keep label as hour only
    }

    slots.push(slot)
  }

  return slots
}

const TIME_SLOTS = generateTimeSlots()

function getCurrentTimeSlot(): TimeSlot {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeDecimal = currentHour + currentMinute / 60

  // Before work hours - show first slot
  if (currentTimeDecimal < WORK_START_HOUR) {
    return TIME_SLOTS[0]
  }

  // After work hours - show last slot (alert)
  if (currentTimeDecimal >= WORK_END_HOUR) {
    return TIME_SLOTS[TIME_SLOTS.length - 1]
  }

  // Special case: 4:30 PM - 4:59 PM (pre-logout window)
  if (currentHour === 16 && currentMinute >= 30) {
    return TIME_SLOTS.find((slot) => slot.id === 'pre-logout')!
  }

  // Find the current hourly slot
  const currentSlot = TIME_SLOTS.find(
    (slot) =>
      !slot.isSpecial && slot.hour === currentHour && currentMinute < 60,
  )

  return currentSlot || TIME_SLOTS[0]
}

function getNextTimeSlot(currentSlot: TimeSlot): TimeSlot | null {
  const currentIndex = TIME_SLOTS.findIndex(
    (slot) => slot.id === currentSlot.id,
  )
  if (currentIndex === -1 || currentIndex === TIME_SLOTS.length - 1) {
    return null
  }
  return TIME_SLOTS[currentIndex + 1]
}

// Countdown timer removed — not required for core UI. If needed later, reintroduce a lightweight component that is isolated from main render loop.

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
  const [currentPage, setCurrentPage] = useState(1)

  // Update main clock once a minute to avoid frequent re-renders
  useEffect(() => {
    setCurrentTime(new Date()) // initial
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

  // Pagination calculations
  const totalPages = Math.ceil(pendingClients.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedClients = pendingClients.slice(startIndex, endIndex)

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    window.location.reload()
  }, [])

  const currentSlot = getCurrentTimeSlot()
  const nextSlot = getNextTimeSlot(currentSlot)

  // Determine slot status styling
  const getSlotStatusStyle = () => {
    if (currentSlot.specialType === 'alert') {
      return 'border-red-500/50 bg-red-950/20 text-red-400'
    }
    if (
      currentSlot.specialType === 'pre-logout' ||
      currentSlot.specialType === 'final-check'
    ) {
      return 'border-amber-500/50 bg-amber-950/20 text-amber-400'
    }
    return 'border-zinc-700 bg-zinc-800/50 text-zinc-300'
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Users className="h-4 w-4" />
            <span className="font-medium text-white">
              {pendingClients.length}
            </span>
            <span>clients to respond this hour</span>
          </div>
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

      {/* Client List */}
      {pendingClients.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900/30">
          <div className="flex items-center justify-between border-b border-zinc-800/50 bg-zinc-800/30 px-4 py-3">
            <h2 className="text-sm font-medium text-zinc-300">
              Clients Awaiting Response — {currentSlot.displayTime}
            </h2>
            {totalPages > 1 && (
              <span className="text-xs text-zinc-500">
                {startIndex + 1}-{Math.min(endIndex, pendingClients.length)} of{' '}
                {pendingClients.length}
              </span>
            )}
          </div>
          <div>
            {paginatedClients.map((client, index) => (
              <ClientListItem
                key={client.id}
                report={client}
                index={startIndex + index}
              />
            ))}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-800/50 bg-zinc-800/30 px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-zinc-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
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
