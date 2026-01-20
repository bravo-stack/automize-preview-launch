'use client'

import { Button } from '@/components/ui/button'
import { EXTERNAL_LINK_URLS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CommunicationReport } from '@/types/communications-audit'
import { ExternalLink, MessageCircle } from 'lucide-react'
import { memo } from 'react'

interface ClientListItemProps {
  report: CommunicationReport
  index: number
}

function formatTimeSince(dateString: string | null): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (Number.isNaN(date.getTime())) return 'Never'
  if (diffMs < 0) return 'Just now'

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h ago`
  if (diffHours > 0) return `${diffHours}h ago`
  return `${diffMinutes}m ago`
}

function ClientListItem({ report, index }: ClientListItemProps) {
  const discordUrl =
    report.guild_id && report.channel_id
      ? `${EXTERNAL_LINK_URLS.discord_channels}${report.guild_id}/${report.channel_id}`
      : null

  const clientName = report.category_name || 'Unknown Client'
  const serverName = report.guild_name || 'Unknown Server'
  const lastMsgTime = formatTimeSince(report.last_client_message_at)

  // Optional: mild “aging” signal (still professional)
  const date = report.last_client_message_at
    ? new Date(report.last_client_message_at)
    : null
  const hoursSince =
    date && !Number.isNaN(date.getTime())
      ? Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
      : null

  const urgency =
    hoursSince == null
      ? 'none'
      : hoursSince >= 72
        ? 'high'
        : hoursSince >= 24
          ? 'med'
          : 'low'

  return (
    <div
      className={cn(
        // Layout + base
        'group relative flex items-center justify-between gap-4 border-b border-zinc-200/10 px-4 py-4 transition',
        'bg-zinc-950/40 hover:bg-zinc-950/60',
        'hover:border-zinc-200/20',
        // Subtle lift on hover
        'hover:-translate-y-[1px]',
        // Left accent bar
        'pl-5',
        index === 0 && 'rounded-t-lg',
      )}
    >
      {/* Accent bar */}
      <span
        className={cn(
          'absolute left-0 top-0 h-full w-1 rounded-l-lg opacity-70 transition-opacity group-hover:opacity-100',
          urgency === 'high' && 'bg-rose-500/80',
          urgency === 'med' && 'bg-amber-500/80',
          urgency === 'low' && 'bg-sky-500/80',
          urgency === 'none' && 'bg-zinc-500/50',
          index !== 0 && 'rounded-l-none',
        )}
      />

      {/* Left: Client name and server */}
      <div className="flex w-1/3 min-w-0 flex-col">
        <span className="truncate text-[15px] font-semibold text-zinc-100">
          {clientName}
        </span>
        <span className="mt-0.5 truncate text-xs text-zinc-400">
          {serverName}
        </span>
      </div>

      {/* Center: CTA button */}
      <div className="flex w-1/3 flex-col items-center">
        {discordUrl ? (
          <Button
            asChild
            size="lg"
            className={cn(
              'rounded-full px-5 font-semibold text-white shadow-sm transition',
              // Cohesive accent gradient (single family)
              'bg-gradient-to-r from-sky-600 to-indigo-600',
              'hover:from-sky-500 hover:to-indigo-500',
              'focus-visible:ring-2 focus-visible:ring-sky-500/40',
            )}
          >
            <a href={discordUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 inline-block h-5 w-5" />
              Message
              <ExternalLink className="ml-2 inline-block h-4 w-4 align-text-bottom opacity-90" />
            </a>
          </Button>
        ) : (
          <Button
            disabled
            size="lg"
            className="cursor-not-allowed rounded-full bg-zinc-800/60 text-zinc-400"
          >
            No Channel
          </Button>
        )}
      </div>

      {/* Right: Last message time */}
      <div className="flex w-1/3 flex-col items-end">
        <span className="text-xs text-zinc-500">Last message</span>
        <span
          className={cn(
            'mt-0.5 text-sm font-medium',
            urgency === 'high' && 'text-rose-300',
            urgency === 'med' && 'text-amber-300',
            urgency === 'low' && 'text-sky-300',
            urgency === 'none' && 'text-zinc-300',
          )}
        >
          {lastMsgTime}
        </span>
      </div>
    </div>
  )
}

export default memo(ClientListItem)
