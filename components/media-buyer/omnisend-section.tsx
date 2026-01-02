'use client'

import type {
  CampaignMetricsSummary,
  OmnisendAutomationData,
  OmnisendCampaignData,
  OmnisendContactData,
  OmnisendOrderData,
  OmnisendProductData,
  OmnisendRevenueSummary,
} from '@/types/media-buyer'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  DollarSign,
  Loader2,
  Mail,
  MousePointerClick,
  Package,
  Send,
  ShoppingCart,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'

// ============================================================================
// Revenue Summary Card
// ============================================================================

interface RevenueSummaryCardProps {
  summary: OmnisendRevenueSummary
  lastUpdated: string | null
  isLoading?: boolean
}

export function RevenueSummaryCard({
  summary,
  lastUpdated,
  isLoading = false,
}: RevenueSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-6">
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Revenue Summary</h3>
        </div>
        <div className="mt-6 flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    // Convert cents to dollars
    const dollars = value / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: summary.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(dollars)
  }

  return (
    <div className="rounded-lg border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-500/20 p-2">
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Revenue Summary
            </h3>
            <p className="text-xs text-white/50">Omnisend Orders</p>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date(lastUpdated).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Main Revenue Display */}
      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-white/40">
          Total Revenue
        </p>
        <p className="mt-1 text-4xl font-bold text-green-400">
          {formatCurrency(summary.totalRevenue)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-white/40" />
            <span className="text-xs text-white/50">Orders</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {summary.orderCount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-white/40" />
            <span className="text-xs text-white/50">Avg Order Value</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(summary.averageOrderValue)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Campaign Metrics Card
// ============================================================================

interface CampaignMetricsCardProps {
  metrics: CampaignMetricsSummary
  totalCampaigns: number
  lastUpdated: string | null
  isLoading?: boolean
}

export function CampaignMetricsCard({
  metrics,
  totalCampaigns,
  lastUpdated,
  isLoading = false,
}: CampaignMetricsCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-6">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Campaign Performance
          </h3>
        </div>
        <div className="mt-6 flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/20 p-2">
            <Mail className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Campaign Performance
            </h3>
            <p className="text-xs text-white/50">
              {totalCampaigns} campaigns total
            </p>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date(lastUpdated).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Main Metrics */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/5 bg-white/5 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-white/50">
            <Send className="h-3.5 w-3.5" />
            <span>Sent</span>
          </div>
          <p className="mt-2 text-xl font-bold text-white">
            {metrics.totalSent.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-white/5 bg-white/5 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-white/50">
            <Mail className="h-3.5 w-3.5" />
            <span>Opened</span>
          </div>
          <p className="mt-2 text-xl font-bold text-white">
            {metrics.totalOpened.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-white/5 bg-white/5 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-white/50">
            <MousePointerClick className="h-3.5 w-3.5" />
            <span>Clicked</span>
          </div>
          <p className="mt-2 text-xl font-bold text-white">
            {metrics.totalClicked.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Rate Bars */}
      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Open Rate</span>
            <span className="font-medium text-white">
              {metrics.openRate.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${Math.min(metrics.openRate, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Click Rate</span>
            <span className="font-medium text-white">
              {metrics.clickRate.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(metrics.clickRate * 5, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Bounce Rate</span>
            <span className="font-medium text-white">
              {metrics.bounceRate.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-red-500 transition-all"
              style={{ width: `${Math.min(metrics.bounceRate * 10, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Orders List Component
// ============================================================================

interface OrdersListProps {
  orders: OmnisendOrderData[]
  isLoading?: boolean
}

export function OrdersList({ orders, isLoading = false }: OrdersListProps) {
  const [page, setPage] = useState(0)
  const pageSize = 10
  useEffect(() => setPage(0), [orders.length])
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize))
  const displayOrders = orders.slice(page * pageSize, (page + 1) * pageSize)

  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
        </div>
        <div className="mt-6 flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    // Convert cents to dollars
    const dollars = value / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollars)
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-500/20 p-2">
            <ShoppingCart className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
            <p className="text-xs text-white/50">
              {orders.length} total orders
            </p>
            <p className="text-xs text-white/50">
              Amounts stored in cents by Omnisend — converted for display
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <ShoppingCart className="h-8 w-8 text-white/20" />
          <p className="mt-2 text-white/60">No orders yet</p>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {displayOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {order.name || `Order ${order.external_id}`}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-white/50">
                    {order.email && (
                      <span className="truncate">{order.email}</span>
                    )}
                    {order.record_date && (
                      <>
                        <span>•</span>
                        <span>
                          {new Date(order.record_date).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      order.status === 'fulfilled'
                        ? 'bg-green-500/20 text-green-400'
                        : order.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {order.status || 'Unknown'}
                  </span>
                  <span className="font-semibold text-white">
                    {formatCurrency(order.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {orders.length > pageSize && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-white/60">
                Page {page + 1} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>

                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page === totalPages - 1}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================================
// Automations List Component
// ============================================================================

interface AutomationsListProps {
  automations: OmnisendAutomationData[]
  lastUpdated: string | null
  isLoading?: boolean
}

export function AutomationsList({
  automations,
  lastUpdated,
  isLoading = false,
}: AutomationsListProps) {
  const [page, setPage] = useState(0)
  const pageSize = 10
  useEffect(() => setPage(0), [automations.length])
  const totalPages = Math.max(1, Math.ceil(automations.length / pageSize))
  const displayAutomations = automations.slice(
    page * pageSize,
    (page + 1) * pageSize,
  )

  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Automations</h3>
        </div>
        <div className="mt-6 flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      </div>
    )
  }

  const activeCount = automations.filter((a) => a.status === 'started').length
  const pausedCount = automations.filter((a) => a.status === 'paused').length

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-yellow-500/20 p-2">
            <Zap className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Automations</h3>
            <p className="text-xs text-white/50">
              {activeCount} active, {pausedCount} paused
            </p>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date(lastUpdated).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Automations List */}
      {automations.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <Zap className="h-8 w-8 text-white/20" />
          <p className="mt-2 text-white/60">No automations configured</p>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {displayAutomations.map((automation) => (
              <div
                key={automation.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      automation.status === 'started'
                        ? 'bg-green-400'
                        : automation.status === 'paused'
                          ? 'bg-yellow-400'
                          : 'bg-white/40'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-white">
                      {automation.name || 'Unnamed Automation'}
                    </p>
                    <p className="text-xs text-white/50">
                      ID: {automation.external_id}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    automation.status === 'started'
                      ? 'bg-green-500/20 text-green-400'
                      : automation.status === 'paused'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-white/10 text-white/60'
                  }`}
                >
                  {automation.status || 'Unknown'}
                </span>
              </div>
            ))}
          </div>

          {automations.length > pageSize && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-white/60">
                Page {page + 1} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>

                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page === totalPages - 1}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================================
// Contacts Summary Component
// ============================================================================

interface ContactsSummaryProps {
  contacts: OmnisendContactData[]
  lastUpdated: string | null
  isLoading?: boolean
}

export function ContactsSummary({
  contacts,
  lastUpdated,
  isLoading = false,
}: ContactsSummaryProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Contacts</h3>
        </div>
        <div className="mt-6 flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      </div>
    )
  }

  // Group contacts by status
  const statusGroups = contacts.reduce(
    (acc, contact) => {
      const status = contact.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/20 p-2">
            <Users className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Contacts</h3>
            <p className="text-xs text-white/50">
              {contacts.length} total contacts
            </p>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date(lastUpdated).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Status Breakdown */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(statusGroups).map(([status, count]) => (
          <div
            key={status}
            className="rounded-lg border border-white/5 bg-white/5 p-3 text-center"
          >
            <p className="text-xs capitalize text-white/50">{status}</p>
            <p className="mt-1 text-lg font-bold text-white">{count}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Products Summary Component
// ============================================================================

interface ProductsSummaryProps {
  products: OmnisendProductData[]
  lastUpdated: string | null
  isLoading?: boolean
}

export function ProductsSummary({
  products,
  lastUpdated,
  isLoading = false,
}: ProductsSummaryProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-pink-400" />
          <h3 className="text-lg font-semibold text-white">Products</h3>
        </div>
        <div className="mt-6 flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      </div>
    )
  }

  // Group products by status
  const statusGroups = products.reduce(
    (acc, product) => {
      const status = product.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Group products by category
  const categoryGroups = products.reduce(
    (acc, product) => {
      const category = product.category || 'uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topCategories = Object.entries(categoryGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-pink-500/20 p-2">
            <Package className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Products</h3>
            <p className="text-xs text-white/50">
              {products.length} products in catalog
            </p>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date(lastUpdated).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Status & Categories */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Status Breakdown */}
        <div>
          <p className="mb-2 text-xs font-medium text-white/50">By Status</p>
          <div className="space-y-1">
            {Object.entries(statusGroups).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between rounded border border-white/5 bg-white/5 px-3 py-2"
              >
                <span className="text-sm capitalize text-white/70">
                  {status}
                </span>
                <span className="font-medium text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div>
          <p className="mb-2 text-xs font-medium text-white/50">
            Top Categories
          </p>
          <div className="space-y-1">
            {topCategories.map(([category, count]) => (
              <div
                key={category}
                className="flex items-center justify-between rounded border border-white/5 bg-white/5 px-3 py-2"
              >
                <span className="truncate text-sm text-white/70">
                  {category}
                </span>
                <span className="ml-2 font-medium text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Campaigns List Component
// ============================================================================

interface CampaignsListProps {
  campaigns: OmnisendCampaignData[]
  isLoading?: boolean
}

const CAMPAIGNS_PER_PAGE = 10

export function CampaignsList({
  campaigns,
  isLoading = false,
}: CampaignsListProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(campaigns.length / CAMPAIGNS_PER_PAGE)
  const startIndex = (currentPage - 1) * CAMPAIGNS_PER_PAGE
  const endIndex = startIndex + CAMPAIGNS_PER_PAGE
  const displayCampaigns = campaigns.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Campaigns</h3>
        </div>
        <div className="mt-6 flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      </div>
    )
  }

  const getMetricValue = (
    campaign: OmnisendCampaignData,
    metricName: string,
  ): number => {
    const metric = campaign.metrics.find((m) => m.metric_name === metricName)
    return metric ? Number(metric.metric_value) : 0
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-indigo-500/20 p-2">
          <Mail className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Campaigns</h3>
          <p className="text-xs text-white/50">{campaigns.length} campaigns</p>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <Mail className="h-8 w-8 text-white/20" />
          <p className="mt-2 text-white/60">No campaigns yet</p>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {displayCampaigns.map((campaign) => {
              const sent = getMetricValue(campaign, 'sent')
              const opened = getMetricValue(campaign, 'opened')
              const clicked = getMetricValue(campaign, 'clicked')
              const openRate = sent > 0 ? (opened / sent) * 100 : 0

              return (
                <div
                  key={campaign.id}
                  className="rounded-lg border border-white/5 bg-white/5 p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {campaign.name || 'Unnamed Campaign'}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
                        <span>{sent.toLocaleString()} sent</span>
                        <span>•</span>
                        <span>{openRate.toFixed(1)}% open rate</span>
                      </div>
                    </div>
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                        campaign.status === 'sent'
                          ? 'bg-green-500/20 text-green-400'
                          : campaign.status === 'draft'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {campaign.status || 'Unknown'}
                    </span>
                  </div>

                  {/* Mini Metrics */}
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-white/40">
                      <Mail className="h-3 w-3" />
                      <span>{opened.toLocaleString()} opened</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/40">
                      <MousePointerClick className="h-3 w-3" />
                      <span>{clicked.toLocaleString()} clicked</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <p className="text-sm text-white/50">
                Showing {startIndex + 1}-{Math.min(endIndex, campaigns.length)}{' '}
                of {campaigns.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/5"
                >
                  <ChevronUp className="h-4 w-4 -rotate-90" />
                  Prev
                </button>
                <span className="px-2 text-sm text-white/70">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/5"
                >
                  Next
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
