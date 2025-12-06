'use client'

import type {
  FinanceCategoryStats,
  FinanceMetricsAggregates,
  PaginatedResponse,
  RefreshSnapshotMetric,
} from '@/types/data-hub'
import {
  Activity,
  DollarSign,
  RefreshCw,
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

export default function FinanceView() {
  const [stats, setStats] = useState<FinanceCategoryStats | null>(null)
  const [aggregates, setAggregates] = useState<FinanceMetricsAggregates | null>(
    null,
  )
  const [metricsData, setMetricsData] =
    useState<PaginatedResponse<RefreshSnapshotMetric> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [rebillFilter, setRebillFilter] = useState<string>('')

  const fetchData = useCallback(async (page: number, rebillStatus?: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(DEFAULT_PAGE_SIZE),
      })
      if (rebillStatus) params.set('rebillStatus', rebillStatus)

      const [statsRes, aggregatesRes, metricsRes] = await Promise.all([
        fetch('/api/data-hub/finance/stats'),
        fetch('/api/data-hub/finance/aggregates'),
        fetch(`/api/data-hub/finance/metrics?${params}`),
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
      console.error('Error fetching Finance data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(currentPage, rebillFilter)
  }, [fetchData, currentPage, rebillFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRebillFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setRebillFilter(e.target.value)
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
      key: 'rebill_status',
      header: 'Rebill Status',
      render: (v: unknown): ReactNode =>
        v ? <StatusBadge status={v as string} /> : '-',
    },
    {
      key: 'last_rebill_date',
      header: 'Last Rebill',
      render: (v: unknown): ReactNode =>
        v ? new Date(v as string).toLocaleDateString() : '-',
    },
    {
      key: 'ad_spend_rebill',
      header: 'Rebill Spend',
      render: (v: unknown): ReactNode => formatCurrency(v as number),
    },
    {
      key: 'roas_rebill',
      header: 'Rebill ROAS',
      render: (v: unknown): ReactNode => formatNumber(v as number),
    },
    {
      key: 'fb_revenue_rebill',
      header: 'Rebill FB Rev',
      render: (v: unknown): ReactNode => formatCurrency(v as number),
    },
    {
      key: 'shopify_revenue_rebill',
      header: 'Rebill Shop Rev',
      render: (v: unknown): ReactNode => formatCurrency(v as number),
    },
    {
      key: 'orders_rebill',
      header: 'Rebill Orders',
      render: (v: unknown): ReactNode => (v as number)?.toLocaleString() || '-',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white/90">Finance Sheet</h2>
        <p className="mt-1 text-white/60">
          Financial metrics from FinancialX sheets - Rebill and accounting data
          synced from Google Sheets
        </p>
      </div>

      {/* Aggregates */}
      {aggregates && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Total Accounts"
            value={aggregates.totalAccounts}
            icon={Users}
          />
          <StatCard
            title="Rebill Spend"
            value={formatCurrency(aggregates.totalRebillSpend)}
            icon={DollarSign}
          />
          <StatCard
            title="Avg Rebill ROAS"
            value={formatNumber(aggregates.avgRebillRoas)}
            icon={TrendingUp}
          />
          <StatCard
            title="Rebill Orders"
            value={aggregates.totalRebillOrders.toLocaleString()}
            icon={ShoppingCart}
          />
          <StatCard
            title="In Rebill"
            value={aggregates.accountsInRebill}
            icon={RefreshCw}
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
              <p className="text-sm text-white/60">Accounts in Rebill</p>
              <p className="text-lg font-medium text-blue-400">
                {stats.accountsInRebill}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm text-white/60">Rebill Status</label>
          <select
            value={rebillFilter}
            onChange={handleRebillFilterChange}
            className="mt-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 focus:border-white/30 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
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
        emptyMessage="No Finance metrics found"
      />
    </div>
  )
}
