'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { CommunicationReport } from '@/types/communications-audit'
import { CheckCircle2, Clock, Users } from 'lucide-react'
import { memo } from 'react'
import ClientCard from './client-card'

export interface TimeSlot {
  id: string
  label: string
  startHour: number
  endHour: number
  description: string
  icon: 'morning' | 'midday' | 'afternoon' | 'evening'
}

interface TimeSlotSectionProps {
  slot: TimeSlot
  clients: CommunicationReport[]
  isCurrentSlot: boolean
  isPastSlot: boolean
  highPriorityColor?: string
  ixmDidntReachOutHours: number
  clientSilentDays: number
  highPriorityDays: number
}

const SLOT_STYLES = {
  morning: {
    gradient: 'from-orange-950/30 via-amber-950/20 to-yellow-950/10',
    border: 'border-amber-700/30',
    accent: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
  },
  midday: {
    gradient: 'from-sky-950/30 via-blue-950/20 to-cyan-950/10',
    border: 'border-sky-700/30',
    accent: 'text-sky-400',
    iconBg: 'bg-sky-500/20',
  },
  afternoon: {
    gradient: 'from-violet-950/30 via-purple-950/20 to-fuchsia-950/10',
    border: 'border-violet-700/30',
    accent: 'text-violet-400',
    iconBg: 'bg-violet-500/20',
  },
  evening: {
    gradient: 'from-slate-950/30 via-zinc-950/20 to-neutral-950/10',
    border: 'border-slate-700/30',
    accent: 'text-slate-400',
    iconBg: 'bg-slate-500/20',
  },
}

function getPriorityLevel(
  report: CommunicationReport,
  ixmHours: number,
  silentDays: number,
): 'critical' | 'high' | 'medium' | 'normal' {
  const daysSinceClient = report.days_since_client_message ?? 0
  const daysSinceTeam = report.days_since_team_message ?? Infinity

  // Critical: Client waiting + team hasn't responded in a while
  if (daysSinceClient >= silentDays) {
    return 'critical'
  }

  // High: Client has messaged but no team response
  if (
    report.last_client_message_at &&
    (!report.last_team_message_at ||
      new Date(report.last_client_message_at) >
        new Date(report.last_team_message_at || 0))
  ) {
    return 'high'
  }

  // Medium: Some activity but needs attention
  if (daysSinceTeam > 1) {
    return 'medium'
  }

  return 'normal'
}

function TimeSlotSection({
  slot,
  clients,
  isCurrentSlot,
  isPastSlot,
  highPriorityColor,
  ixmDidntReachOutHours,
  clientSilentDays,
  highPriorityDays,
}: TimeSlotSectionProps) {
  const styles = SLOT_STYLES[slot.icon]
  const hasClients = clients.length > 0
  const allResponded = !hasClients && isPastSlot

  // Sort clients by priority
  const sortedClients = [...clients].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, normal: 3 }
    const aPriority = getPriorityLevel(
      a,
      ixmDidntReachOutHours,
      clientSilentDays,
    )
    const bPriority = getPriorityLevel(
      b,
      ixmDidntReachOutHours,
      clientSilentDays,
    )
    return priorityOrder[aPriority] - priorityOrder[bPriority]
  })

  return (
    <Card
      className={cn(
        'relative overflow-hidden border transition-all duration-300',
        styles.border,
        `bg-gradient-to-br ${styles.gradient}`,
        isCurrentSlot &&
          'ring-2 ring-white/20 ring-offset-2 ring-offset-night-midnight',
        isPastSlot && !hasClients && 'opacity-60',
      )}
    >
      {/* Current slot indicator */}
      {isCurrentSlot && (
        <div className="absolute right-4 top-4">
          <Badge className="animate-pulse bg-green-500 text-white">
            <Clock className="mr-1 h-3 w-3" />
            Current
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-lg p-2.5', styles.iconBg)}>
            <Clock className={cn('h-5 w-5', styles.accent)} />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              {slot.label}
              {allResponded && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </CardTitle>
            <p className="text-sm text-zinc-400">{slot.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">
              {clients.length} client{clients.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {hasClients ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedClients.map((client) => (
              <ClientCard
                key={client.id}
                report={client}
                priorityLevel={getPriorityLevel(
                  client,
                  ixmDidntReachOutHours,
                  clientSilentDays,
                )}
                highPriorityColor={highPriorityColor}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {allResponded ? (
              <>
                <CheckCircle2 className="mb-2 h-10 w-10 text-green-500/70" />
                <p className="text-sm font-medium text-green-400">
                  All clients responded!
                </p>
                <p className="text-xs text-zinc-500">
                  Great job keeping up with communications
                </p>
              </>
            ) : (
              <>
                <Users className="mb-2 h-10 w-10 text-zinc-600" />
                <p className="text-sm text-zinc-500">
                  No pending clients for this time slot
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(TimeSlotSection)
