'use client'

import StatCard from '@/components/data-hub/stat-card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { AlertList, RuleBuilder, RuleList } from '@/components/watchtower'
import type {
  CompoundRuleInput,
  CreateRuleInput,
  WatchtowerAlertWithRelations,
  WatchtowerRuleWithRelations,
  WatchtowerStats,
} from '@/types/watchtower'
import {
  AlertTriangle,
  Bell,
  Info,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type WatchtowerTab = 'overview' | 'rules' | 'alerts'

interface PaginationInfo {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function WatchtowerPage() {
  const [activeTab, setActiveTab] = useState<WatchtowerTab>('overview')
  const [stats, setStats] = useState<WatchtowerStats | null>(null)
  const [rules, setRules] = useState<WatchtowerRuleWithRelations[]>([])
  const [alerts, setAlerts] = useState<WatchtowerAlertWithRelations[]>([])
  const [rulesPagination, setRulesPagination] = useState<PaginationInfo | null>(
    null,
  )
  const [alertsPagination, setAlertsPagination] =
    useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Rule Builder State
  const [showRuleBuilder, setShowRuleBuilder] = useState(false)
  const [editingRule, setEditingRule] =
    useState<WatchtowerRuleWithRelations | null>(null)

  // Filters
  const [rulesPage, setRulesPage] = useState(1)
  const [alertsPage, setAlertsPage] = useState(1)
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/watchtower/stats')
      const json = await res.json()
      if (json.success) {
        setStats(json.data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [])

  // Fetch Rules
  const fetchRules = useCallback(
    async (page: number = 1) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '20',
        })
        if (activeFilter) params.set('is_active', activeFilter)

        const res = await fetch(`/api/watchtower/rules?${params}`)
        const json = await res.json()

        if (json.success) {
          setRules(json.data)
          setRulesPagination(json.pagination)
        } else {
          setError(json.error)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch rules')
      } finally {
        setIsLoading(false)
      }
    },
    [activeFilter],
  )

  // Fetch Alerts
  const fetchAlerts = useCallback(
    async (page: number = 1) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '20',
        })
        if (severityFilter) params.set('severity', severityFilter)
        if (acknowledgedFilter)
          params.set('is_acknowledged', acknowledgedFilter)

        const res = await fetch(`/api/watchtower/alerts?${params}`)
        const json = await res.json()

        if (json.success) {
          setAlerts(json.data)
          setAlertsPagination(json.pagination)
        } else {
          setError(json.error)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
      } finally {
        setIsLoading(false)
      }
    },
    [severityFilter, acknowledgedFilter],
  )

  // Initial fetch
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (activeTab === 'rules') {
      fetchRules(rulesPage)
    } else if (activeTab === 'alerts') {
      fetchAlerts(alertsPage)
    } else {
      setIsLoading(false)
    }
  }, [activeTab, rulesPage, alertsPage, fetchRules, fetchAlerts])

  // Handlers
  const handleCreateRule = async (
    ruleData: CreateRuleInput | CompoundRuleInput,
  ) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/watchtower/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      })
      const json = await res.json()

      if (json.success) {
        setShowRuleBuilder(false)
        setEditingRule(null)
        fetchRules(rulesPage)
        fetchStats()
      } else {
        setError(json.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRule = async (
    ruleData: CreateRuleInput | CompoundRuleInput,
  ) => {
    if (!editingRule) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/watchtower/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingRule.id, ...ruleData }),
      })
      const json = await res.json()

      if (json.success) {
        setShowRuleBuilder(false)
        setEditingRule(null)
        fetchRules(rulesPage)
      } else {
        setError(json.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRule = async (ruleId: string, deleteGroup = false) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ id: ruleId })
      if (deleteGroup) params.set('deleteGroup', 'true')

      const res = await fetch(`/api/watchtower/rules?${params}`, {
        method: 'DELETE',
      })
      const json = await res.json()

      if (json.success) {
        fetchRules(rulesPage)
        fetchStats()
      } else {
        setError(json.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/watchtower/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ruleId,
          action: 'toggle',
          is_active: isActive,
        }),
      })
      const json = await res.json()

      if (json.success) {
        fetchRules(rulesPage)
        fetchStats()
      } else {
        setError(json.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle rule')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/watchtower/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_ids: [alertId], acknowledged_by: 'user' }),
      })
      const json = await res.json()

      if (json.success) {
        fetchAlerts(alertsPage)
        fetchStats()
      } else {
        setError(json.error)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to acknowledge alert',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkAcknowledge = async (alertIds: string[]) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/watchtower/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_ids: alertIds, acknowledged_by: 'user' }),
      })
      const json = await res.json()

      if (json.success) {
        fetchAlerts(alertsPage)
        fetchStats()
      } else {
        setError(json.error)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to acknowledge alerts',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/watchtower/alerts?id=${alertId}`, {
        method: 'DELETE',
      })
      const json = await res.json()

      if (json.success) {
        fetchAlerts(alertsPage)
        fetchStats()
      } else {
        setError(json.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs: { id: WatchtowerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Shield className="h-4 w-4" /> },
    { id: 'rules', label: 'Rules', icon: <ShieldCheck className="h-4 w-4" /> },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <ShieldAlert className="h-4 w-4" />,
    },
  ]

  return (
    <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
      <div className="mx-auto max-w-[1800px] space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="bg-gradient-to-b from-white via-zinc-300/90 to-white/70 bg-clip-text text-4xl font-bold tracking-wide text-transparent">
              Watchtower
            </h1>
            <p className="mt-2 text-lg text-white/60">
              Monitor data and trigger alerts based on custom rules
            </p>
          </div>

          {activeTab === 'rules' && !showRuleBuilder && (
            <Button onClick={() => setShowRuleBuilder(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          )}
        </header>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex w-fit flex-wrap gap-2 rounded-lg border border-white/10 bg-white/5 p-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'alerts' &&
                stats &&
                stats.unacknowledgedAlerts > 0 && (
                  <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {stats.unacknowledgedAlerts}
                  </span>
                )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatCard
                title="Total Rules"
                value={stats?.totalRules || 0}
                icon={Shield}
                description={`${stats?.activeRules || 0} active`}
              />
              <StatCard
                title="Active Rules"
                value={stats?.activeRules || 0}
                icon={ShieldCheck}
                variant={stats?.activeRules === 0 ? 'warning' : 'default'}
              />
              <StatCard
                title="Total Alerts"
                value={stats?.totalAlerts || 0}
                icon={Bell}
                description={`${stats?.unacknowledgedAlerts || 0} unacknowledged`}
              />
              <StatCard
                title="Critical Alerts"
                value={stats?.criticalAlerts || 0}
                icon={AlertTriangle}
                variant={
                  stats?.criticalAlerts && stats.criticalAlerts > 0
                    ? 'danger'
                    : 'default'
                }
              />
              <StatCard
                title="Alerts Today"
                value={stats?.alertsToday || 0}
                icon={Info}
                description={`${stats?.alertsThisWeek || 0} this week`}
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Recent Alerts Summary */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <h3 className="flex items-center gap-2 text-lg font-medium text-white">
                  <ShieldAlert className="h-5 w-5" />
                  Alert Summary
                </h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Critical</span>
                    <span className="font-mono text-red-400">
                      {stats?.criticalAlerts || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Warning</span>
                    <span className="font-mono text-yellow-400">
                      {stats?.warningAlerts || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Info</span>
                    <span className="font-mono text-blue-400">
                      {stats?.infoAlerts || 0}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Unacknowledged</span>
                      <span className="font-mono text-white">
                        {stats?.unacknowledgedAlerts || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setActiveTab('alerts')}
                >
                  View All Alerts
                </Button>
              </div>

              {/* Rules Summary */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <h3 className="flex items-center gap-2 text-lg font-medium text-white">
                  <ShieldCheck className="h-5 w-5" />
                  Rules Summary
                </h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Active Rules</span>
                    <span className="font-mono text-green-400">
                      {stats?.activeRules || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Inactive Rules</span>
                    <span className="font-mono text-white/40">
                      {stats?.inactiveRules || 0}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Total Rules</span>
                      <span className="font-mono text-white">
                        {stats?.totalRules || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setActiveTab('rules')}
                >
                  Manage Rules
                </Button>
              </div>
            </div>

            {/* Hub Data Domains Info */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="font-medium text-blue-400">
                    Available Data Domains for Monitoring
                  </h3>
                  <p className="mt-1 text-sm text-blue-400/80">
                    Rules can be configured to monitor data from any of these
                    Hub domains:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-blue-400/80">
                    <li>
                      <strong>Facebook (Autometric):</strong> Facebook Ads
                      performance metrics from Autometric sheets - ad spend,
                      ROAS, CPA, CTR, hook rate, and more
                    </li>
                    <li>
                      <strong>Finance (FinancialX):</strong> Rebill and
                      accounting metrics from FinancialX sheets - rebill spend,
                      rebill ROAS, revenue tracking
                    </li>
                    <li>
                      <strong>API Data Records:</strong> Individual records from
                      external APIs like Omnisend, Shopify, and other
                      integrations
                    </li>
                    <li>
                      <strong>Form Submissions:</strong> Day Drop requests and
                      Website Revamp submissions - status tracking and SLA
                      monitoring
                    </li>
                    <li>
                      <strong>API Snapshots:</strong> API data sync health -
                      alert on failures or high error rates
                    </li>
                    <li>
                      <strong>Sheet Snapshots:</strong> Google Sheet refresh
                      status - alert on sync failures or stale data
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={fetchStats}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh Stats
              </Button>
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            {showRuleBuilder ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <RuleBuilder
                  onSave={editingRule ? handleUpdateRule : handleCreateRule}
                  onCancel={() => {
                    setShowRuleBuilder(false)
                    setEditingRule(null)
                  }}
                  editRule={editingRule}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  <Select
                    value={activeFilter}
                    onChange={(e) => {
                      setActiveFilter(e.target.value)
                      setRulesPage(1)
                    }}
                    className="w-40"
                  >
                    <option value="">All Rules</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchRules(rulesPage)}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                    />
                    Refresh
                  </Button>
                </div>

                {/* Rules List */}
                <RuleList
                  rules={rules}
                  onEdit={(rule) => {
                    setEditingRule(rule)
                    setShowRuleBuilder(true)
                  }}
                  onDelete={handleDeleteRule}
                  onToggle={handleToggleRule}
                  isLoading={isLoading}
                />

                {/* Pagination */}
                {rulesPagination && rulesPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/60">
                      Page {rulesPagination.page} of{' '}
                      {rulesPagination.totalPages} ({rulesPagination.totalCount}{' '}
                      rules)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRulesPage((p) => p - 1)}
                        disabled={!rulesPagination.hasPrevPage || isLoading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRulesPage((p) => p + 1)}
                        disabled={!rulesPagination.hasNextPage || isLoading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <Select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value)
                  setAlertsPage(1)
                }}
                className="w-40"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </Select>

              <Select
                value={acknowledgedFilter}
                onChange={(e) => {
                  setAcknowledgedFilter(e.target.value)
                  setAlertsPage(1)
                }}
                className="w-40"
              >
                <option value="">All Status</option>
                <option value="false">Unacknowledged</option>
                <option value="true">Acknowledged</option>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAlerts(alertsPage)}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>

            {/* Alerts List */}
            <AlertList
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onBulkAcknowledge={handleBulkAcknowledge}
              onDelete={handleDeleteAlert}
              isLoading={isLoading}
            />

            {/* Pagination */}
            {alertsPagination && alertsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/60">
                  Page {alertsPagination.page} of {alertsPagination.totalPages}{' '}
                  ({alertsPagination.totalCount} alerts)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAlertsPage((p) => p - 1)}
                    disabled={!alertsPagination.hasPrevPage || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAlertsPage((p) => p + 1)}
                    disabled={!alertsPagination.hasNextPage || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
