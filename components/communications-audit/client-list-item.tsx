'use client'

import { EXTERNAL_LINK_URLS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CommunicationReport } from '@/types/communications-audit'
import { ExternalLink } from 'lucide-react'
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

function ClientListItem({ report, index }: ClientListItemProps) {
  const discordUrl =
    report.guild_id && report.channel_id
      ? `${EXTERNAL_LINK_URLS.discord_channels}${report.guild_id}/${report.channel_id}`
      : null

  // Use category_name as the client name
  const clientName = report.category_name || 'Unknown Client'

  return (
    <div
      className={cn(
        'group flex items-center justify-between gap-4 border-b border-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800/30',
        index === 0 && 'rounded-t-lg',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {/* Index number */}
        <span className="w-6 shrink-0 text-sm text-zinc-500">{index + 1}.</span>

        {/* Client info */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">{clientName}</p>
          <p className="truncate text-sm text-zinc-500">
            Last message: {formatTimeSince(report.last_client_message_at)}
          </p>
        </div>
      </div>

      {/* Discord link */}
      {discordUrl && (
        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-700/50 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}

export default memo(ClientListItem)
