'use client'

import AggregateSummary from '@/components/cvr-hub/aggregate-summary'
import CVRMetricsTable from '@/components/cvr-hub/metrics-table'
import PeriodSelector from '@/components/cvr-hub/period-selector'
import SaveCVRButton from '@/components/cvr-hub/save-cvr-button'
import PaginatedTable from '@/components/data-hub/paginated-table'
import SectionHeader from '@/components/data-hub/section-header'
import StatCard from '@/components/data-hub/stat-card'
import StatusBadge from '@/components/data-hub/status-badge'
import TabNavigation from '@/components/data-hub/tab-navigation'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type {
  ComparisonMode,
  CVRAggregates,
  CVRHubResponse,
  CVRMetricsComparison,
  DateRange,
  PeriodPreset,
} from '@/types/cvr-hub'
import type {
  DataHubOverview,
  DataHubTab,
  PaginatedResponse,
} from '@/types/data-hub'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle,
  Clock,
  Database,
  FileText,
  Info,
  Save,
  Server,
  Users,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

type TableColumn = {
  key: string
  header: string
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode
  className?: string
}

const DEFAULT_PAGE_SIZE = 10

export default function HubPage() {
  const [activeTab, setActiveTab] = useState<DataHubTab>('overview')
  const [overview, setOverview] = useState<DataHubOverview | null>(null)
  const [tableData, setTableData] = useState<PaginatedResponse<
    Record<string, unknown>
  > | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // CVR Metrics State
  const [cvrMetrics, setCvrMetrics] = useState<CVRMetricsComparison[]>([])
  const [cvrAggregates, setCvrAggregates] = useState<CVRAggregates | null>(null)
  const [cvrDateRange, setCvrDateRange] = useState<DateRange | null>(null)
  const [cvrLoading, setCvrLoading] = useState(false)
  const [cvrError, setCvrError] = useState<string | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<{
    preset: PeriodPreset
    comparisonMode: ComparisonMode
  }>({
    preset: 'last_7_days',
    comparisonMode: 'previous_period',
  })

  // Fetch overview stats
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/data-hub/overview')
      const json = await res.json()
      if (json.success) {
        setOverview(json.data)
      }
    } catch (err) {
      console.error('Error fetching overview:', err)
    }
  }, [])

  // Fetch table data for active tab
  const fetchTableData = useCallback(async (tab: DataHubTab, page: number) => {
    if (tab === 'overview' || tab === 'cvr') return

    setIsLoading(true)
    setError(null)

    const tableMap: Record<string, string> = {
      sources: 'sources',
      snapshots: 'snapshots',
      records: 'records',
      'sheet-metrics': 'sheet-metrics',
      alerts: 'alerts',
      forms: 'forms',
    }

    const tableName = tableMap[tab]
    if (!tableName) return

    try {
      const res = await fetch(
        `/api/data-hub/${tableName}?page=${page}&pageSize=${DEFAULT_PAGE_SIZE}`,
      )
      const json = await res.json()

      if (json.success) {
        setTableData({
          data: json.data,
          pagination: json.pagination,
        })
      } else {
        setError(json.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch CVR Metrics
  const fetchCvrMetrics = useCallback(
    async (preset: PeriodPreset, comparisonMode: ComparisonMode) => {
      setCvrLoading(true)
      setCvrError(null)

      try {
        const response = await fetch('/api/cvr-hub/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            period: {
              preset,
              comparisonMode,
            },
          }),
        })

        const result: CVRHubResponse = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch metrics')
        }

        setCvrMetrics(result.data.metrics)
        setCvrAggregates(result.data.aggregates)
        setCvrDateRange(result.data.dateRanges.current)
        setCurrentPeriod({ preset, comparisonMode })
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred'
        setCvrError(errorMessage)
        console.error('Error fetching CVR metrics:', err)
      } finally {
        setCvrLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  useEffect(() => {
    setCurrentPage(1)
    if (activeTab === 'overview') {
      setIsLoading(false)
    } else if (activeTab === 'cvr') {
      setIsLoading(false)
    } else {
      fetchTableData(activeTab, 1)
    }
  }, [activeTab, fetchTableData])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchTableData(activeTab, page)
  }

  const handleTabChange = (tab: DataHubTab) => {
    setActiveTab(tab)
  }

  const handleCvrPeriodChange = useCallback(
    (preset: PeriodPreset, comparisonMode: ComparisonMode) => {
      fetchCvrMetrics(preset, comparisonMode)
    },
    [fetchCvrMetrics],
  )

  const showComparison = currentPeriod.comparisonMode !== 'none'

  // Column definitions for each table
  const getColumnsForTab = (tab: DataHubTab): TableColumn[] => {
    switch (tab) {
      case 'sources':
        return [
          { key: 'provider', header: 'Provider' },
          { key: 'endpoint', header: 'Endpoint' },
          { key: 'display_name', header: 'Display Name' },
          {
            key: 'is_active',
            header: 'Status',
            render: (value: unknown): ReactNode => (
              <StatusBadge status={value ? 'Active' : 'Inactive'} />
            ),
          },
          {
            key: 'refresh_interval_minutes',
            header: 'Refresh Interval',
            render: (value: unknown): ReactNode => `${value} min`,
          },
          {
            key: 'created_at',
            header: 'Created',
            render: (value: unknown): ReactNode =>
              new Date(value as string).toLocaleDateString(),
          },
        ]

      case 'snapshots':
        return [
          {
            key: 'source',
            header: 'Source',
            render: (value: unknown): ReactNode =>
              String((value as Record<string, unknown>)?.display_name || '-'),
          },
          { key: 'snapshot_type', header: 'Type' },
          {
            key: 'status',
            header: 'Status',
            render: (value: unknown): ReactNode => (
              <StatusBadge status={value as string} />
            ),
          },
          { key: 'total_records', header: 'Records' },
          {
            key: 'created_at',
            header: 'Created',
            render: (value: unknown): ReactNode =>
              new Date(value as string).toLocaleString(),
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
            render: (value: unknown): ReactNode =>
              value ? <StatusBadge status={value as string} /> : '-',
          },
          {
            key: 'amount',
            header: 'Amount',
            render: (value: unknown): ReactNode =>
              value ? `$${Number(value).toFixed(2)}` : '-',
          },
          {
            key: 'created_at',
            header: 'Created',
            render: (value: unknown): ReactNode =>
              new Date(value as string).toLocaleString(),
          },
        ]

      case 'sheet-metrics':
        return [
          { key: 'account_name', header: 'Account' },
          { key: 'pod', header: 'Pod' },
          {
            key: 'is_monitored',
            header: 'Monitored',
            render: (value: unknown): ReactNode => (value ? 'Yes' : 'No'),
          },
          {
            key: 'ad_spend_timeframe',
            header: 'Ad Spend',
            render: (value: unknown): ReactNode =>
              value ? `$${Number(value).toFixed(2)}` : '-',
          },
          {
            key: 'roas_timeframe',
            header: 'ROAS',
            render: (value: unknown): ReactNode =>
              value ? Number(value).toFixed(2) : '-',
          },
          {
            key: 'orders_timeframe',
            header: 'Orders',
          },
          {
            key: 'is_error',
            header: 'Status',
            render: (value: unknown): ReactNode => (
              <StatusBadge status={value ? 'Error' : 'Success'} />
            ),
          },
        ]

      case 'alerts':
        return [
          { key: 'message', header: 'Message' },
          {
            key: 'severity',
            header: 'Severity',
            render: (value: unknown): ReactNode => (
              <StatusBadge status={value as string} />
            ),
          },
          { key: 'current_value', header: 'Current Value' },
          { key: 'previous_value', header: 'Previous Value' },
          {
            key: 'is_acknowledged',
            header: 'Acknowledged',
            render: (value: unknown): ReactNode => (value ? 'Yes' : 'No'),
          },
          {
            key: 'created_at',
            header: 'Created',
            render: (value: unknown): ReactNode =>
              new Date(value as string).toLocaleString(),
          },
        ]

      case 'forms':
        return [
          { key: 'form_type', header: 'Form Type' },
          { key: 'brand_name', header: 'Brand' },
          { key: 'submitter_identifier', header: 'Submitter' },
          {
            key: 'status',
            header: 'Status',
            render: (value: unknown): ReactNode => (
              <StatusBadge status={value as string} />
            ),
          },
          {
            key: 'created_at',
            header: 'Submitted',
            render: (value: unknown): ReactNode =>
              new Date(value as string).toLocaleString(),
          },
        ]

      default:
        return []
    }
  }

  return (
    <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
      <div className="mx-auto max-w-[1800px] space-y-8">
        {/* Header */}
        <header>
          <h1 className="bg-gradient-to-b from-white via-zinc-300/90 to-white/70 bg-clip-text text-4xl font-bold tracking-wide text-transparent">
            Hub
          </h1>
          <p className="mt-2 text-lg text-white/60">
            Centralized view of all data, metrics, and insights
          </p>
        </header>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Overview Tab */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-8">
            {/* Overview Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <StatCard
                title="Total Sources"
                value={overview.totalSources}
                icon={Server}
                description={`${overview.activeSources} active`}
              />
              <StatCard
                title="Total Snapshots"
                value={overview.totalSnapshots}
                icon={Database}
                description={`${overview.completedSnapshots} completed`}
              />
              <StatCard
                title="Failed Snapshots"
                value={overview.failedSnapshots}
                icon={XCircle}
                variant={overview.failedSnapshots > 0 ? 'danger' : 'default'}
              />
              <StatCard
                title="Total Records"
                value={overview.totalRecords}
                icon={FileText}
              />
              <StatCard
                title="Total Alerts"
                value={overview.totalAlerts}
                icon={Bell}
                description={`${overview.unacknowledgedAlerts} unacknowledged`}
              />
              <StatCard
                title="Critical Alerts"
                value={overview.criticalAlerts}
                icon={AlertTriangle}
                variant={overview.criticalAlerts > 0 ? 'danger' : 'default'}
              />
              <StatCard
                title="Form Submissions"
                value={overview.totalFormSubmissions}
                icon={Users}
                description={`${overview.pendingSubmissions} pending`}
              />
              <StatCard
                title="Sheet Snapshots"
                value={overview.totalSheetSnapshots}
                icon={BarChart3}
                description={`${overview.totalSheetMetrics} metrics`}
              />
            </div>

            {/* Save CVR Section - Disabled with Info */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <SectionHeader
                title="Export Data"
                description="Save current metrics to database and/or Google Sheets"
                icon={Save}
              />
              <div className="mt-4 space-y-4">
                <Alert className="border-blue-500/30 bg-blue-500/10">
                  <Info className="h-4 w-4 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-400">
                      <strong>Coming Soon:</strong> The Save CVR Data feature
                      will allow you to export current metrics to:
                    </p>
                    <ul className="mt-2 list-inside list-disc text-sm text-blue-400/80">
                      <li>PostgreSQL database for historical tracking</li>
                      <li>Google Sheets for shareable reports (optional)</li>
                    </ul>
                  </div>
                </Alert>
                <Button disabled className="cursor-not-allowed opacity-50">
                  <Save className="mr-2 h-4 w-4" />
                  Save CVR Data
                </Button>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <SectionHeader
                  title="System Health"
                  description="Current status of data pipelines"
                  icon={Activity}
                />
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Active Sources</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-white/90">
                        {overview.activeSources} / {overview.totalSources}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Success Rate</span>
                    <div className="flex items-center gap-2">
                      {overview.totalSnapshots > 0 ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="font-medium text-white/90">
                            {(
                              (overview.completedSnapshots /
                                overview.totalSnapshots) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </>
                      ) : (
                        <span className="text-white/60">No data</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Pending Forms</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <span className="font-medium text-white/90">
                        {overview.pendingSubmissions}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <SectionHeader
                  title="Alerts Summary"
                  description="Recent alerts requiring attention"
                  icon={Bell}
                />
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Unacknowledged</span>
                    <span className="font-medium text-yellow-400">
                      {overview.unacknowledgedAlerts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Critical</span>
                    <span className="font-medium text-red-400">
                      {overview.criticalAlerts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Total</span>
                    <span className="font-medium text-white/90">
                      {overview.totalAlerts}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CVR Metrics Tab */}
        {activeTab === 'cvr' && (
          <div className="space-y-8">
            {/* Period Selector */}
            <PeriodSelector
              onPeriodChange={handleCvrPeriodChange}
              isLoading={cvrLoading}
            />

            {/* Error State */}
            {cvrError && (
              <Alert variant="destructive" className="border-red-500/30">
                {cvrError}
              </Alert>
            )}

            {/* Loading State */}
            {cvrLoading && (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-white/60" />
                  <p className="text-white/60">Loading metrics...</p>
                </div>
              </div>
            )}

            {/* Data Display */}
            {!cvrLoading &&
              cvrMetrics.length > 0 &&
              cvrAggregates &&
              cvrDateRange && (
                <>
                  {/* Date Range Display */}
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
                    <div>
                      <p className="text-sm text-white/60">Viewing Data For</p>
                      <p className="text-lg font-medium text-white/90">
                        {new Date(cvrDateRange.startDate).toLocaleDateString()}{' '}
                        - {new Date(cvrDateRange.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <SaveCVRButton
                      metrics={cvrMetrics}
                      aggregates={cvrAggregates}
                      dateRange={cvrDateRange}
                      disabled={cvrLoading}
                    />
                  </div>

                  {/* Aggregate Summary */}
                  <AggregateSummary aggregates={cvrAggregates} />

                  {/* Metrics Table */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white/90">
                      Account Metrics
                    </h2>
                    <CVRMetricsTable
                      metrics={cvrMetrics}
                      showComparison={showComparison}
                    />
                  </div>
                </>
              )}

            {/* Empty State */}
            {!cvrLoading && !cvrError && cvrMetrics.length === 0 && (
              <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-white/10 bg-white/5 p-8">
                <div className="text-center">
                  <p className="text-lg text-white/60">
                    Select a time period to view CVR metrics
                  </p>
                  <p className="mt-2 text-sm text-white/40">
                    Data will be fetched from your refresh snapshots
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table Tabs */}
        {activeTab !== 'overview' && activeTab !== 'cvr' && (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-500/30">
                {error}
              </Alert>
            )}

            <PaginatedTable
              data={(tableData?.data as Record<string, unknown>[]) || []}
              columns={getColumnsForTab(activeTab)}
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
              emptyMessage={`No ${activeTab} data found`}
            />
          </div>
        )}
      </div>
    </main>
  )
}
