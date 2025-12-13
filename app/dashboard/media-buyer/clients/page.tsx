import ClientsListControls from '@/components/media-buyer/clients-list-controls'
import { createAdminClient } from '@/lib/db/admin'
import { createClient } from '@/lib/db/server'
import {
  Activity,
  ChevronRight,
  Database,
  ExternalLink,
  Eye,
  Globe,
  Mail,
  Palette,
  Store,
  Users,
} from 'lucide-react'
import { unstable_noStore } from 'next/cache'
import Link from 'next/link'

// ============================================================================
// Types
// ============================================================================

interface PageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    search?: string
  }>
}

interface ClientRow {
  id: string
  brand: string
  website: string | null
  status: string | null
  is_monitored: boolean | null
}

interface ClientDataAvailability {
  hasThemes: boolean
  hasOmnisend: boolean
  totalRecords: number
}

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [20, 50, 100]

// ============================================================================
// Stats Card Component
// ============================================================================

interface StatCardProps {
  title: string
  value: number
  icon: typeof Users
  variant?: 'default' | 'success' | 'warning' | 'info'
}

function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  const variantStyles = {
    default: 'from-white/10 to-white/5 text-white/40',
    success: 'from-green-500/20 to-green-500/10 text-green-400',
    warning: 'from-amber-500/20 to-amber-500/10 text-amber-400',
    info: 'from-blue-500/20 to-blue-500/10 text-blue-400',
  }

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        </div>
        <div
          className={`rounded-lg bg-gradient-to-br ${variantStyles[variant]} p-2.5`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Client Card Component
// ============================================================================

interface ClientCardProps {
  client: ClientRow
  dataAvailability?: ClientDataAvailability
}

function ClientCard({ client, dataAvailability }: ClientCardProps) {
  const isActive = client.status === 'active'
  const hasData = dataAvailability && dataAvailability.totalRecords > 0
  const hasThemes = dataAvailability?.hasThemes
  const hasOmnisend = dataAvailability?.hasOmnisend

  return (
    <Link
      href={`/dashboard/media-buyer/clients/${client.id}`}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 transition-all duration-200 hover:border-white/20 hover:from-white/[0.08] hover:to-white/[0.04] hover:shadow-lg hover:shadow-black/20"
    >
      {/* Status Indicator */}
      <div
        className={`absolute right-4 top-4 h-2 w-2 rounded-full ${
          isActive ? 'bg-green-400' : 'bg-amber-400'
        }`}
        title={isActive ? 'Active' : 'Inactive'}
      />

      {/* Card Content */}
      <div className="flex flex-col gap-3">
        {/* Client Name */}
        <div className="flex items-start justify-between gap-2 pr-4">
          <h3 className="line-clamp-2 font-semibold leading-tight text-white">
            {client.brand}
          </h3>
        </div>

        {/* Website */}
        {client.website ? (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {client.website.replace(/^https?:\/\//, '')}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-white/30">
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            <span>No website</span>
          </div>
        )}

        {/* Data Availability Indicators */}
        <div className="flex items-center gap-3 border-t border-white/5 pt-3">
          <div
            className={`flex items-center gap-1.5 ${
              hasThemes ? 'text-purple-400' : 'text-white/20'
            }`}
            title={hasThemes ? 'Theme data available' : 'No theme data'}
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Theme</span>
          </div>
          <div
            className={`flex items-center gap-1.5 ${
              hasOmnisend ? 'text-orange-400' : 'text-white/20'
            }`}
            title={hasOmnisend ? 'Omnisend data available' : 'No Omnisend data'}
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Omnisend</span>
          </div>
          {hasData && (
            <div className="ml-auto flex items-center gap-1 text-white/40">
              <Database className="h-3 w-3" />
              <span className="text-xs">{dataAvailability.totalRecords}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {client.is_monitored && (
            <span className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              <Eye className="h-3 w-3" />
              Monitored
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isActive
                ? 'bg-green-500/20 text-green-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* View Details CTA */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/40 transition-colors group-hover:text-white/70">
            <span>View Dashboard</span>
            <ExternalLink className="h-3 w-3" />
          </div>
          <ChevronRight className="h-5 w-5 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white/50" />
        </div>
      </div>

      {/* Hover Gradient Effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/[0.03] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </Link>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default async function MediaBuyerClientsPage({
  searchParams,
}: PageProps) {
  unstable_noStore()

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const pageSize = PAGE_SIZE_OPTIONS.includes(parseInt(params.pageSize || '0'))
    ? parseInt(params.pageSize!)
    : DEFAULT_PAGE_SIZE
  const searchQuery = params.search?.trim() || ''

  // Get current user and their pod
  const authDb = createClient()
  const {
    data: { user },
  } = await authDb.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
        <div className="mx-auto max-w-[1800px]">
          <div className="flex min-h-[400px] flex-col items-center justify-center">
            <p className="text-white/60">Please sign in to view clients.</p>
          </div>
        </div>
      </main>
    )
  }

  const db = await createAdminClient()
  const role = user.user_metadata?.role ?? 'exec'
  const isExec = role === 'exec'

  // Get the user's pod (for non-exec users)
  const { data: pod, error: podError } = await db
    .from('pod')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  // For non-exec users without a pod, show empty state
  if (!isExec && (podError || !pod)) {
    return (
      <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
        <div className="mx-auto max-w-[1800px]">
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-white/5 p-6">
              <Users className="h-12 w-12 text-white/30" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-medium text-white">
                No Clients Assigned
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/60">
                Your pod doesn&apos;t have any clients assigned yet. Please
                contact your team lead.
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Build base query for stats (all clients for user's scope)
  let allClientsQuery = db
    .from('clients')
    .select('id, status, is_monitored')
    .in('status', ['active', 'inactive'])

  // Non-exec users only see their pod's clients (filter by pod name)
  if (!isExec && pod?.name) {
    allClientsQuery = allClientsQuery.eq('pod', pod.name)
  }

  const { data: allClients } = await allClientsQuery

  // Calculate stats
  const stats = {
    total: allClients?.length || 0,
    active: allClients?.filter((c) => c.status === 'active').length || 0,
    inactive: allClients?.filter((c) => c.status !== 'active').length || 0,
    monitored: allClients?.filter((c) => c.is_monitored).length || 0,
  }

  // Build query for total count
  let countQuery = db
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .in('status', ['active', 'inactive'])

  // Apply pod filter for non-exec users
  if (!isExec && pod?.name) {
    countQuery = countQuery.eq('pod', pod.name)
  }

  // Apply search filter to count query
  if (searchQuery) {
    countQuery = countQuery.or(
      `brand.ilike.%${searchQuery}%,website.ilike.%${searchQuery}%`,
    )
  }

  const { count: totalCount } = await countQuery

  // Build paginated clients query (separate query to avoid mutation issues)
  let clientsQuery = db
    .from('clients')
    .select('id, brand, website, status, is_monitored')
    .in('status', ['active', 'inactive'])

  // Apply pod filter for non-exec users
  if (!isExec && pod?.name) {
    clientsQuery = clientsQuery.eq('pod', pod.name)
  }

  // Apply search filter
  if (searchQuery) {
    clientsQuery = clientsQuery.or(
      `brand.ilike.%${searchQuery}%,website.ilike.%${searchQuery}%`,
    )
  }

  // Apply pagination
  const offset = (page - 1) * pageSize
  const { data: clients, error } = await clientsQuery
    .order('brand', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('Error fetching clients:', error)
    return (
      <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
        <div className="mx-auto max-w-[1800px]">
          <div className="flex min-h-[400px] flex-col items-center justify-center">
            <p className="text-red-400">
              Failed to load clients. Please try again.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Fetch data availability for all displayed clients
  const clientIds =
    clients?.map((c) => parseInt(c.id, 10)).filter(Boolean) || []

  // Get snapshot data with source info to determine what data each client has
  const { data: snapshotData } =
    clientIds.length > 0
      ? await db
          .from('api_snapshots')
          .select('client_id, total_records, source:api_sources(provider)')
          .in('client_id', clientIds)
          .eq('status', 'completed')
      : { data: null }

  // Build data availability map
  const dataAvailabilityMap = new Map<string, ClientDataAvailability>()

  if (snapshotData) {
    // Group by client_id
    const clientDataMap = new Map<
      number,
      { providers: Set<string>; totalRecords: number }
    >()

    snapshotData.forEach((snapshot) => {
      if (!snapshot.client_id) return

      const existing = clientDataMap.get(snapshot.client_id) || {
        providers: new Set<string>(),
        totalRecords: 0,
      }

      // Get provider from joined source data
      const provider = (snapshot.source as { provider?: string } | null)
        ?.provider
      if (provider) {
        existing.providers.add(provider.toLowerCase())
      }
      existing.totalRecords += snapshot.total_records || 0

      clientDataMap.set(snapshot.client_id, existing)
    })

    // Convert to availability format
    clientDataMap.forEach((data, clientId) => {
      dataAvailabilityMap.set(String(clientId), {
        hasThemes: data.providers.has('shopify') || data.providers.has('theme'),
        hasOmnisend: data.providers.has('omnisend'),
        totalRecords: data.totalRecords,
      })
    })
  }

  const totalPages = Math.ceil((totalCount || 0) / pageSize)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return (
    <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
      <div className="mx-auto max-w-[1800px] space-y-8">
        {/* Header */}
        <header>
          <h1 className="bg-gradient-to-b from-white via-zinc-300/90 to-white/70 bg-clip-text text-4xl font-bold tracking-wide text-transparent">
            Hub
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
        <ClientsListControls
          searchQuery={searchQuery}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          defaultPageSize={DEFAULT_PAGE_SIZE}
        />

        {/* Client Grid */}
        {!clients || clients.length === 0 ? (
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
              <Link
                href="/dashboard/media-buyer/clients"
                className="mt-4 text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Clear search
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                dataAvailability={dataAvailabilityMap.get(client.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
            <p className="text-sm text-white/50">
              Showing{' '}
              <span className="font-medium text-white">{clients?.length}</span>{' '}
              of{' '}
              <span className="font-medium text-white">{totalCount || 0}</span>{' '}
              clients
            </p>

            <div className="flex items-center gap-1">
              {/* First Page */}
              <PaginationLink
                href={buildUrl(1, pageSize, searchQuery)}
                disabled={!hasPrevPage}
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
              </PaginationLink>

              {/* Previous Page */}
              <PaginationLink
                href={buildUrl(page - 1, pageSize, searchQuery)}
                disabled={!hasPrevPage}
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
              </PaginationLink>

              {/* Page Numbers */}
              <div className="hidden items-center gap-1 px-2 sm:flex">
                {generatePageNumbers(page, totalPages).map((pageNum, idx) =>
                  pageNum === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-white/30"
                    >
                      ...
                    </span>
                  ) : (
                    <Link
                      key={pageNum}
                      href={buildUrl(pageNum as number, pageSize, searchQuery)}
                      className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                        pageNum === page
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ),
                )}
              </div>

              {/* Mobile Page Indicator */}
              <span className="px-3 text-sm text-white/50 sm:hidden">
                {page} / {totalPages}
              </span>

              {/* Next Page */}
              <PaginationLink
                href={buildUrl(page + 1, pageSize, searchQuery)}
                disabled={!hasNextPage}
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
              </PaginationLink>

              {/* Last Page */}
              <PaginationLink
                href={buildUrl(totalPages, pageSize, searchQuery)}
                disabled={!hasNextPage}
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
              </PaginationLink>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// ============================================================================
// Helper Components & Functions
// ============================================================================

function PaginationLink({
  href,
  disabled,
  children,
  ...props
}: {
  href: string
  disabled: boolean
  children: React.ReactNode
  'aria-label'?: string
}) {
  if (disabled) {
    return (
      <span
        className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg text-white/20"
        {...props}
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/5 hover:text-white"
      {...props}
    >
      {children}
    </Link>
  )
}

function buildUrl(page: number, pageSize: number, search: string): string {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', String(page))
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(pageSize))
  if (search) params.set('search', search)
  const queryString = params.toString()
  return `/dashboard/media-buyer/clients${queryString ? `?${queryString}` : ''}`
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = []

  // Always show first page
  pages.push(1)

  if (currentPage > 3) {
    pages.push('...')
  }

  // Show pages around current
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push('...')
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}
