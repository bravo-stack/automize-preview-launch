'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EXTERNAL_LINK_URLS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CommunicationReport } from '@/types/communications-audit'
import {
    AlertCircle,
    Clock,
    ExternalLink,
    MessageSquare,
    User,
} from 'lucide-react'
import { memo } from 'react'

interface ClientCardProps {
  report: CommunicationReport
  priorityLevel: 'critical' | 'high' | 'medium' | 'normal'
  highPriorityColor?: string
}

const PRIORITY_STYLES = {
  critical: {
    border: 'border-red-500/50',
    bg: 'bg-gradient-to-br from-red-950/30 to-red-900/10',
    badge: 'bg-red-500 text-white',
    glow: 'shadow-red-500/20',
  },
  high: {
    border: 'border-amber-500/50',
    bg: 'bg-gradient-to-br from-amber-950/30 to-amber-900/10',
    badge: 'bg-amber-500 text-black',
    glow: 'shadow-amber-500/20',
  },
  medium: {
    border: 'border-yellow-500/50',
    bg: 'bg-gradient-to-br from-yellow-950/20 to-yellow-900/5',
    badge: 'bg-yellow-500 text-black',
    glow: 'shadow-yellow-500/10',
  },
  normal: {
    border: 'border-zinc-700/50',
    bg: 'bg-gradient-to-br from-zinc-900/50 to-zinc-800/30',
    badge: 'bg-zinc-600 text-white',
    glow: '',
  },
}

function formatTimeSince(dateString: string | null): string {
  if (!dateString) return 'Never'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h ago`
  }
  if (diffHours > 0) {
    return `${diffHours}h ago`
  }
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  return `${diffMinutes}m ago`
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function ClientCard({
  report,
  priorityLevel,
  highPriorityColor,
}: ClientCardProps) {
  const styles = PRIORITY_STYLES[priorityLevel]

  // Build Discord channel URL
  const discordUrl =
    report.guild_id && report.channel_id
      ? `${EXTERNAL_LINK_URLS.discord_channels}${report.guild_id}/${report.channel_id}`
      : null

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg',
        styles.border,
        styles.bg,
        styles.glow && `shadow-md ${styles.glow}`,
      )}
      style={
        priorityLevel === 'high' && highPriorityColor
          ? { borderColor: `${highPriorityColor}50` }
          : undefined
      }
    >
      {/* Priority indicator bar */}
      <div
        className={cn('absolute left-0 top-0 h-full w-1', {
          'bg-red-500': priorityLevel === 'critical',
          'bg-amber-500': priorityLevel === 'high' && !highPriorityColor,
          'bg-yellow-500': priorityLevel === 'medium',
          'bg-zinc-600': priorityLevel === 'normal',
        })}
        style={
          priorityLevel === 'high' && highPriorityColor
            ? { backgroundColor: highPriorityColor }
            : undefined
        }
      />

      <div className="space-y-3 p-4 pl-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-white">
              {report.channel_name || 'Unknown Client'}
            </h3>
            <p className="truncate text-sm text-zinc-400">
              {report.category_name || report.guild_name || 'Uncategorized'}
            </p>
          </div>

          <Badge
            className={cn('shrink-0 text-xs', styles.badge)}
            style={
              priorityLevel === 'high' && highPriorityColor
                ? { backgroundColor: highPriorityColor, color: 'white' }
                : undefined
            }
          >
            {priorityLevel === 'critical' && 'Critical'}
            {priorityLevel === 'high' && 'High Priority'}
            {priorityLevel === 'medium' && 'Medium'}
            {priorityLevel === 'normal' && 'Normal'}
          </Badge>
        </div>

        {/* Status Info */}
        <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>
              Client:{' '}
              {report.last_client_message_at
                ? formatTimeSince(report.last_client_message_at)
                : 'No messages'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Team:{' '}
              {report.last_team_message_at
                ? formatTimeSince(report.last_team_message_at)
                : 'No response'}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {report.status && (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-zinc-500" />
            <span className="truncate text-xs text-zinc-400">
              {report.status}
            </span>
          </div>
        )}

        {/* Last Client Info */}
        {report.last_client_username && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <User className="h-3.5 w-3.5" />
            <span>Last message from: {report.last_client_username}</span>
          </div>
        )}

        {/* Actions */}
        {discordUrl && (
          <div className="pt-2">
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 border-zinc-700 bg-zinc-800/50 text-xs hover:border-zinc-600 hover:bg-zinc-700/50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Discord
              </Button>
            </a>
          </div>
        )}
      </div>
    </Card>
  )
}

export default memo(ClientCard)
