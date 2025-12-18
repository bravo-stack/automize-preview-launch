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
  TrendingUp,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import {
  ApiDataView,
  FacebookView,
  FinanceView,
  FormsView,
  SectionHeader,
  StatCard,
  TabNavigation,
} from '@/components/data-hub'
import { HubInfoTrig } from './hub-info-trig'

export default function HubPageContainer() {
  const [activeTab, setActiveTab] = useState<HubCategory>('overview')
  const [overview, setOverview] = useState<DataHubOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchOverview = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/data-hub/overview')
      const json = await res.json()
      if (json.success) {
        setOverview(json.data)
      }
    } catch (err) {
      console.error('Error fetching overview:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview()
    }
  }, [activeTab, fetchOverview])

  const handleTabChange = (tab: HubCategory) => {
    setActiveTab(tab)
  }

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
            {isLoading ? (
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

                {/* Data Sources Info */}
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 text-blue-400" />
                    <div>
                      <h3 className="font-medium text-blue-400">
                        Data Organization Guide
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm text-blue-400/80">
                        <li>
                          <strong>Facebook:</strong> Autometric sheets data -
                          Facebook Ads performance metrics synced from Google
                          Sheets
                        </li>
                        <li>
                          <strong>Finance Sheet:</strong> FinancialX sheets data
                          - Rebill and accounting metrics synced from Google
                          Sheets
                        </li>
                        <li>
                          <strong>API Data:</strong> Data fetched from external
                          APIs including Omnisend, Shopify, Themes, and other
                          integrations
                        </li>
                        <li>
                          <strong>Forms:</strong> Client submissions for Day
                          Drop requests and Website Revamp requests
                        </li>
                      </ul>
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

        {/* CVR Tab - Coming Soon */}
        {activeTab === 'cvr' && (
          <div className="space-y-8">
            <Alert className="border-blue-500/30 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-400" />
              <div className="ml-3">
                <h3 className="font-medium text-blue-400">Coming Soon</h3>
                <p className="mt-1 text-sm text-blue-400/80">
                  CVR (Conversion Rate) metrics feature is under development.
                  Real CVR data will be stored in the database soon, enabling
                  comprehensive conversion rate analysis and historical
                  tracking.
                </p>
              </div>
            </Alert>

            <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <div className="text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-white/20" />
                <h3 className="mt-4 text-lg font-medium text-white/70">
                  CVR Metrics Coming Soon
                </h3>
                <p className="mt-2 text-sm text-white/50">
                  Conversion rate tracking and analysis will be available once
                  data storage is implemented.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
