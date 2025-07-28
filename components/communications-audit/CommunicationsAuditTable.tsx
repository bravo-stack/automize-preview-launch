'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type {
  CommunicationReport,
  CommunicationsAuditData,
  SortOption,
  StatusFilter,
} from '@/types/communications-audit'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface Props {
  initialData: CommunicationsAuditData
}

export default function CommunicationsAuditTable({ initialData }: Props) {
  const [selectedDate, setSelectedDate] = useState(initialData.latestDate || '')
  const [selectedPod, setSelectedPod] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('not_replied')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [data, setData] = useState<CommunicationReport[]>(initialData.reports)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Use the server-provided data directly
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

      if (selectedPod !== 'all') {
        params.append('guild_id', selectedPod)
      }

      const response = await fetch(`/api/communications-audit?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const result = await response.json()
      setData(result.data || [])
      setCurrentPage(1) // Reset to first page when new data is loaded
    } catch (error) {
      console.error('Error:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate, selectedPod])

  useEffect(() => {
    if (selectedDate && selectedDate !== initialData.latestDate) {
      fetchData()
    }
  }, [selectedDate, fetchData, initialData.latestDate])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, sortBy, selectedPod])

  // Get status based on the color coding from the sheet
  const getStatus = (report: CommunicationReport): string => {
    const ixmDays = report.days_since_ixm_message || 0
    const teamDays = report.days_since_team_message || 0
    const clientDays = report.days_since_client_message || 0

    // Check explicit status first
    if (report.status?.toLowerCase().includes('transferred'))
      return 'transferred'
    if (report.status?.toLowerCase().includes('left')) return 'left_pod'
    if (report.status?.toLowerCase().includes('inactive')) return 'inactive'

    // IXM/Team hasn't reached out for 48 hours (2 days)
    if (Math.min(ixmDays, teamDays) >= 2) return 'not_replied_48h'

    // Client responded (white in sheet)
    if (clientDays <= 1) return 'responded'

    // Default to not replied
    return 'not_replied_48h'
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'not_replied_48h':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'responded':
        return 'bg-white/10 text-white border-white/30'
      case 'inactive':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'transferred':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'left_pod':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'not_replied_48h':
        return "Didn't reach out (48h)"
      case 'responded':
        return 'Client responded'
      case 'inactive':
        return 'Inactive'
      case 'transferred':
        return 'Transferred'
      case 'left_pod':
        return 'Left pod'
      default:
        return 'Unknown'
    }
  }

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((report) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          report.channel_name?.toLowerCase().includes(searchLower) ||
          report.last_client_username?.toLowerCase().includes(searchLower) ||
          report.last_team_username?.toLowerCase().includes(searchLower) ||
          report.guild_name?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((report) => {
        const status = getStatus(report)
        switch (statusFilter) {
          case 'not_replied_48h':
            return status === 'not_replied_48h'
          case 'not_messaged_7d':
            return (report.days_since_client_message || 0) >= 7
          case 'responded':
            return status === 'responded'
          case 'inactive':
            return status === 'inactive'
          case 'transferred':
            return status === 'transferred'
          case 'left_pod':
            return status === 'left_pod'
          default:
            return true
        }
      })
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'not_replied':
          const statusA = getStatus(a)
          const statusB = getStatus(b)
          if (statusA === 'not_replied_48h' && statusB !== 'not_replied_48h')
            return -1
          if (statusB === 'not_replied_48h' && statusA !== 'not_replied_48h')
            return 1
          return (
            (a.days_since_ixm_message || 0) - (b.days_since_ixm_message || 0)
          )

        case 'replied':
          const repliedA = getStatus(a) === 'responded' ? 0 : 1
          const repliedB = getStatus(b) === 'responded' ? 0 : 1
          return repliedA - repliedB

        case 'alphabetical':
          return (a.channel_name || '').localeCompare(b.channel_name || '')

        case 'inactive':
          const inactiveA = getStatus(a) === 'inactive' ? 0 : 1
          const inactiveB = getStatus(b) === 'inactive' ? 0 : 1
          return inactiveA - inactiveB

        case 'transferred':
          const transferredA = getStatus(a) === 'transferred' ? 0 : 1
          const transferredB = getStatus(b) === 'transferred' ? 0 : 1
          return transferredA - transferredB

        case 'left_pod':
          const leftA = getStatus(a) === 'left_pod' ? 0 : 1
          const leftB = getStatus(b) === 'left_pod' ? 0 : 1
          return leftA - leftB

        default:
          return 0
      }
    })
  }, [data, searchTerm, statusFilter, sortBy])

  // Pagination logic
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [filteredAndSortedData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const totalItems = filteredAndSortedData.length

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="max-w-md rounded-lg border border-zinc-800 bg-night-starlit p-8">
            <h3 className="mb-4 text-xl font-semibold text-white">
              No Communication Reports Found
            </h3>
            <p className="mb-4 text-white/70">
              There are no communication audit reports in the database yet.
              Reports will appear here once data is populated in the
              <code className="mx-1 rounded bg-zinc-800 px-2 py-1 text-sm">
                communication_reports
              </code>
              table.
            </p>
            <p className="text-sm text-white/50">
              Make sure your data ingestion process is running to populate
              communication audit data.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <Card className="border-zinc-800 bg-night-starlit p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  Report Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-night-starlit px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Date</option>
                  {dates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pod Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Pod</label>
                <select
                  value={selectedPod}
                  onChange={(e) => setSelectedPod(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-night-starlit px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Pods</option>
                  {pods.map((pod) => (
                    <option key={pod.guild_id} value={pod.guild_id}>
                      {pod.guild_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full rounded-md border border-zinc-700 bg-night-starlit px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="not_replied">Not Replied</option>
                  <option value="replied">Replied</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                  <option value="left_pod">Left Pod</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="w-full rounded-md border border-zinc-700 bg-night-starlit px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="not_replied_48h">Not replied (48h)</option>
                  <option value="not_messaged_7d">Not messaged (7d)</option>
                  <option value="responded">Client responded</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                  <option value="left_pod">Left pod</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-white/70">
                Search
              </label>
              <input
                type="text"
                placeholder="Search channels, clients, team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-night-starlit px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </Card>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              {
                label: 'Not Replied (48h)',
                status: 'not_replied_48h',
                color: 'bg-red-500',
              },
              {
                label: 'Client Responded',
                status: 'responded',
                color: 'bg-white',
              },
              { label: 'Inactive', status: 'inactive', color: 'bg-orange-500' },
              {
                label: 'Transferred',
                status: 'transferred',
                color: 'bg-green-500',
              },
              { label: 'Left Pod', status: 'left_pod', color: 'bg-purple-500' },
            ].map(({ label, status, color }) => {
              const count = filteredAndSortedData.filter(
                (report) => getStatus(report) === status,
              ).length
              return (
                <Card
                  key={status}
                  className="border-zinc-800 bg-night-starlit p-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${color}`}></div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {count}
                      </div>
                      <div className="text-sm text-white/70">{label}</div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Data Table */}
          <Card className="border-zinc-800 bg-night-starlit">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <table className="w-max min-w-full">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="min-w-[120px] p-4 text-left font-medium text-white/70">
                        Channel
                      </th>
                      <th className="min-w-[100px] p-4 text-left font-medium text-white/70">
                        Pod
                      </th>
                      <th className="min-w-[120px] p-4 text-left font-medium text-white/70">
                        Status
                      </th>
                      <th className="min-w-[140px] p-4 text-left font-medium text-white/70">
                        Last Client Message
                      </th>
                      <th className="min-w-[140px] p-4 text-left font-medium text-white/70">
                        Last IXM Message
                      </th>
                      <th className="min-w-[140px] p-4 text-left font-medium text-white/70">
                        Last Team Message
                      </th>
                      <th className="min-w-[120px] p-4 text-left font-medium text-white/70">
                        Days Since IXM
                      </th>
                      <th className="min-w-[130px] p-4 text-left font-medium text-white/70">
                        Days Since Client
                      </th>
                      <th className="min-w-[100px] p-4 text-left font-medium text-white/70">
                        User ID
                      </th>
                      <th className="min-w-[120px] p-4 text-left font-medium text-white/70">
                        Report Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((report) => {
                      const status = getStatus(report)
                      return (
                        <tr
                          key={report.id}
                          className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/50"
                        >
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-white">
                                {report.channel_name}
                              </div>
                              {report.last_client_username && (
                                <div className="text-sm text-white/70">
                                  Client: {report.last_client_username}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-white/80">
                            {report.guild_name}
                          </td>
                          <td className="p-4">
                            <Badge
                              className={`${getStatusColor(status)} border`}
                            >
                              {getStatusLabel(status)}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-white/80">
                              {formatDate(report.last_client_message_at)}
                            </div>
                            <div className="text-sm text-white/60">
                              {formatTime(report.last_client_message_at)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-white/80">
                              {formatDate(report.last_ixm_message_at)}
                            </div>
                            <div className="text-sm text-white/60">
                              {formatTime(report.last_ixm_message_at)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-white/80">
                              {formatDate(report.last_team_message_at)}
                            </div>
                            <div className="text-sm text-white/60">
                              {formatTime(report.last_team_message_at)}
                            </div>
                            {report.last_team_username && (
                              <div className="text-sm text-white/70">
                                by {report.last_team_username}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`font-semibold ${
                                (report.days_since_ixm_message || 0) >= 2
                                  ? 'text-red-400'
                                  : 'text-white/80'
                              }`}
                            >
                              {report.days_since_ixm_message || 0} days
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`font-semibold ${
                                (report.days_since_client_message || 0) >= 7
                                  ? 'text-orange-400'
                                  : 'text-white/80'
                              }`}
                            >
                              {report.days_since_client_message || 0} days
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-white">
                              {report.last_client_user_id || 'N/A'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-white">
                              {formatDate(report.report_date)}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {paginatedData.length === 0 && !loading && (
                  <div className="py-20 text-center text-white/70">
                    {selectedDate
                      ? 'No data found for the selected filters.'
                      : 'Please select a report date to view data.'}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <Card className="border-zinc-800 bg-night-starlit p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70">
                      Items per page:
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) =>
                        handleItemsPerPageChange(Number(e.target.value))
                      }
                      className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-white"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="text-sm text-white/70">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
                    {totalItems} items
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`rounded px-3 py-1 text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
