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
  const [sortBy, setSortBy] = useState<SortOption>('high_priority')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [data, setData] = useState<CommunicationReport[]>(initialData.reports)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(100)

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

      // Don't filter by guild_id at API level - we'll filter client-side
      // This ensures we have all data available for combined filtering

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
  }, [selectedDate]) // Removed selectedPod from dependencies since we're not using it in API call

  useEffect(() => {
    if (selectedDate) {
      fetchData()
    }
  }, [selectedDate, fetchData])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, categoryFilter, sortBy, selectedPod])

  // Get status based on the color coding from the sheet
  // Get status directly from the report status field
  const getStatus = (report: CommunicationReport): string => {
    if (!report.status) return 'unknown'

    const status = report.status.toLowerCase()

    // Special handling for categories containing "-IXM"
    if (report.category_name && report.category_name.includes('-IXM')) {
      // For -IXM categories, compute status based on actual timestamp data
      const daysIxmSilent = report.days_since_ixm_message || 0
      const daysTeamSilent = report.days_since_team_message || 0
      const hasClientMessage = report.last_client_message_at !== null
      const hasIxmMessage = report.last_ixm_message_at !== null
      const hasTeamMessage = report.last_team_message_at !== null

      // RED: Didn't reach out for 48 hours (2 days)
      // Check if IXM/team hasn't messaged for 2+ days AND there are client messages
      if (
        hasClientMessage &&
        (daysIxmSilent >= 2 || daysTeamSilent >= 2) &&
        (!hasIxmMessage ||
          !hasTeamMessage ||
          daysIxmSilent >= 2 ||
          daysTeamSilent >= 2)
      ) {
        return 'ixm_no_reach_48h' // RED: Didn't reach out for 48 hours
      }
      // WHITE: Clients responded to
      // IXM/team has responded within 48 hours OR active communication
      else {
        return 'active_communication' // WHITE: Clients responded to
      }
    }

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
        return 'bg-red-500 text-white border-red-500'

      // White: clients responded to
      case 'client_silent_5d':
      case 'client_awaiting_team':
      case 'active_communication':
      case 'no_messages':
      case 'team_only':
        return 'bg-white text-black border-white'

      // Orange: Inactive
      case 'inactive':
        return 'bg-orange-500 text-white border-orange-500'

      // Green: Transferred
      case 'transferred':
        return 'bg-green-500 text-white border-green-500'

      // Purple: Left Pod (Churned)
      case 'churned':
        return 'bg-purple-500 text-white border-purple-500'

      default:
        return 'bg-gray-400 text-white border-gray-400'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'ixm_no_reach_48h':
        return "Didn't reach out for 48 hours"
      case 'client_silent_5d':
        return 'Client Silent 5+ Days'
      case 'client_awaiting_team':
        return 'Client Awaiting Team'
      case 'active_communication':
        return 'Clients responded to'
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
        return 'Left Pod (Churned)'
      default:
        return 'Unknown Status'
    }
  }

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((report) => {
      // Combined filtering logic - ALL conditions must be true

      // 1. Pod filter (if specific pod is selected)
      if (selectedPod !== 'all') {
        if (report.guild_id !== selectedPod) return false
      }

      // 2. Search filter (if search term is provided)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          report.channel_name?.toLowerCase().includes(searchLower) ||
          report.last_client_username?.toLowerCase().includes(searchLower) ||
          report.last_team_username?.toLowerCase().includes(searchLower) ||
          report.guild_name?.toLowerCase().includes(searchLower) ||
          report.category_name?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // 3. Category filter (if specific category is selected)
      if (categoryFilter !== 'all') {
        if (report.category_name !== categoryFilter) return false
      }

      // 4. Status filter (if specific status is selected)
      if (statusFilter !== 'all') {
        const status = getStatus(report)
        let matchesStatus = false

        switch (statusFilter) {
          case 'ixm_no_reach_48h':
            matchesStatus = status === 'ixm_no_reach_48h'
            break
          case 'client_silent_5d':
            matchesStatus = status === 'client_silent_5d'
            break
          case 'client_awaiting_team':
            matchesStatus = status === 'client_awaiting_team'
            break
          case 'active_communication':
            matchesStatus = status === 'active_communication'
            break
          case 'no_messages':
            matchesStatus = status === 'no_messages'
            break
          case 'team_only':
            matchesStatus = status === 'team_only'
            break
          case 'client_only_no_team':
            matchesStatus = status === 'client_only_no_team'
            break
          case 'inactive':
            matchesStatus = status === 'inactive'
            break
          case 'transferred':
            matchesStatus = status === 'transferred'
            break
          case 'churned':
            matchesStatus = status === 'churned'
            break
          default:
            matchesStatus = true
        }

        if (!matchesStatus) return false
      }

      // If all filters pass, include this record
      return true
    })

    // Sort the filtered data
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'high_priority':
          const statusA = getStatus(a)
          const statusB = getStatus(b)
          const highPriorityStatuses = [
            'ixm_no_reach_48h',
            'client_only_no_team',
          ]
          const isHighPriorityA = highPriorityStatuses.includes(statusA)
          const isHighPriorityB = highPriorityStatuses.includes(statusB)

          if (isHighPriorityA && !isHighPriorityB) return -1
          if (isHighPriorityB && !isHighPriorityA) return 1
          return (
            (a.days_since_ixm_message || 0) - (b.days_since_ixm_message || 0)
          )

        case 'medium_priority':
          const statusMedA = getStatus(a)
          const statusMedB = getStatus(b)
          const mediumPriorityStatuses = [
            'client_silent_5d',
            'client_awaiting_team',
            'no_messages',
          ]
          const isMediumPriorityA = mediumPriorityStatuses.includes(statusMedA)
          const isMediumPriorityB = mediumPriorityStatuses.includes(statusMedB)
          return isMediumPriorityA === isMediumPriorityB
            ? 0
            : isMediumPriorityA
              ? -1
              : 1

        case 'low_priority':
          const statusLowA = getStatus(a)
          const statusLowB = getStatus(b)
          const lowPriorityStatuses = ['active_communication', 'team_only']
          const isLowPriorityA = lowPriorityStatuses.includes(statusLowA)
          const isLowPriorityB = lowPriorityStatuses.includes(statusLowB)
          return isLowPriorityA === isLowPriorityB ? 0 : isLowPriorityA ? -1 : 1

        case 'alphabetical':
          return (a.channel_name || '').localeCompare(b.channel_name || '')

        case 'category':
          return (a.category_name || '').localeCompare(b.category_name || '')

        case 'inactive':
          const inactiveA = getStatus(a) === 'inactive' ? 0 : 1
          const inactiveB = getStatus(b) === 'inactive' ? 0 : 1
          return inactiveA - inactiveB

        case 'transferred':
          const transferredA = getStatus(a) === 'transferred' ? 0 : 1
          const transferredB = getStatus(b) === 'transferred' ? 0 : 1
          return transferredA - transferredB

        case 'churned':
          const churnedA = getStatus(a) === 'churned' ? 0 : 1
          const churnedB = getStatus(b) === 'churned' ? 0 : 1
          return churnedA - churnedB

        default:
          return 0
      }
    })
  }, [data, searchTerm, statusFilter, categoryFilter, selectedPod, sortBy])

  // Get unique categories from the data
  const uniqueCategories = useMemo(() => {
    const categories = Array.from(
      new Set(
        data
          .map((report) => report.category_name)
          .filter(
            (category): category is string =>
              category !== null && category !== undefined,
          ),
      ),
    ).sort()
    return categories
  }, [data])

  // Calculate unique category cells (same logic as spreadsheet)
  const uniqueCategoryCells = useMemo(() => {
    const cells = new Map<string, boolean>()

    filteredAndSortedData.forEach((report) => {
      if (!report.category_name || !report.guild_name) return
      const key = `${report.guild_name}-${report.category_name}`
      cells.set(key, true)
    })

    return Array.from(cells.keys())
  }, [filteredAndSortedData])

  // Pagination logic
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [filteredAndSortedData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const totalItems = uniqueCategoryCells.length

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
              Reports will appear here once data is populated in the{' '}
              <code className="mx-1 rounded bg-zinc-800/50 px-2 py-1 font-mono text-sm text-zinc-200">
                communication_reports
              </code>{' '}
              table.
            </p>
            <p className="text-sm text-zinc-400">
              Make sure your data ingestion process is running to populate
              communication audit data.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Enhanced Filters Section */}
          <Card className="border-zinc-800/50 bg-gradient-to-br from-night-starlit to-night-moonlit shadow-xl">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-5 w-5 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
                    />
                  </svg>
                  <h2 className="text-lg font-semibold text-white">Filters</h2>
                </div>
                {(selectedPod !== 'all' ||
                  statusFilter !== 'all' ||
                  categoryFilter !== 'all' ||
                  searchTerm) && (
                  <button
                    onClick={() => {
                      setSelectedPod('all')
                      setStatusFilter('all')
                      setCategoryFilter('all')
                      setSearchTerm('')
                    }}
                    className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {/* Date Selection */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-zinc-300">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Report Date</span>
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2.5 text-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  <label className="flex items-center space-x-2 text-sm font-medium text-zinc-300">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>Pod</span>
                  </label>
                  <select
                    value={selectedPod}
                    onChange={(e) => setSelectedPod(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2.5 text-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  <label className="flex items-center space-x-2 text-sm font-medium text-zinc-300">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                    <span>Sort By</span>
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2.5 text-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="high_priority">High Priority</option>
                    <option value="medium_priority">Medium Priority</option>
                    <option value="low_priority">Low Priority</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="category">Category</option>
                    <option value="inactive">Inactive</option>
                    <option value="transferred">Transferred</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-zinc-300">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Status</span>
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as StatusFilter)
                    }
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2.5 text-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Status</option>
                    <option value="ixm_no_reach_48h">IXM No Reach 48h</option>
                    <option value="client_silent_5d">
                      Client Silent 5+ Days
                    </option>
                    <option value="client_awaiting_team">
                      Client Awaiting Team
                    </option>
                    <option value="active_communication">
                      Active Communication
                    </option>
                    <option value="no_messages">No Messages</option>
                    <option value="team_only">Team Only</option>
                    <option value="client_only_no_team">
                      Client Only - No Team
                    </option>
                    <option value="inactive">Inactive</option>
                    <option value="transferred">Transferred</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-zinc-300">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <span>Category</span>
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2.5 text-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Enhanced Search */}
              <div className="mt-6 space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-zinc-300">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Search</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search channels, clients, team members, categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 pl-10 text-white placeholder-zinc-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          {/* Active Filters Summary */}
          {(selectedPod !== 'all' ||
            statusFilter !== 'all' ||
            categoryFilter !== 'all' ||
            searchTerm) && (
            <Card className="border-zinc-800/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="h-4 w-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-blue-300">
                      Active Filters:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPod !== 'all' && (
                      <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300 ring-1 ring-blue-500/30">
                        <svg
                          className="mr-1 h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Pod:{' '}
                        {pods.find((p) => p.guild_id === selectedPod)
                          ?.guild_name || selectedPod}
                      </span>
                    )}
                    {statusFilter !== 'all' && (
                      <span className="inline-flex items-center rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300 ring-1 ring-purple-500/30">
                        <svg
                          className="mr-1 h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Status:{' '}
                        {statusFilter
                          .replace('_', ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    )}
                    {categoryFilter !== 'all' && (
                      <span className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300 ring-1 ring-green-500/30">
                        <svg
                          className="mr-1 h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        Category: {categoryFilter}
                      </span>
                    )}
                    {searchTerm && (
                      <span className="inline-flex items-center rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-300 ring-1 ring-orange-500/30">
                        <svg
                          className="mr-1 h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        Search: &ldquo;{searchTerm}&rdquo;
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Enhanced Stats Summary */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[
              {
                label: `Channels pending for 48h`,
                status: 'ixm_no_reach_48h',
                color: 'bg-red-500',
                icon: (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
              },
              {
                label: 'Channels responded to',
                status: 'active_communication',
                color: 'bg-white',
                icon: (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
              },
              {
                label: 'Inactive channels',
                status: 'inactive',
                color: 'bg-orange-500',
                icon: (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ),
              },
              {
                label: 'Transferred channels',
                status: 'transferred',
                color: 'bg-green-500',
                icon: (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                ),
              },
              {
                label: 'Left Pod (Churned) channels',
                status: 'churned',
                color: 'bg-purple-500',
                icon: (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                ),
              },
            ].map(({ label, status, color, icon }) => {
              // Apply the same grouping logic as in the spreadsheet
              let count = 0
              if (status === 'active_communication') {
                // For "clients responded", count all the white statuses
                count = filteredAndSortedData.filter((report) => {
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
                count = filteredAndSortedData.filter((report) => {
                  const reportStatus = getStatus(report)
                  return ['ixm_no_reach_48h', 'client_only_no_team'].includes(
                    reportStatus,
                  )
                }).length
              } else {
                count = filteredAndSortedData.filter(
                  (report) => getStatus(report) === status,
                ).length
              }

              const percentage =
                filteredAndSortedData.length > 0
                  ? ((count / filteredAndSortedData.length) * 100).toFixed(1)
                  : '0'

              return (
                <Card
                  key={status}
                  className="group border-zinc-800/50 bg-gradient-to-br from-night-starlit to-night-moonlit transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/5"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${color}/20 text-white transition-colors group-hover:${color}/30`}
                        >
                          {icon}
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">
                            {count}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {percentage}% of total
                          </div>
                        </div>
                      </div>
                      <div
                        className={`h-2 w-2 rounded-full ${color} animate-pulse`}
                      ></div>
                    </div>
                    <div className="mt-3 text-sm font-medium text-zinc-300">
                      {label}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Total Clients Count */}
          {totalItems > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-white">
                Clients: {totalItems}
              </div>
            </div>
          )}

          {/* Enhanced Data Table */}
          <Card className="border-zinc-800/50 bg-gradient-to-br from-night-starlit to-night-moonlit shadow-xl">
            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-600 border-t-white"></div>
                  <p className="text-sm text-zinc-400">Loading data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <div className="p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Communication Reports
                      </h3>
                      <span className="text-sm text-zinc-400">
                        {paginatedData.length} of {totalItems} items
                      </span>
                    </div>
                    <div className="space-y-4">
                      {paginatedData.map((report) => {
                        const status = getStatus(report)
                        return (
                          <div
                            key={report.id}
                            className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4 transition-colors hover:bg-zinc-700/30"
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-white">
                                  {report.channel_name}
                                </h4>
                                <p className="text-sm text-zinc-400">
                                  {report.guild_name}
                                </p>
                              </div>
                              <Badge
                                className={`${getStatusColor(status)} border`}
                              >
                                {getStatusLabel(status)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-zinc-400">Category:</span>
                                <p className="text-white">
                                  {report.category_name || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className="text-zinc-400">Client:</span>
                                <p className="text-white">
                                  {report.last_client_username || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className="text-zinc-400">
                                  Days Since IXM:
                                </span>
                                <p
                                  className={`font-semibold ${
                                    (report.days_since_ixm_message || 0) >= 2
                                      ? 'text-red-400'
                                      : 'text-white'
                                  }`}
                                >
                                  {report.days_since_ixm_message || 0} days
                                </p>
                              </div>
                              <div>
                                <span className="text-zinc-400">
                                  Days Since Client:
                                </span>
                                <p
                                  className={`font-semibold ${
                                    (report.days_since_client_message || 0) >= 7
                                      ? 'text-orange-400'
                                      : 'text-white'
                                  }`}
                                >
                                  {report.days_since_client_message || 0} days
                                </p>
                              </div>
                              <div>
                                <span className="text-zinc-400">
                                  Last Client Message:
                                </span>
                                <p className="text-white">
                                  {formatDate(report.last_client_message_at)}
                                </p>
                              </div>
                              <div>
                                <span className="text-zinc-400">
                                  Last Team Message:
                                </span>
                                <p className="text-white">
                                  {formatDate(report.last_team_message_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <div className="max-h-[100dvh] overflow-auto">
                    <table
                      className="w-max min-w-full table-fixed"
                      style={{ width: 'max-content' }}
                    >
                      <thead>
                        <tr className="border-b border-zinc-700/50 bg-zinc-800/30">
                          <th className="min-w-[200px] p-4 text-left">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z"
                                />
                              </svg>
                              <span className="whitespace-nowrap font-medium text-zinc-300">
                                Channel
                              </span>
                            </div>
                          </th>
                          <th className="min-w-[150px] p-4 text-left">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              <span className="whitespace-nowrap font-medium text-zinc-300">
                                Pod
                              </span>
                            </div>
                          </th>
                          <th className="min-w-[140px] p-4 text-left">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                              <span className="whitespace-nowrap font-medium text-zinc-300">
                                Category
                              </span>
                            </div>
                          </th>
                          <th className="min-w-[180px] p-4 text-left">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="whitespace-nowrap font-medium text-zinc-300">
                                Status
                              </span>
                            </div>
                          </th>
                          <th className="min-w-[180px] p-4 text-left">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span className="whitespace-nowrap font-medium text-zinc-300">
                                Last Client Message
                              </span>
                            </div>
                          </th>
                          <th className="min-w-[180px] p-4 text-left">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                              <span className="whitespace-nowrap font-medium text-zinc-300">
                                Last IXM Message
                              </span>
                            </div>
                          </th>
                          <th className="min-w-[200px] p-4 text-left">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                />
                              </svg>
                              <span className="whitespace-nowrap font-medium text-zinc-300">
                                Last Team Message
                              </span>
                            </div>
                          </th>
                          <th className="min-w-[150px] p-4 text-left">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="whitespace-nowrap font-medium text-zinc-300">
                                Days Since IXM
                              </span>
                            </div>
                          </th>
                          <th className="min-w-[160px] p-4 text-left">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="whitespace-nowrap font-medium text-zinc-300">
                                Days Since Client
                              </span>
                            </div>
                          </th>
                          <th className="min-w-[120px] p-4 text-left">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                                />
                              </svg>
                              <span className="whitespace-nowrap font-medium text-zinc-300">
                                User ID
                              </span>
                            </div>
                          </th>
                          <th className="min-w-[140px] p-4 text-left">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="whitespace-nowrap font-medium text-zinc-300">
                                Report Date
                              </span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((report, index) => {
                          const status = getStatus(report)
                          return (
                            <tr
                              key={report.id}
                              className={`border-b border-zinc-800/30 transition-all duration-200 hover:bg-zinc-700/20 ${
                                index % 2 === 0
                                  ? 'bg-zinc-800/10'
                                  : 'bg-transparent'
                              }`}
                            >
                              <td className="min-w-[200px] p-4">
                                <div className="space-y-1">
                                  <div className="whitespace-nowrap font-medium text-white">
                                    {report.channel_name}
                                  </div>
                                  {report.last_client_username && (
                                    <div className="whitespace-nowrap text-sm text-zinc-400">
                                      Client: {report.last_client_username}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="min-w-[150px] p-4">
                                <span className="whitespace-nowrap text-zinc-200">
                                  {report.guild_name}
                                </span>
                              </td>
                              <td className="min-w-[140px] p-4">
                                <span className="whitespace-nowrap text-zinc-200">
                                  {report.category_name || 'N/A'}
                                </span>
                              </td>
                              <td className="min-w-[180px] p-4">
                                <Badge
                                  className={`${getStatusColor(status)} whitespace-nowrap border transition-all duration-200 hover:scale-105`}
                                >
                                  {getStatusLabel(status)}
                                </Badge>
                              </td>
                              <td className="min-w-[180px] p-4">
                                <div className="space-y-1">
                                  <div className="whitespace-nowrap text-zinc-200">
                                    {formatDate(report.last_client_message_at)}
                                  </div>
                                  <div className="whitespace-nowrap text-sm text-zinc-400">
                                    {formatTime(report.last_client_message_at)}
                                  </div>
                                </div>
                              </td>
                              <td className="min-w-[180px] p-4">
                                <div className="space-y-1">
                                  <div className="whitespace-nowrap text-zinc-200">
                                    {formatDate(report.last_ixm_message_at)}
                                  </div>
                                  <div className="whitespace-nowrap text-sm text-zinc-400">
                                    {formatTime(report.last_ixm_message_at)}
                                  </div>
                                </div>
                              </td>
                              <td className="min-w-[200px] p-4">
                                <div className="space-y-1">
                                  <div className="whitespace-nowrap text-zinc-200">
                                    {formatDate(report.last_team_message_at)}
                                  </div>
                                  <div className="whitespace-nowrap text-sm text-zinc-400">
                                    {formatTime(report.last_team_message_at)}
                                  </div>
                                  {report.last_team_username && (
                                    <div className="whitespace-nowrap text-sm text-zinc-400">
                                      by {report.last_team_username}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="min-w-[150px] p-4">
                                <div className="flex items-center">
                                  <span
                                    className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${
                                      (report.days_since_ixm_message || 0) >= 2
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-zinc-700/50 text-zinc-200'
                                    }`}
                                  >
                                    {report.days_since_ixm_message || 0} days
                                  </span>
                                </div>
                              </td>
                              <td className="min-w-[160px] p-4">
                                <div className="flex items-center">
                                  <span
                                    className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${
                                      (report.days_since_client_message || 0) >=
                                      7
                                        ? 'bg-orange-500/20 text-orange-400'
                                        : 'bg-zinc-700/50 text-zinc-200'
                                    }`}
                                  >
                                    {report.days_since_client_message || 0} days
                                  </span>
                                </div>
                              </td>
                              <td className="min-w-[120px] p-4">
                                <div className="whitespace-nowrap font-mono text-sm text-zinc-300">
                                  {report.last_client_user_id || 'N/A'}
                                </div>
                              </td>
                              <td className="min-w-[140px] p-4">
                                <div className="whitespace-nowrap text-sm text-zinc-300">
                                  {formatDate(report.report_date)}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {paginatedData.length === 0 && !loading && (
                  <div className="flex min-h-[200px] items-center justify-center text-center">
                    <div className="space-y-3">
                      <svg
                        className="mx-auto h-12 w-12 text-zinc-500"
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
                      <div>
                        <h3 className="text-lg font-medium text-white">
                          No data found
                        </h3>
                        <p className="text-zinc-400">
                          {selectedDate
                            ? 'No data found for the selected filters.'
                            : 'Please select a report date to view data.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Enhanced Pagination Controls */}
          {totalItems > 0 && (
            <Card className="border-zinc-800/50 bg-gradient-to-r from-night-starlit to-night-moonlit">
              <div className="p-4">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="h-4 w-4 text-zinc-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                      <span className="text-sm font-medium text-zinc-300">
                        Items per page:
                      </span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) =>
                          handleItemsPerPageChange(Number(e.target.value))
                        }
                        className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-sm text-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-zinc-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span>
                        Showing{' '}
                        <span className="font-medium text-white">
                          {(currentPage - 1) * itemsPerPage + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium text-white">
                          {Math.min(currentPage * itemsPerPage, totalItems)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium text-white">
                          {totalItems}
                        </span>{' '}
                        items
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 sm:justify-end">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center space-x-2 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2 text-sm text-white transition-all duration-200 hover:bg-zinc-700/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-zinc-800/50"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      <span className="hidden sm:block">Previous</span>
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
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
                              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                  : 'border border-zinc-700/50 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-white'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        },
                      )}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center space-x-2 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2 text-sm text-white transition-all duration-200 hover:bg-zinc-700/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-zinc-800/50"
                    >
                      <span className="hidden sm:block">Next</span>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Page info for mobile */}
                <div className="mt-4 flex justify-center text-center sm:hidden">
                  <span className="text-sm text-zinc-400">
                    Page{' '}
                    <span className="font-medium text-white">
                      {currentPage}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-white">{totalPages}</span>
                  </span>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
