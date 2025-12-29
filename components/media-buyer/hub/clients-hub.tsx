'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Activity,
  ChevronRight,
  Database,
  Eye,
  Globe,
  Mail,
  Palette,
  Search,
  Store,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { StatCard } from './stat-card'
import type { ClientDataAvailability, HubClient, HubStats } from './types'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from './types'

interface ClientsHubProps {
  clients: HubClient[]
  dataAvailabilityMap: Record<string, ClientDataAvailability>
  stats: HubStats
}

export function ClientsHub({
  clients,
  dataAvailabilityMap,
  stats,
}: ClientsHubProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [currentPage, setCurrentPage] = useState(1)

  // Client-side filtering
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients

    const query = searchQuery.toLowerCase()
    return clients.filter(
      (client) =>
        client.brand.toLowerCase().includes(query) ||
        client.full_name?.toLowerCase().includes(query) ||
        client.website?.toLowerCase().includes(query),
    )
  }, [clients, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / pageSize)
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredClients.slice(start, start + pageSize)
  }, [filteredClients, currentPage, pageSize])

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="bg-gradient-to-b from-white via-zinc-300/90 to-white/70 bg-clip-text text-4xl font-bold tracking-wide text-transparent">
          Client Dashboard
        </h1>
        <p className="mt-2 text-lg text-white/60">
          View theme configurations and Omnisend performance metrics for your
          assigned clients.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Clients" value={stats.total} icon={Users} />
        <StatCard
          title="Active"
          value={stats.active}
          icon={Activity}
          variant="success"
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon={Store}
          variant="warning"
        />
        <StatCard
          title="Monitored"
          value={stats.monitored}
          icon={Eye}
          variant="info"
        />
      </div>

      {/* Search and Page Size Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by name or website..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/40 transition-colors focus:border-white/20 focus:bg-white/[0.07] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="pageSize" className="text-sm text-white/50">
            Show
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors focus:border-white/20 focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-white"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-white/50">per page</span>
        </div>
      </div>

      {/* Client List */}
      {paginatedClients.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-16">
          <div className="rounded-full bg-white/5 p-5">
            <Store className="h-10 w-10 text-white/20" />
          </div>
          <h3 className="mt-4 font-medium text-white">No Clients Found</h3>
          <p className="mt-1 text-sm text-white/50">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'No clients are available'}
          </p>
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="mt-4 text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.02]">
          <Table>
            <TableHeader className="border-white/5 bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/40">Client</TableHead>
                <TableHead className="text-white/40">Status</TableHead>
                <TableHead className="text-white/40">Integrations</TableHead>
                <TableHead className="text-right text-white/40">
                  Records
                </TableHead>
                <TableHead className="text-right text-white/40"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => {
                const dataAvailability = dataAvailabilityMap[client.id]
                const isActive = client.status === 'active'
                const hasData =
                  dataAvailability && dataAvailability.totalRecords > 0
                const hasThemes = dataAvailability?.hasThemes
                const hasOmnisend = dataAvailability?.hasOmnisend

                return (
                  <TableRow
                    key={client.id}
                    className="border-white/5 hover:bg-white/[0.04]"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/dashboard/media-buyer/clients/${client.id}`}
                          className="font-medium text-white hover:text-blue-400"
                        >
                          {client.brand}
                        </Link>
                        {client.website ? (
                          <div className="flex items-center gap-1.5 text-xs text-white/40">
                            <Globe className="h-3 w-3" />
                            <span className="max-w-[20ch] truncate">
                              {client.website.replace(/^https?:\/\//, '')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-white/20">
                            <Globe className="h-3 w-3" />
                            <span>No website</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          <span className="text-white/60">
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {client.is_monitored && (
                          <div
                            className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400"
                            title="Monitored"
                          >
                            <Eye className="h-3 w-3" />
                            <span className="hidden lg:inline">Monitored</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        {hasThemes ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400 ring-1 ring-inset ring-purple-500/20">
                            <Palette className="h-3 w-3" />
                            Shopify
                          </span>
                        ) : (
                          <span className="text-xs text-white/10">-</span>
                        )}
                        {hasOmnisend && (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-400 ring-1 ring-inset ring-orange-500/20">
                            <Mail className="h-3 w-3" />
                            Omnisend
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasData ? (
                        <div className="inline-flex items-center gap-1.5 text-white/60">
                          <Database className="h-3.5 w-3.5 text-white/30" />
                          <span>{dataAvailability.totalRecords}</span>
                        </div>
                      ) : (
                        <span className="text-white/20">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/media-buyer/clients/${client.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        title="View Details"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="text-sm text-white/50">
            Showing{' '}
            <span className="font-medium text-white">
              {paginatedClients.length}
            </span>{' '}
            of{' '}
            <span className="font-medium text-white">
              {filteredClients.length}
            </span>{' '}
            clients
          </p>

          <div className="flex items-center gap-1">
            {/* First Page */}
            <PaginationButton
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </PaginationButton>

            {/* Previous Page */}
            <PaginationButton
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </PaginationButton>

            {/* Page Numbers */}
            <div className="hidden items-center gap-1 px-2 sm:flex">
              {generatePageNumbers(currentPage, totalPages).map(
                (pageNum, idx) =>
                  pageNum === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-white/30"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum as number)}
                      className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                        pageNum === currentPage
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
              )}
            </div>

            {/* Mobile Page Indicator */}
            <span className="px-3 text-sm text-white/50 sm:hidden">
              {currentPage} / {totalPages}
            </span>

            {/* Next Page */}
            <PaginationButton
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </PaginationButton>

            {/* Last Page */}
            <PaginationButton
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  )
}

function PaginationButton({
  onClick,
  disabled,
  children,
  ...props
}: {
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
  'aria-label'?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
        disabled
          ? 'cursor-not-allowed text-white/20'
          : 'text-white/50 hover:bg-white/5 hover:text-white'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = [1]

  if (currentPage > 3) pages.push('...')

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (currentPage < totalPages - 2) pages.push('...')

  if (totalPages > 1) pages.push(totalPages)

  return pages
}
