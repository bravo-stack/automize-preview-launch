'use client'

import type {
  FacebookCategoryStats,
  FacebookMetricsAggregates,
  PaginatedResponse,
  RefreshSnapshotMetric,
} from '@/types/data-hub'
import {
  Activity,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import PaginatedTable from './paginated-table'
import SectionHeader from './section-header'
import StatCard from './stat-card'
import StatusBadge from './status-badge'

const DEFAULT_PAGE_SIZE = 15

export default function FacebookView() {
  const [stats, setStats] = useState<FacebookCategoryStats | null>(null)
  const [aggregates, setAggregates] =
    useState<FacebookMetricsAggregates | null>(null)
  const [metricsData, setMetricsData] =
    useState<PaginatedResponse<RefreshSnapshotMetric> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPod, setSelectedPod] = useState<string>('')

  const fetchData = useCallback(async (page: number, pod?: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(DEFAULT_PAGE_SIZE),
      })
      if (pod) params.set('pod', pod)

      const [statsRes, aggregatesRes, metricsRes] = await Promise.all([
        fetch('/api/data-hub/facebook/stats'),
        fetch('/api/data-hub/facebook/aggregates'),
        fetch(`/api/data-hub/facebook/metrics?${params}`),
      ])

      const [statsJson, aggregatesJson, metricsJson] = await Promise.all([
        statsRes.json(),
        aggregatesRes.json(),
        metricsRes.json(),
      ])

      if (statsJson.success) setStats(statsJson.data)
      if (aggregatesJson.success) setAggregates(aggregatesJson.data)
      if (metricsJson.success) {
        setMetricsData({
          data: metricsJson.data,
          pagination: metricsJson.pagination,
        })
      }
    } catch (err) {
      console.error('Error fetching Facebook data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(currentPage, selectedPod)
  }, [fetchData, currentPage, selectedPod])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPod(e.target.value)
    setCurrentPage(1)
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatNumber = (value: number | null, decimals = 2) => {
    if (value === null || value === undefined) return '-'
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const columns: {
    key: string
    header: string
    render?: (v: unknown) => ReactNode
  }[] = [
    { key: 'account_name', header: 'Account' },
    {
      key: 'pod',
      header: 'Pod',
      render: (v: unknown): ReactNode => String(v || '-'),
    },
    {
      key: 'ad_spend_timeframe',
      header: 'Ad Spend',
      render: (v: unknown): ReactNode => formatCurrency(v as number),
    },
    {
      key: 'roas_timeframe',
      header: 'ROAS',
      render: (v: unknown): ReactNode => formatNumber(v as number),
    },
    {
      key: 'fb_revenue_timeframe',
      header: 'FB Revenue',
      render: (v: unknown): ReactNode => formatCurrency(v as number),
    },
    {
      key: 'shopify_revenue_timeframe',
      header: 'Shopify Revenue',
      render: (v: unknown): ReactNode => formatCurrency(v as number),
    },
    {
      key: 'orders_timeframe',
      header: 'Orders',
      render: (v: unknown): ReactNode => (v as number)?.toLocaleString() || '-',
    },
    {
      key: 'cpa_purchase',
      header: 'CPA',
      render: (v: unknown): ReactNode => formatCurrency(v as number),
    },
    {
      key: 'is_error',
      header: 'Status',
      render: (v: unknown): ReactNode => (
        <StatusBadge status={v ? 'Error' : 'Success'} />
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white/90">Facebook Ads</h2>
        <p className="mt-1 text-white/60">
          Performance metrics from Autometric sheets - Facebook Ads data synced
          from Google Sheets
        </p>
      </div>

      {/* Aggregates */}
      {aggregates && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Total Accounts"
            value={aggregates.totalAccounts}
            icon={Users}
          />
          <StatCard
            title="Total Ad Spend"
            value={formatCurrency(aggregates.totalAdSpend)}
            icon={DollarSign}
          />
          <StatCard
            title="Avg ROAS"
            value={formatNumber(aggregates.avgRoas)}
            icon={TrendingUp}
          />
          <StatCard
            title="Total Orders"
            value={aggregates.totalOrders.toLocaleString()}
            icon={ShoppingCart}
          />
          <StatCard
            title="FB Revenue"
            value={formatCurrency(aggregates.totalFbRevenue)}
            icon={Activity}
          />
          <StatCard
            title="Errors"
            value={aggregates.accountsWithErrors}
            icon={AlertTriangle}
            variant={aggregates.accountsWithErrors > 0 ? 'danger' : 'default'}
          />
        </div>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <SectionHeader
            title="Data Summary"
            description={`Latest snapshot: ${stats.latestSnapshotDate ? new Date(stats.latestSnapshotDate).toLocaleDateString() : 'N/A'}`}
            icon={Activity}
          />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-white/60">Total Snapshots</p>
              <p className="text-lg font-medium text-white/90">
                {stats.totalSnapshots}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60">Completed</p>
              <p className="text-lg font-medium text-green-400">
                {stats.completedSnapshots}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60">Total Metrics</p>
              <p className="text-lg font-medium text-white/90">
                {stats.totalMetrics}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60">Unique Pods</p>
              <p className="text-lg font-medium text-white/90">
                {stats.uniquePods.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm text-white/60">Filter by Pod</label>
          <select
            value={selectedPod}
            onChange={handlePodChange}
            className="mt-1 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-white"
          >
            <option value="">All Pods</option>
            {stats?.uniquePods.map((pod) => (
              <option key={pod} value={pod}>
                {pod}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <PaginatedTable
        data={(metricsData?.data as unknown as Record<string, unknown>[]) || []}
        columns={columns}
        pagination={
          metricsData?.pagination || {
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        }
        onPageChange={handlePageChange}
        isLoading={isLoading}
        emptyMessage="No Facebook metrics found"
      />
    </div>
  )
}
