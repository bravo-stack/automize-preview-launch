'use client'

import {
  getPendingMessages,
  type PendingMessageSummary,
  syncAllPendingMessages,
  syncSingleMessageStatus,
} from '@/lib/actions/whatsapp'
import { useCallback, useEffect, useState, useTransition } from 'react'

interface PendingMessagesSectionProps {
  onSyncComplete?: () => void
}

export default function PendingMessagesSection({
  onSyncComplete,
}: PendingMessagesSectionProps) {
  const [messages, setMessages] = useState<PendingMessageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncingAll, startSyncAll] = useTransition()
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())
  const [lastSyncResult, setLastSyncResult] = useState<{
    processed: number
    updated: number
    failed: number
  } | null>(null)

  const fetchPendingMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getPendingMessages()

      if (!result.success) {
        setError(result.error || 'Failed to fetch pending messages')
        return
      }

      setMessages(result.messages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingMessages()
  }, [fetchPendingMessages])

  const handleSyncAll = () => {
    startSyncAll(async () => {
      try {
        const result = await syncAllPendingMessages()
        setLastSyncResult({
          processed: result.processed,
          updated: result.updated,
          failed: result.failed,
        })
        // Refresh the list
        await fetchPendingMessages()
        // Notify parent to refresh main logs
        onSyncComplete?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sync failed')
      }
    })
  }

  const handleSyncSingle = async (messageSid: string) => {
    setSyncingIds((prev) => new Set(prev).add(messageSid))

    try {
      const result = await syncSingleMessageStatus(messageSid)

      if (!result.success) {
        console.error(`Failed to sync ${messageSid}:`, result.error)
      }

      // Refresh the list to show updated status
      await fetchPendingMessages()
      // Notify parent to refresh main logs
      onSyncComplete?.()
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev)
        next.delete(messageSid)
        return next
      })
    }
  }

  const formatAge = (minutes: number) => {
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-amber-950/50 border-amber-800/50 text-amber-400'
      case 'accepted':
      case 'sending':
        return 'bg-blue-950/50 border-blue-800/50 text-blue-400'
      case 'sent':
        return 'bg-cyan-950/50 border-cyan-800/50 text-cyan-400'
      default:
        return 'bg-neutral-900 border-neutral-700 text-neutral-400'
    }
  }

  // Don't render if no pending messages and not loading
  if (!loading && messages.length === 0) {
    return null
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-900/40 bg-amber-950/20 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-900/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 text-amber-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-amber-100">
              Pending Status Updates
            </h3>
            <p className="text-xs text-amber-400/70">
              {messages.length} message{messages.length !== 1 ? 's' : ''}{' '}
              awaiting status confirmation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastSyncResult && (
            <span className="text-xs text-neutral-400">
              Last sync: {lastSyncResult.updated} updated,{' '}
              {lastSyncResult.failed} failed
            </span>
          )}
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncingAll || loading || messages.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-800/50 bg-amber-900/40 px-4 py-2 text-xs font-medium text-amber-100 transition-colors hover:border-amber-700 hover:bg-amber-900/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncingAll ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Sync All
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-amber-600 border-r-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-center text-sm text-red-400">
          {error}
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 border-b border-amber-900/40 bg-amber-950/40">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-amber-400/70">
                  Pod
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-amber-400/70">
                  Recipient
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-amber-400/70">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-amber-400/70">
                  Age
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-amber-400/70">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/30">
              {messages.map((msg) => (
                <tr
                  key={msg.twilio_message_sid}
                  className="transition-colors hover:bg-amber-900/20"
                >
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-amber-100">
                    {msg.pod_name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="text-sm text-amber-100">
                      {msg.recipient_name || 'Unknown'}
                    </div>
                    <div className="text-xs text-amber-400/60">
                      {msg.recipient_phone_number}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(msg.delivery_status)}`}
                    >
                      {msg.delivery_status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-amber-400/70">
                    {formatAge(msg.age_minutes)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleSyncSingle(msg.twilio_message_sid)}
                      disabled={syncingIds.has(msg.twilio_message_sid)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-amber-800/50 bg-amber-900/30 px-2.5 py-1 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {syncingIds.has(msg.twilio_message_sid) ? (
                        <svg
                          className="h-3 w-3 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-3 w-3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                          />
                        </svg>
                      )}
                      Refresh
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-amber-400/50">
        Messages older than 30 minutes with pending status (queued, accepted,
        sending, sent) appear here. Webhooks usually update status within
        seconds. If stuck, use Sync to fetch from Twilio directly.
      </p>
    </div>
  )
}
