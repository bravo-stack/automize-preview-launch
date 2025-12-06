'use client'

import type { ApiDataCategoryStats, PaginatedResponse } from '@/types/data-hub'
import {
  Activity,
  Bell,
  Clock,
  Database,
  FileText,
  Server,
  Table2,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import PaginatedTable from './paginated-table'
import SectionHeader from './section-header'
import StatCard from './stat-card'
import StatusBadge from './status-badge'

type ApiDataSubTab = 'sources' | 'snapshots' | 'records' | 'alerts'

const DEFAULT_PAGE_SIZE = 15

const subTabs: { id: ApiDataSubTab; label: string; icon: typeof Server }[] = [
  { id: 'sources', label: 'Sources', icon: Server },
  { id: 'snapshots', label: 'Snapshots', icon: Database },
  { id: 'records', label: 'Records', icon: Table2 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
]

export default function ApiDataView() {
  const [activeSubTab, setActiveSubTab] = useState<ApiDataSubTab>('sources')
  const [stats, setStats] = useState<ApiDataCategoryStats | null>(null)
  const [tableData, setTableData] = useState<PaginatedResponse<
    Record<string, unknown>
  > | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/data-hub/api-data/stats')
      const json = await res.json()
      if (json.success) setStats(json.data)
    } catch (err) {
      console.error('Error fetching API data stats:', err)
    }
  }, [])

  const fetchTableData = useCallback(
    async (tab: ApiDataSubTab, page: number) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(DEFAULT_PAGE_SIZE),
        })

        const res = await fetch(`/api/data-hub/${tab}?${params}`)
        const json = await res.json()

        if (json.success) {
          setTableData({
            data: json.data,
            pagination: json.pagination,
          })
        }
      } catch (err) {
        console.error(`Error fetching ${tab}:`, err)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    setCurrentPage(1)
    fetchTableData(activeSubTab, 1)
  }, [activeSubTab, fetchTableData])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchTableData(activeSubTab, page)
  }

  const getColumnsForTab = (tab: ApiDataSubTab) => {
    switch (tab) {
      case 'sources':
        return [
          { key: 'provider', header: 'Provider' },
          { key: 'endpoint', header: 'Endpoint' },
          { key: 'display_name', header: 'Name' },
          {
            key: 'is_active',
            header: 'Status',
            render: (v: unknown): ReactNode => (
              <StatusBadge status={v ? 'Active' : 'Inactive'} />
            ),
          },
          {
            key: 'refresh_interval_minutes',
            header: 'Refresh',
            render: (v: unknown): ReactNode => `${v} min`,
          },
          {
            key: 'created_at',
            header: 'Created',
            render: (v: unknown): ReactNode =>
              new Date(v as string).toLocaleDateString(),
          },
        ]

      case 'snapshots':
        return [
          {
            key: 'source',
            header: 'Source',
            render: (v: unknown): ReactNode =>
              String((v as Record<string, unknown>)?.display_name || '-'),
          },
          { key: 'snapshot_type', header: 'Type' },
          {
            key: 'status',
            header: 'Status',
            render: (v: unknown): ReactNode => (
              <StatusBadge status={v as string} />
            ),
          },
          { key: 'total_records', header: 'Records' },
          {
            key: 'created_at',
            header: 'Created',
            render: (v: unknown): ReactNode =>
              new Date(v as string).toLocaleString(),
          },
        ]

      case 'records':
        return [
          { key: 'external_id', header: 'External ID' },
          { key: 'name', header: 'Name' },
          { key: 'category', header: 'Category' },
          {
            key: 'status',
            header: 'Status',
            render: (v: unknown): ReactNode =>
              v ? <StatusBadge status={v as string} /> : '-',
          },
          {
            key: 'amount',
            header: 'Amount',
            render: (v: unknown): ReactNode =>
              v ? `$${Number(v).toFixed(2)}` : '-',
          },
          {
            key: 'created_at',
            header: 'Created',
            render: (v: unknown): ReactNode =>
              new Date(v as string).toLocaleString(),
          },
        ]

      case 'alerts':
        return [
          { key: 'message', header: 'Message' },
          {
            key: 'severity',
            header: 'Severity',
            render: (v: unknown): ReactNode => (
              <StatusBadge status={v as string} />
            ),
          },
          { key: 'current_value', header: 'Current' },
          { key: 'previous_value', header: 'Previous' },
          {
            key: 'is_acknowledged',
            header: 'Ack',
            render: (v: unknown): ReactNode => (v ? 'Yes' : 'No'),
          },
          {
            key: 'created_at',
            header: 'Created',
            render: (v: unknown): ReactNode =>
              new Date(v as string).toLocaleString(),
          },
        ]

      default:
        return []
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white/90">API Data</h2>
        <p className="mt-1 text-white/60">
          Data fetched from external APIs - Omnisend, Shopify, Themes, and other
          integrations
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Total Sources"
            value={stats.totalSources}
            icon={Server}
            description={`${stats.activeSources} active`}
          />
          <StatCard
            title="Total Snapshots"
            value={stats.totalSnapshots}
            icon={Database}
          />
          <StatCard
            title="Total Records"
            value={stats.totalRecords.toLocaleString()}
            icon={FileText}
          />
          <StatCard
            title="Latest Sync"
            value={
              stats.latestSnapshotDate
                ? new Date(stats.latestSnapshotDate).toLocaleDateString()
                : 'N/A'
            }
            icon={Clock}
          />
          <StatCard
            title="Providers"
            value={Object.keys(stats.sourcesByProvider).length}
            icon={Activity}
          />
        </div>
      )}

      {/* Provider Breakdown */}
      {stats && Object.keys(stats.sourcesByProvider).length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <SectionHeader
            title="Sources by Provider"
            description="Breakdown of API sources by provider"
            icon={Server}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(stats.sourcesByProvider).map(
              ([provider, count]) => (
                <div
                  key={provider}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2"
                >
                  <span className="text-sm font-medium capitalize text-white/90">
                    {provider}
                  </span>
                  <span className="ml-2 text-sm text-white/60">{count}</span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-white/5 p-1">
        {subTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeSubTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Data Table */}
      <PaginatedTable
        data={(tableData?.data as Record<string, unknown>[]) || []}
        columns={getColumnsForTab(activeSubTab)}
        pagination={
          tableData?.pagination || {
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
        emptyMessage={`No ${activeSubTab} found`}
      />
    </div>
  )
}
