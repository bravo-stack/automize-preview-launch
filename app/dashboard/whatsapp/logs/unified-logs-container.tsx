'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { WhatsAppMessageLog } from '@/types/whatsapp'
import { useEffect, useState } from 'react'
import DiscordLogsContainer from './discord-logs-container'

export default function UnifiedLogsContainer() {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'discord'>('whatsapp')

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Tab Navigation */}
      <div className="border-b border-neutral-800 bg-neutral-950/50">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-6 pt-6">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`rounded-t-lg border-x border-t px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'whatsapp'
                ? 'border-neutral-800 bg-black text-white'
                : 'border-transparent bg-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            WhatsApp Logs
          </button>
          <button
            onClick={() => setActiveTab('discord')}
            className={`rounded-t-lg border-x border-t px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'discord'
                ? 'border-neutral-800 bg-black text-white'
                : 'border-transparent bg-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Discord Logs
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'whatsapp' ? (
          <WhatsAppLogsView />
        ) : (
          <div className="[&>div]:min-h-[calc(100vh-65px)] [&>div]:pt-8">
            <DiscordLogsContainer />
          </div>
        )}
      </div>
    </div>
  )
}

function WhatsAppLogsView() {
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<WhatsAppMessageLog | null>(
    null,
  )

  // Filters
  const [podFilter, setPodFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('limit', '500')

      const response = await fetch(`/api/whatsapp/logs?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch logs')
      }

      const data = await response.json()
      setLogs(data.logs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesPod =
      !podFilter || log.pod_name.toLowerCase().includes(podFilter.toLowerCase())
    const matchesSource = !sourceFilter || log.source_feature === sourceFilter
    const matchesSearch =
      !searchTerm ||
      log.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipient_phone_number.includes(searchTerm) ||
      log.message_content?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesPod && matchesSource && matchesSearch
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Toronto',
    }).format(date)
  }

  const formatSourceName = (source: string) => {
    let formattedSource = ''

    if (!source || source.trim() === '') {
      return 'Empty Source'
    }

    if (source === 'ad_error') {
      formattedSource = 'ad_account_error'
    } else {
      formattedSource = source
    }

    return formattedSource
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const uniquePods = Array.from(new Set(logs.map((log) => log.pod_name))).sort()
  const uniqueSources = Array.from(
    new Set(logs.map((log) => log.source_feature)),
  ).sort()

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">
            WhatsApp Message Logs
          </h1>
          <p className="text-sm text-neutral-400">
            A chronological record of every WhatsApp message sent.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-400">
                Search
              </label>
              <input
                type="text"
                placeholder="Name, phone, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-400">
                Pod
              </label>
              <select
                value={podFilter}
                onChange={(e) => setPodFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              >
                <option value="">All Pods</option>
                {uniquePods.map((pod) => (
                  <option key={pod} value={pod}>
                    {pod}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-400">
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              >
                <option value="">All Sources</option>
                {uniqueSources.map((source, index) => (
                  <option key={index} value={source}>
                    {formatSourceName(source)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end gap-2 text-sm text-neutral-500">
              <p>
                Showing{' '}
                <span className="text-neutral-200">{filteredLogs.length}</span>{' '}
                of <span className="text-neutral-200">{logs.length}</span>{' '}
                messages
              </p>
              <button
                type="button"
                onClick={fetchLogs}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-100 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
              >
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
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-neutral-600 border-r-transparent"></div>
                <p className="mt-4 text-sm text-neutral-400">Loading logs…</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="mx-auto mb-4 h-10 w-10 text-red-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
                <p className="text-sm font-medium text-red-400">{error}</p>
                <button
                  onClick={fetchLogs}
                  className="mt-4 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="mx-auto mb-4 h-10 w-10 text-neutral-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z"
                  />
                </svg>
                <p className="text-sm text-neutral-300">No messages found</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Try adjusting your filters
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-neutral-800 bg-black/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                      Date & Time (Toronto)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                      Pod
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 bg-neutral-950">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-neutral-900/80"
                    >
                      <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-neutral-300">
                        {formatDate(log.sent_at)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3">
                        <span className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-neutral-100">
                          {log.pod_name}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-sm">
                        <div>
                          <div className="text-sm font-medium text-neutral-100">
                            {log.recipient_name || 'N/A'}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {log.recipient_phone_number}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3">
                        <span className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-neutral-100">
                          {formatSourceName(log.source_feature)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3">
                        <span className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-0.5 text-xs font-medium capitalize text-neutral-100">
                          {log.delivery_status}
                        </span>
                      </td>
                      <td className="max-w-md px-6 py-3 text-sm text-neutral-100">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="group w-full text-left"
                        >
                          <div
                            className="line-clamp-2 cursor-pointer rounded-md border border-transparent bg-transparent px-0 py-0.5 text-sm text-neutral-100 transition-all"
                            title={log.message_content || ''}
                          >
                            {log.message_content || 'N/A'}
                          </div>
                          {log.failure_reason && (
                            <div className="mt-1 text-xs text-red-400">
                              Error: {log.failure_reason}
                            </div>
                          )}
                          <span className="mt-1 inline-flex items-center text-xs text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100">
                            View full message
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null)
        }}
      >
        <DialogContent className="max-h-[80vh] w-full max-w-2xl overflow-y-auto border border-neutral-800 bg-neutral-950 text-white">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-medium text-neutral-100">
                  Message Details
                </DialogTitle>
                <p className="text-xs text-neutral-500">
                  {formatDate(selectedLog.sent_at)} · Toronto time
                </p>
              </DialogHeader>
              <div className="mt-3 grid gap-4 border-b border-neutral-800 pb-4 text-xs text-neutral-300 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-neutral-500">Pod</p>
                  <p className="font-medium text-neutral-100">
                    {selectedLog.pod_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-neutral-500">Status</p>
                  <p className="font-medium capitalize text-neutral-100">
                    {selectedLog.delivery_status}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-neutral-500">Recipient</p>
                  <p className="font-medium text-neutral-100">
                    {selectedLog.recipient_name || 'N/A'}
                  </p>
                  <p className="text-neutral-500">
                    {selectedLog.recipient_phone_number}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-neutral-500">Source</p>
                  <p className="font-medium text-neutral-100">
                    {formatSourceName(selectedLog.source_feature)}
                  </p>
                  {selectedLog.twilio_message_sid && (
                    <p className="text-neutral-500">
                      SID: {selectedLog.twilio_message_sid}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                  Message
                </p>
                <div className="max-h-[40vh] overflow-auto rounded-lg border border-neutral-800 bg-black/40 p-4 text-sm leading-relaxed text-neutral-100">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-100">
                    {selectedLog.message_content || 'N/A'}
                  </pre>
                </div>
                {selectedLog.failure_reason && (
                  <div className="mt-3 rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">
                    <p className="mb-1 font-medium">Failure Reason</p>
                    <p>{selectedLog.failure_reason}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
