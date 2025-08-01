'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type {
  CommunicationReport,
  CommunicationsAuditData,
} from '@/types/communications-audit'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface Props {
  initialData: CommunicationsAuditData
}

interface SpreadsheetCell {
  categoryName: string
  podName: string
  status: string
  channelName?: string
  report?: CommunicationReport
}

export default function CommunicationsAuditSpreadsheet({ initialData }: Props) {
  const [selectedDate, setSelectedDate] = useState(initialData.latestDate || '')
  const [data, setData] = useState<CommunicationReport[]>(initialData.reports)
  const [loading, setLoading] = useState(false)

  const dates = initialData.availableDates
  const pods = initialData.availablePods
  const hasData = initialData.availableDates.length > 0

  const fetchData = useCallback(async () => {
    if (!selectedDate) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        report_date: selectedDate,
      })

      const response = await fetch(`/api/communications-audit?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const result = await response.json()
      setData(result.data || [])
    } catch (error) {
      console.error('Error:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    if (selectedDate && selectedDate !== initialData.latestDate) {
      fetchData()
    }
  }, [selectedDate, fetchData, initialData.latestDate])

  // Get status directly from the report status field
  const getStatus = (report: CommunicationReport): string => {
    if (!report.status) return 'unknown'

    const status = report.status.toLowerCase()

    // Map the actual status values from the communication_reports.status field
    // Category-based statuses (high priority)
    if (status === 'inactive') return 'inactive'
    if (status === 'transferred') return 'transferred'
    if (status === 'churned') return 'churned' // churned translates as left

    // Message analysis statuses
    if (
      status.includes("didn't reach out for 48 hours") ||
      status.includes("ixm didn't reach out")
    )
      return 'ixm_no_reach_48h'
    if (
      status.includes('client silent for 5+ days') ||
      status.includes('client silent')
    )
      return 'client_silent_5d'
    if (
      status.includes('client responded - awaiting team reply') ||
      status.includes('awaiting team reply')
    )
      return 'client_awaiting_team'
    if (status.includes('active communication')) return 'active_communication'
    if (status.includes('no messages found')) return 'no_messages'
    if (
      status.includes('team only - no client messages') ||
      status.includes('team only')
    )
      return 'team_only'
    if (
      status.includes('client only - no team response') ||
      status.includes('client only')
    )
      return 'client_only_no_team'

    return 'unknown'
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      // Red: didn't reach out for 48 hours
      case 'ixm_no_reach_48h':
      case 'client_only_no_team':
        return 'bg-red-500 text-white'

      // White: clients responded to
      case 'client_silent_5d':
      case 'client_awaiting_team':
      case 'active_communication':
      case 'no_messages':
      case 'team_only':
        return 'bg-white text-black'

      // Orange: Inactive
      case 'inactive':
        return 'bg-orange-500 text-white'

      // Green: Transferred
      case 'transferred':
        return 'bg-green-500 text-white'

      // Purple: Left Pod (Churned)
      case 'churned':
        return 'bg-purple-500 text-white'

      default:
        return 'bg-gray-400 text-white'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'ixm_no_reach_48h':
        return 'IXM No Reach 48h'
      case 'client_silent_5d':
        return 'Client Silent 5+ Days'
      case 'client_awaiting_team':
        return 'Client Awaiting Team'
      case 'active_communication':
        return 'Active Communication'
      case 'no_messages':
        return 'No Messages Found'
      case 'team_only':
        return 'Team Only'
      case 'client_only_no_team':
        return 'Client Only - No Team'
      case 'inactive':
        return 'Inactive'
      case 'transferred':
        return 'Transferred'
      case 'churned':
        return 'Churned'
      default:
        return 'Unknown Status'
    }
  }

  // Create spreadsheet data structure
  const spreadsheetData = useMemo(() => {
    if (!data.length)
      return { pods: [], podCategories: new Map(), cells: new Map() }

    // Get unique pods
    const podsWithData = Array.from(
      new Set(data.map((report) => report.guild_name).filter(Boolean)),
    ).sort()

    // Create a map of pod -> categories for that pod
    const podCategories = new Map<string, string[]>()

    // Create cells map
    const cells = new Map<string, SpreadsheetCell>()

    data.forEach((report) => {
      if (!report.category_name || !report.guild_name) return

      // Add category to pod's category list
      if (!podCategories.has(report.guild_name)) {
        podCategories.set(report.guild_name, [])
      }
      const categories = podCategories.get(report.guild_name)!
      if (!categories.includes(report.category_name)) {
        categories.push(report.category_name)
        categories.sort()
      }

      const key = `${report.guild_name}-${report.category_name}`
      const status = getStatus(report)

      cells.set(key, {
        categoryName: report.category_name,
        podName: report.guild_name,
        status,
        channelName: report.channel_name || undefined,
        report,
      })
    })

    return {
      pods: podsWithData,
      podCategories,
      cells,
    }
  }, [data])

  if (!hasData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-lg rounded-xl border border-zinc-800/50 bg-gradient-to-br from-night-starlit to-night-moonlit p-8 text-center shadow-2xl">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-zinc-800/50 p-3">
              <svg
                className="h-8 w-8 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <h3 className="mb-4 text-xl font-semibold text-white">
            No Communication Reports Found
          </h3>
          <p className="mb-4 text-zinc-300">
            There are no communication audit reports in the database yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <label
            htmlFor="date-select"
            className="text-sm font-medium text-zinc-300"
          >
            Report Date:
          </label>
          <select
            id="date-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-400">Legend:</span>
          <Badge className="bg-red-500 text-white">
            Didn&apos;t reach out for 48 hours
          </Badge>
          <Badge className="bg-white text-black">Clients responded to</Badge>
          <Badge className="bg-orange-500 text-white">Inactive</Badge>
          <Badge className="bg-green-500 text-white">Transferred</Badge>
          <Badge className="bg-purple-500 text-white">Left Pod (Churned)</Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-600 border-t-white"></div>
            <p className="text-sm text-zinc-400">Loading audit data...</p>
          </div>
        </div>
      ) : (
        <Card className="overflow-hidden border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
          <div className="max-h-[80vh] overflow-auto">
            <table className="w-full min-w-max">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-zinc-700">
                  {spreadsheetData.pods.map((pod) => (
                    <th
                      key={pod}
                      className="min-w-[200px] border-r border-zinc-700 bg-zinc-800/90 px-4 py-3 text-center text-sm font-medium text-zinc-300 backdrop-blur-sm"
                    >
                      <div
                        className="truncate font-bold text-white"
                        title={pod || ''}
                      >
                        {pod}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Calculate the maximum number of categories across all pods */}
                {(() => {
                  const maxCategories = Math.max(
                    ...spreadsheetData.pods.map(
                      (pod) =>
                        spreadsheetData.podCategories.get(pod)?.length || 0,
                    ),
                  )

                  return Array.from(
                    { length: maxCategories },
                    (_, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={`border-b border-zinc-800/50 ${
                          rowIndex % 2 === 0
                            ? 'bg-zinc-900/30'
                            : 'bg-zinc-900/10'
                        }`}
                      >
                        {spreadsheetData.pods.map((pod) => {
                          const categories =
                            spreadsheetData.podCategories.get(pod) || []
                          const category = categories[rowIndex]

                          if (!category) {
                            return (
                              <td
                                key={`${pod}-empty-${rowIndex}`}
                                className="border-r border-zinc-800/50 bg-zinc-900/30 px-2 py-2 text-center"
                              >
                                <div className="flex h-8 items-center justify-center">
                                  <span className="text-xs text-zinc-500">
                                    —
                                  </span>
                                </div>
                              </td>
                            )
                          }

                          const cellKey = `${pod}-${category}`
                          const cell = spreadsheetData.cells.get(cellKey)

                          return (
                            <td
                              key={`${pod}-${category}`}
                              className={`border-r border-zinc-800/50 px-2 py-2 ${cell ? getStatusColor(cell.status) : 'bg-zinc-900/50'}`}
                              title={
                                cell
                                  ? `Category: ${category}\nChannel: ${cell.channelName || 'No channel name'}\nStatus: ${getStatusLabel(cell.status)}\nLast Client Message: ${cell.report?.days_since_client_message || 0} days ago\nLast Team Message: ${cell.report?.days_since_team_message || 0} days ago`
                                  : `Category: ${category}\nNo data available`
                              }
                            >
                              <div className="py-1">
                                {/* Category name only */}
                                <div
                                  className="truncate text-center text-xs font-medium"
                                  title={category}
                                >
                                  {category}
                                </div>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ),
                  )
                })()}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            {
              status: 'ixm_no_reach_48h',
              label: 'Didn&apos;t reach out',
              color: 'bg-red-500 text-white',
            },
            {
              status: 'active_communication',
              label: 'Clients responded',
              color: 'bg-white text-black',
            },
            {
              status: 'inactive',
              label: 'Inactive',
              color: 'bg-orange-500 text-white',
            },
            {
              status: 'transferred',
              label: 'Transferred',
              color: 'bg-green-500 text-white',
            },
            {
              status: 'churned',
              label: 'Left Pod',
              color: 'bg-purple-500 text-white',
            },
          ].map(({ status, label, color }) => {
            // For "clients responded", count all the white statuses
            let count = 0
            if (status === 'active_communication') {
              count = data.filter((report) => {
                const reportStatus = getStatus(report)
                return [
                  'client_silent_5d',
                  'client_awaiting_team',
                  'active_communication',
                  'no_messages',
                  'team_only',
                ].includes(reportStatus)
              }).length
            } else if (status === 'ixm_no_reach_48h') {
              // For "didn't reach out", count all red statuses
              count = data.filter((report) => {
                const reportStatus = getStatus(report)
                return ['ixm_no_reach_48h', 'client_only_no_team'].includes(
                  reportStatus,
                )
              }).length
            } else {
              count = data.filter(
                (report) => getStatus(report) === status,
              ).length
            }

            return (
              <Card
                key={status}
                className="border-zinc-800/50 bg-zinc-900/30 p-4 text-center"
              >
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${color} mb-2`}
                >
                  {label}
                </div>
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-xs text-zinc-400">
                  {data.length > 0
                    ? Math.round((count / data.length) * 100)
                    : 0}
                  %
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
