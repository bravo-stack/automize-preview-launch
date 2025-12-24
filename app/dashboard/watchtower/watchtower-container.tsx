'use client'

import StatCard from '@/components/data-hub/stat-card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  AlertList,
  DeletedRuleList,
  RuleBuilder,
  RuleList,
} from '@/components/watchtower'
import DeleteAlertDialog from '@/components/watchtower/delete-alert-dialog'
import type {
  CompoundRuleInput,
  CreateRuleInput,
  WatchtowerAlertWithRelations,
  WatchtowerRuleWithRelations,
} from '@/types/watchtower'
import { getTimeRangeDaysLabel } from '@/types/watchtower'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Bell,
  Calendar,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { WatchtowerInfoTrig } from './watchtower-info-trigg'

type WatchtowerTab = 'overview' | 'rules' | 'alerts'
type RulesSubTab = 'active' | 'deleted'

interface PaginationInfo {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function WatchtowerContainer() {
  // STATES
  const [activeTab, setActiveTab] = useState<WatchtowerTab>('overview')
  const [rulesSubTab, setRulesSubTab] = useState<RulesSubTab>('active')
  const [rules, setRules] = useState<WatchtowerRuleWithRelations[]>([])
  const [deletedRules, setDeletedRules] = useState<
    WatchtowerRuleWithRelations[]
  >([])
  const [recentRules, setRecentRules] = useState<WatchtowerRuleWithRelations[]>(
    [],
  )
  const [alerts, setAlerts] = useState<WatchtowerAlertWithRelations[]>([])
  const [rulesPagination, setRulesPagination] = useState<PaginationInfo | null>(
    null,
  )
  const [deletedRulesPagination, setDeletedRulesPagination] =
    useState<PaginationInfo | null>(null)
  const [alertsPagination, setAlertsPagination] =
    useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Rule Builder State
  const [showRuleBuilder, setShowRuleBuilder] = useState(false)
  const [editingRule, setEditingRule] =
    useState<WatchtowerRuleWithRelations | null>(null)

  // Delete Alert Dialog State
  const [alertToDelete, setAlertToDelete] =
    useState<WatchtowerAlertWithRelations | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filters
  const [rulesPage, setRulesPage] = useState(1)
  const [rulesPageSize, setRulesPageSize] = useState(20)
  const [deletedRulesPage, setDeletedRulesPage] = useState(1)
  const [deletedRulesPageSize, setDeletedRulesPageSize] = useState(20)
  const [alertsPage, setAlertsPage] = useState(1)
  const [alertsPageSize, setAlertsPageSize] = useState(20)
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [newAlertsCreated, setNewAlertsCreated] = useState(false)

  // Sorting
  const [rulesSortBy, setRulesSortBy] = useState<string>('created_desc')
  const [alertsSortBy, setAlertsSortBy] = useState<string>('created_desc')

  // Polls to keep tab counts updated and evaluate rules.
  const {
    data: evaluationData,
    refetch: refreshStats,
    isFetching: isPollingStats,
    isLoading: isStatsLoading,
  } = useQuery({
    queryKey: ['watchtower', 'evaluate'],
    queryFn: async () => {
      const res = await fetch(`/api/watchtower/evaluate?_t=${Date.now()}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch stats')
      }
      return json.data
    },
    refetchInterval: 600_000, // 10 minutes
  })
  const stats = evaluationData?.stats
  const fetchDeletedRules = useCallback(
    async (page: number = 1, pageSize: number = 20) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          action: 'deleted',
          page: page.toString(),
          pageSize: pageSize.toString(),
        })

        const res = await fetch(`/api/watchtower/rules?${params}`)
        const json = await res.json()

        if (json.success) {
          setDeletedRules(json.data)
          setDeletedRulesPagination(json.pagination)
        } else {
          setError(json.error)
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch deleted rules',
        )
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )
  const fetchAlerts = useCallback(
    async (
      page: number = 1,
      pageSize: number = 20,
      sortBy: string = 'created_desc',
    ) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          sortBy,
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
  const fetchRecentRules = useCallback(async () => {
    try {
      const res = await fetch('/api/watchtower/rules?page=1&pageSize=5')
      const json = await res.json()
      if (json.success) {
        setRecentRules(json.data)
      }
    } catch (err) {
      console.error('Error fetching recent rules:', err)
    }
  }, [])
  const fetchRules = useCallback(
    async (
      page: number = 1,
      pageSize: number = 20,
      sortBy: string = 'created_desc',
    ) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          sortBy,
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
  useEffect(() => {
    if (evaluationData?.alertsCreated && evaluationData.alertsCreated > 0) {
      const count = evaluationData.alertsCreated
      toast(`🚨 ${count} new alert${count > 1 ? 's' : ''} triggered!`, {
        icon: '⚠️',
        duration: 5000,
        style: {
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
        },
      })
      // Set flag to refresh alerts list when on alerts tab
      setNewAlertsCreated(true)
    }
  }, [evaluationData])
  useEffect(() => {
    fetchRecentRules()
  }, [fetchRecentRules])
  useEffect(() => {
    if (activeTab === 'rules') {
      if (rulesSubTab === 'active') {
        fetchRules(rulesPage, rulesPageSize, rulesSortBy)
      } else {
        fetchDeletedRules(deletedRulesPage, deletedRulesPageSize)
      }
    } else if (activeTab === 'alerts') {
      fetchAlerts(alertsPage, alertsPageSize, alertsSortBy)
    } else if (activeTab === 'overview') {
      fetchRecentRules()
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [
    activeTab,
    rulesSubTab,
    rulesPage,
    rulesPageSize,
    rulesSortBy,
    deletedRulesPage,
    deletedRulesPageSize,
    alertsPage,
    alertsPageSize,
    alertsSortBy,
    fetchRules,
    fetchDeletedRules,
    fetchAlerts,
    fetchRecentRules,
  ])
  useEffect(() => {
    if (newAlertsCreated && activeTab === 'alerts') {
      fetchAlerts(alertsPage, alertsPageSize, alertsSortBy)
      setNewAlertsCreated(false)
    }
  }, [
    newAlertsCreated,
    activeTab,
    alertsPage,
    alertsPageSize,
    alertsSortBy,
    fetchAlerts,
  ])

  // HANDLERS
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
        fetchRules(rulesPage, rulesPageSize)
        fetchRecentRules()
        refreshStats()
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
        fetchRules(rulesPage, rulesPageSize)
        fetchRecentRules()
        refreshStats()
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
        fetchRules(rulesPage, rulesPageSize)
        fetchRecentRules()
        refreshStats()
        toast.success('Rule moved to trash')
      } else {
        setError(json.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule')
    } finally {
      setIsLoading(false)
    }
  }
  const handleRestoreRule = async (ruleId: string, restoreGroup = false) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/watchtower/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ruleId,
          action: 'restore',
          restore_group: restoreGroup,
        }),
      })
      const json = await res.json()

      if (json.success) {
        fetchDeletedRules(deletedRulesPage, deletedRulesPageSize)
        fetchRules(rulesPage, rulesPageSize)
        fetchRecentRules()
        refreshStats()
        toast.success('Rule restored successfully')
      } else {
        setError(json.error)
        toast.error(json.error || 'Failed to restore rule')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore rule')
      toast.error('Failed to restore rule')
    } finally {
      setIsLoading(false)
    }
  }
  const handleHardDeleteRule = async (ruleId: string, deleteGroup = false) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ id: ruleId, hardDelete: 'true' })
      if (deleteGroup) params.set('deleteGroup', 'true')

      const res = await fetch(`/api/watchtower/rules?${params}`, {
        method: 'DELETE',
      })
      const json = await res.json()

      if (json.success) {
        fetchDeletedRules(deletedRulesPage, deletedRulesPageSize)
        refreshStats()
        toast.success('Rule permanently deleted')
      } else {
        setError(json.error)
        toast.error(json.error || 'Failed to permanently delete rule')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to permanently delete rule',
      )
      toast.error('Failed to permanently delete rule')
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
        fetchRules(rulesPage, rulesPageSize)
        fetchRecentRules()
        refreshStats()
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
        fetchAlerts(alertsPage, alertsPageSize)
        refreshStats()
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
        fetchAlerts(alertsPage, alertsPageSize)
        refreshStats()
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
  const handleDeleteAlertClick = (alert: WatchtowerAlertWithRelations) => {
    setAlertToDelete(alert)
  }
  const handleConfirmDeleteAlert = async () => {
    if (!alertToDelete) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/watchtower/alerts?id=${alertToDelete.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()

      if (json.success) {
        setAlertToDelete(null)
        fetchAlerts(alertsPage, alertsPageSize)
        refreshStats()
      } else {
        setError(json.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert')
    } finally {
      setIsDeleting(false)
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
              Watch Tower
            </h1>
            <p className="mt-2 text-lg text-white/60">
              Monitor data and trigger alerts based on custom rules
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-3">
            {activeTab === 'rules' && !showRuleBuilder && (
              <Button onClick={() => setShowRuleBuilder(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            )}

            {/* Hub Data Domains Info */}
            <WatchtowerInfoTrig />
          </div>
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
          {tabs.map((tab) => {
            // Determine badge count and style for each tab
            const getBadgeConfig = () => {
              if (!stats) return null

              switch (tab.id) {
                case 'rules':
                  // Show active rules count
                  if (stats.activeRules > 0) {
                    return {
                      count: stats.activeRules,
                      className: 'bg-emerald-500/80 text-white',
                    }
                  }
                  return null
                case 'alerts':
                  // Show unacknowledged alerts (red for urgency)
                  if (stats.unacknowledgedAlerts > 0) {
                    return {
                      count: stats.unacknowledgedAlerts,
                      className:
                        stats.criticalAlerts > 0
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-red-500 text-white',
                    }
                  }
                  return null
                default:
                  return null
              }
            }

            const badge = getBadgeConfig()

            return (
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
                {badge && (
                  <span
                    className={`ml-1 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold ${badge.className}`}
                  >
                    {badge.count > 99 ? '99+' : badge.count}
                  </span>
                )}
              </button>
            )
          })}

          {/* Polling indicator */}
          {isPollingStats && (
            <div className="flex items-center px-2" title="Updating stats...">
              <RefreshCw className="h-3 w-3 animate-spin text-white/30" />
            </div>
          )}
        </div>
        {/* Loading State - Shows skeleton while stats are initially loading */}
        {isStatsLoading && (
          <div className="space-y-8">
            {/* Loading Header */}
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
              <span className="text-lg text-white/60">
                Loading Watchtower...
              </span>
            </div>

            {/* Skeleton Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-white/10 bg-white/5 p-6"
                >
                  <div className="mb-2 h-4 w-24 rounded bg-white/10" />
                  <div className="h-8 w-16 rounded bg-white/10" />
                  <div className="mt-2 h-3 w-20 rounded bg-white/5" />
                </div>
              ))}
            </div>

            {/* Skeleton Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-white/10 bg-white/5 p-6"
                >
                  <div className="mb-4 h-5 w-32 rounded bg-white/10" />
                  <div className="space-y-3">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-4 w-24 rounded bg-white/5" />
                        <div className="h-4 w-12 rounded bg-white/10" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 h-10 w-full rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Overview Tab */}
        {activeTab === 'overview' && !isStatsLoading && (
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

            {/* Recent Rules */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-medium text-white">
                  <Shield className="h-5 w-5" />
                  Recent Rules
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('rules')}
                  className="text-white/60 hover:text-white"
                >
                  View All
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {recentRules.length === 0 ? (
                  <p className="text-sm text-white/50">
                    No rules created yet. Create your first rule to start
                    monitoring.
                  </p>
                ) : (
                  recentRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            rule.is_active ? 'bg-green-500' : 'bg-white/30'
                          }`}
                        />
                        <div>
                          <p className="font-medium text-white">{rule.name}</p>
                          <p className="flex items-center gap-2 text-xs text-white/50">
                            <span>
                              {rule.target_table?.replace(/_/g, ' ') ||
                                'All domains'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {getTimeRangeDaysLabel(rule.time_range_days)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          rule.severity === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : rule.severity === 'warning'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {rule.severity}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  refreshStats()
                }}
                disabled={isLoading || isPollingStats}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading || isPollingStats ? 'animate-spin' : ''}`}
                />
                Refresh Stats
              </Button>
            </div>
          </div>
        )}{' '}
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
                {/* Rules Sub-tabs */}
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <button
                    onClick={() => {
                      setRulesSubTab('active')
                      setRulesPage(1)
                    }}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      rulesSubTab === 'active'
                        ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                        : 'border border-transparent text-white/60 hover:bg-white/5 hover:text-white/80'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Active Rules
                    {rulesPagination && (
                      <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                        {rulesPagination.totalCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setRulesSubTab('deleted')
                      setDeletedRulesPage(1)
                    }}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      rulesSubTab === 'deleted'
                        ? 'border border-red-500/30 bg-red-500/20 text-red-400'
                        : 'border border-transparent text-white/60 hover:bg-white/5 hover:text-white/80'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Deleted Rules
                    {deletedRulesPagination &&
                      deletedRulesPagination.totalCount > 0 && (
                        <span className="ml-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                          {deletedRulesPagination.totalCount}
                        </span>
                      )}
                  </button>
                </div>

                {/* Active Rules Content */}
                {rulesSubTab === 'active' && (
                  <>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4">
                      <Select
                        value={rulesSortBy}
                        onChange={(e) => {
                          setRulesSortBy(e.target.value)
                          setRulesPage(1)
                        }}
                        className="w-44"
                      >
                        <option value="created_desc">Newest First</option>
                        <option value="created_asc">Oldest First</option>
                        <option value="name_asc">Name (A-Z)</option>
                        <option value="name_desc">Name (Z-A)</option>
                        <option value="triggers_desc">Most Triggered</option>
                      </Select>

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

                      <Select
                        value={String(rulesPageSize)}
                        onChange={(e) => {
                          setRulesPageSize(Number(e.target.value))
                          setRulesPage(1)
                        }}
                        className="w-32"
                      >
                        <option value="10">10 per page</option>
                        <option value="20">20 per page</option>
                        <option value="50">50 per page</option>
                        <option value="100">100 per page</option>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchRules(rulesPage, rulesPageSize, rulesSortBy)
                        }
                        disabled={isLoading}
                      >
                        <RefreshCw
                          className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                      </Button>
                    </div>

                    {/* Loading Indicator */}
                    {isLoading && rules.length > 0 && (
                      <div className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                        <span className="text-sm text-white/60">
                          Refreshing rules...
                        </span>
                      </div>
                    )}

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
                          {rulesPagination.totalPages} (
                          {rulesPagination.totalCount} rules)
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

                {/* Deleted Rules Content */}
                {rulesSubTab === 'deleted' && (
                  <>
                    {/* Info Banner */}
                    <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                      <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-400">
                          Deleted rules recovery
                        </p>
                        <p className="mt-1 text-white/60">
                          Deleted rules are kept for 30 days before they can be
                          permanently removed. You can restore them at any time
                          during this period.
                        </p>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4">
                      <Select
                        value={String(deletedRulesPageSize)}
                        onChange={(e) => {
                          setDeletedRulesPageSize(Number(e.target.value))
                          setDeletedRulesPage(1)
                        }}
                        className="w-32"
                      >
                        <option value="10">10 per page</option>
                        <option value="20">20 per page</option>
                        <option value="50">50 per page</option>
                        <option value="100">100 per page</option>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchDeletedRules(
                            deletedRulesPage,
                            deletedRulesPageSize,
                          )
                        }
                        disabled={isLoading}
                      >
                        <RefreshCw
                          className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                      </Button>
                    </div>

                    {/* Loading Indicator */}
                    {isLoading && deletedRules.length > 0 && (
                      <div className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                        <span className="text-sm text-white/60">
                          Refreshing deleted rules...
                        </span>
                      </div>
                    )}

                    {/* Deleted Rules List */}
                    <DeletedRuleList
                      rules={deletedRules}
                      onRestore={handleRestoreRule}
                      onHardDelete={handleHardDeleteRule}
                      isLoading={isLoading}
                    />

                    {/* Pagination */}
                    {deletedRulesPagination &&
                      deletedRulesPagination.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-white/60">
                            Page {deletedRulesPagination.page} of{' '}
                            {deletedRulesPagination.totalPages} (
                            {deletedRulesPagination.totalCount} deleted rules)
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletedRulesPage((p) => p - 1)}
                              disabled={
                                !deletedRulesPagination.hasPrevPage || isLoading
                              }
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletedRulesPage((p) => p + 1)}
                              disabled={
                                !deletedRulesPagination.hasNextPage || isLoading
                              }
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                  </>
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
                value={alertsSortBy}
                onChange={(e) => {
                  setAlertsSortBy(e.target.value)
                  setAlertsPage(1)
                }}
                className="w-44"
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="severity_desc">Severity (High-Low)</option>
              </Select>

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

              <Select
                value={String(alertsPageSize)}
                onChange={(e) => {
                  setAlertsPageSize(Number(e.target.value))
                  setAlertsPage(1)
                }}
                className="w-32"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  fetchAlerts(alertsPage, alertsPageSize, alertsSortBy)
                }
                disabled={isLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>

            {/* Loading Indicator */}
            {isLoading && alerts.length > 0 && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                <span className="text-sm text-white/60">
                  Refreshing alerts...
                </span>
              </div>
            )}

            {/* Alerts List */}
            <AlertList
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onBulkAcknowledge={handleBulkAcknowledge}
              onDelete={handleDeleteAlertClick}
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

      {/* Delete Alert Confirmation Dialog */}
      <DeleteAlertDialog
        isOpen={!!alertToDelete}
        onClose={() => setAlertToDelete(null)}
        onConfirm={handleConfirmDeleteAlert}
        alertMessage={alertToDelete?.message}
        isLoading={isDeleting}
      />
    </main>
  )
}
