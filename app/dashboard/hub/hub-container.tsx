'use client'

import { Alert } from '@/components/ui/alert'
import type { DataHubOverview, HubCategory } from '@/types/data-hub'
import {
  Activity,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Database,
  DollarSign,
  Facebook,
  FileText,
  Globe,
  Info,
  Server,
} from 'lucide-react'
import { useCallback, useState } from 'react'

import {
  AggregateSummary,
  CVRMetricsTable,
  PeriodSelector,
} from '@/components/cvr-hub'
import {
  ApiDataView,
  FacebookView,
  FinanceView,
  FormsView,
  SectionHeader,
  StatCard,
  TabNavigation,
} from '@/components/data-hub'
import type {
  CVRHubResponse,
  ComparisonMode,
  PeriodPreset,
} from '@/types/cvr-hub'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { HubInfoTrig } from './hub-info-trig'

export default function HubPageContainer() {
  const [activeTab, setActiveTab] = useState<HubCategory>('overview')
  const [cvrPeriod, setCvrPeriod] = useState<{
    preset: PeriodPreset
    comparisonMode: ComparisonMode
  }>({ preset: 'last_7_days', comparisonMode: 'previous_period' })

  // Overview Query
  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['hub-overview'],
    queryFn: async () => {
      const res = await fetch('/api/data-hub/overview')
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to fetch overview')
      return json.data as DataHubOverview
    },
    enabled: activeTab === 'overview',
  })

  // CVR Query
  const { data: cvrResponse, isLoading: isCvrLoading } = useQuery({
    queryKey: ['cvr-metrics', cvrPeriod],
    queryFn: async () => {
      const res = await fetch('/api/cvr-hub/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: cvrPeriod,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to fetch CVR metrics')
      return json as CVRHubResponse
    },
    enabled: activeTab === 'cvr',
    placeholderData: keepPreviousData,
  })

  const cvrMetrics = cvrResponse?.data?.metrics || []
  const cvrAggregates = cvrResponse?.data?.aggregates || null
  const cvrDateRange = cvrResponse?.data?.dateRanges?.current || null

  const handleTabChange = (tab: HubCategory) => {
    setActiveTab(tab)
  }

  const handlePeriodChange = useCallback((
    preset: PeriodPreset,
    comparisonMode: ComparisonMode,
  ) => {
    setCvrPeriod({ preset, comparisonMode })
  }, [])

  const overview = overviewData

  return (
    <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
      <div className="mx-auto max-w-[1800px] space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="bg-gradient-to-b from-white via-zinc-300/90 to-white/70 bg-clip-text text-4xl font-bold tracking-wide text-transparent">
              Hub
            </h1>
            <p className="mt-2 text-lg text-white/60">
              Centralized view of all data, metrics, and insights
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-3">
            <HubInfoTrig />
          </div>
        </header>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {isOverviewLoading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-white/60" />
                  <p className="text-white/60">Loading overview...</p>
                </div>
              </div>
            ) : overview ? (
              <>
                {/* Data Categories Overview */}
                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
                  {/* Facebook Stats Card */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-500/10 p-2">
                        <Facebook className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white/90">Facebook</h3>
                        <p className="text-xs text-white/50">
                          Autometric Sheets
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-white/90">
                          {overview.facebookSnapshots}
                        </p>
                        <p className="text-xs text-white/50">Snapshots</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white/90">
                          {overview.facebookMetrics.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/50">Metrics</p>
                      </div>
                    </div>
                  </div>

                  {/* Finance Stats Card */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-500/10 p-2">
                        <DollarSign className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white/90">
                          Finance Sheet
                        </h3>
                        <p className="text-xs text-white/50">
                          FinancialX Sheets
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-white/90">
                          {overview.financeSnapshots}
                        </p>
                        <p className="text-xs text-white/50">Snapshots</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white/90">
                          {overview.financeMetrics.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/50">Metrics</p>
                      </div>
                    </div>
                  </div>

                  {/* API Data Stats Card */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-500/10 p-2">
                        <Server className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white/90">API Data</h3>
                        <p className="text-xs text-white/50">
                          Omnisend, Shopify, etc.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-white/90">
                          {overview.totalSources}
                        </p>
                        <p className="text-xs text-white/50">
                          Sources ({overview.activeSources} active)
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white/90">
                          {overview.totalApiRecords.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/50">Records</p>
                      </div>
                    </div>
                  </div>

                  {/* Forms Stats Card */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-orange-500/10 p-2">
                        <FileText className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white/90">Forms</h3>
                        <p className="text-xs text-white/50">
                          Day Drop & Website Revamp
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-white/90">
                          {overview.totalFormSubmissions}
                        </p>
                        <p className="text-xs text-white/50">Submissions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-400">
                          {overview.pendingSubmissions}
                        </p>
                        <p className="text-xs text-white/50">Pending</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  <StatCard
                    title="Total Sheet Snapshots"
                    value={overview.totalSheetSnapshots}
                    icon={Database}
                    description={`${overview.completedSheetSnapshots} completed`}
                  />
                  <StatCard
                    title="API Snapshots"
                    value={overview.totalApiSnapshots}
                    icon={Activity}
                    description={`${overview.failedApiSnapshots} failed`}
                    variant={
                      overview.failedApiSnapshots > 0 ? 'danger' : 'default'
                    }
                  />
                  <StatCard
                    title="Day Drop Requests"
                    value={overview.dayDropRequests}
                    icon={Calendar}
                  />
                  <StatCard
                    title="Website Revamp"
                    value={overview.websiteRevampRequests}
                    icon={Globe}
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
                </div>

                {/* System Health & Alerts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                    <SectionHeader
                      title="System Health"
                      description="Current status of data pipelines"
                      icon={Activity}
                    />
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70">API Sources</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="font-medium text-white/90">
                            {overview.activeSources} / {overview.totalSources}{' '}
                            active
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70">
                          API Snapshot Success
                        </span>
                        <div className="flex items-center gap-2">
                          {overview.totalApiSnapshots > 0 ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <span className="font-medium text-white/90">
                                {(
                                  (overview.completedApiSnapshots /
                                    overview.totalApiSnapshots) *
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
                        <span className="text-white/70">
                          Sheet Snapshot Success
                        </span>
                        <div className="flex items-center gap-2">
                          {overview.totalSheetSnapshots > 0 ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <span className="font-medium text-white/90">
                                {(
                                  (overview.completedSheetSnapshots /
                                    overview.totalSheetSnapshots) *
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
              </>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <p className="text-white/60">Failed to load overview data</p>
              </div>
            )}
          </div>
        )}

        {/* Facebook Tab */}
        {activeTab === 'facebook' && <FacebookView />}

        {/* Finance Tab */}
        {activeTab === 'finance' && <FinanceView />}

        {/* API Data Tab */}
        {activeTab === 'api-data' && <ApiDataView />}

        {/* Forms Tab */}
        {activeTab === 'forms' && <FormsView />}

        {/* CVR Tab */}
        {activeTab === 'cvr' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <PeriodSelector
                onPeriodChange={handlePeriodChange}
                isLoading={isCvrLoading && !cvrMetrics.length}
              />

              {cvrMetrics.length > 0 && cvrAggregates && cvrDateRange && (
                <div />
              )}
            </div>

            {isCvrLoading && !cvrMetrics.length ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-white/60" />
                  <p className="text-white/60">Loading CVR metrics...</p>
                </div>
              </div>
            ) : (
              <>
                {cvrAggregates && (
                  <AggregateSummary
                    aggregates={cvrAggregates}
                    showComparison={cvrPeriod.comparisonMode !== 'none'}
                  />
                )}
                <CVRMetricsTable
                  metrics={cvrMetrics}
                  showComparison={cvrPeriod.comparisonMode !== 'none'}
                />
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}