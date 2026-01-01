'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  CONDITION_LABELS,
  DEPENDENCY_CONDITIONS,
  getConditionsForDomainAndFieldType,
  getTimeRangeDaysLabel,
  LOGIC_OPERATORS,
  SEVERITY_LEVELS,
  TABLE_FIELDS,
  TARGET_TABLES,
  TIME_RANGE_PRESETS,
  type CompoundRuleInput,
  type CreateRuleInput,
  type FieldDefinition,
  type RuleClause,
  type RuleCondition,
  type TargetTable,
  type WatchtowerRule,
} from '@/types/watchtower'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Info,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

// ============================================================================
// Types & Helpers
// ============================================================================

const TARGET_TABLE_LABELS: Record<string, string> = {
  facebook_metrics: 'Facebook (Autometric)',
  finance_metrics: 'Finance (FinancialX)',
  api_records: 'API Data Records',
  form_submissions: 'Form Submissions',
  api_snapshots: 'API Snapshots',
  sheet_snapshots: 'Sheet Snapshots',
}

const TARGET_TABLE_DESCRIPTIONS: Record<string, string> = {
  facebook_metrics:
    'Monitors Facebook Ads performance metrics from Autometric sheets. Fields include ad spend, ROAS, CPA, CTR, and other Facebook advertising KPIs.',
  finance_metrics:
    'Monitors financial rebill metrics from FinancialX sheets. Fields include rebill spend, rebill ROAS, and revenue tracking.',
  api_records:
    'Monitors individual records fetched from external APIs like Omnisend, Shopify, and other integrations.',
  form_submissions:
    'Monitors form submission status for Day Drop requests and Website Revamp requests.',
  api_snapshots:
    'Monitors API data sync health and status. Alert on failed syncs or high error rates.',
  sheet_snapshots:
    'Monitors Google Sheet refresh status. Alert on sync failures or stale data.',
}

function getTargetTableLabel(table: string): string {
  return (
    TARGET_TABLE_LABELS[table] ||
    table.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  )
}

function getTargetTableDescription(table: string): string {
  return (
    TARGET_TABLE_DESCRIPTIONS[table] ||
    'No description available for this data domain.'
  )
}

function conditionRequiresThreshold(condition: string): boolean {
  return !['changed', 'is_null', 'is_not_null'].includes(condition)
}

interface Pod {
  id: number
  name: string
  discord_id: string | null
  whatsapp_number: string | null
}

interface ChannelIdEntry {
  channel_id: string
  label: string | null
}
interface ChannelIds {
  id: string
  rule_id: string
  channel_id: string
  label: string | null
  created_at: string
}

interface RuleBuilderProps {
  onSave: (rule: CreateRuleInput | CompoundRuleInput) => Promise<void>
  onCancel: () => void
  editRule?: WatchtowerRule | null
  isLoading?: boolean
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

async function fetchParentRules(excludeId?: string) {
  const params = new URLSearchParams({ action: 'parent-rules' })
  if (excludeId) params.append('exclude', excludeId)

  const res = await fetch(`/api/watchtower/rules?${params.toString()}`)
  const json = await res.json()
  if (!json.success) throw new Error('Failed to fetch parent rules')
  return (json.data as WatchtowerRule[]) || []
}

async function fetchPods() {
  const res = await fetch('/api/watchtower/pods')
  const json = await res.json()
  if (!json.success) throw new Error('Failed to fetch pods')
  return (json.data as Pod[]) || []
}

async function fetchChannelIds(ruleId?: string) {
  if (!ruleId) return []
  const res = await fetch(`/api/watchtower/channel-ids?ruleId=${ruleId}`)
  const json = await res.json()
  if (!json.success) throw new Error('Failed to fetch channel IDs')

  // Transform immediately for easier consumption
  return ((json.data as ChannelIds[]) ?? []).map((c: any) => ({
    channel_id: c.channel_id,
    label: c.label,
  }))
}

// ============================================================================
// Component
// ============================================================================

export default function RuleBuilder({
  onSave,
  onCancel,
  editRule,
  isLoading = false,
}: RuleBuilderProps) {
  // -- TanStack Queries --

  const { data: availableParentRules = [], isLoading: isLoadingParents } =
    useQuery({
      queryKey: ['watchtower', 'parent-rules', editRule?.id],
      queryFn: () => fetchParentRules(editRule?.id),
      staleTime: 1000 * 60 * 5, // 5 minutes
    })

  const { data: availablePods = [], isLoading: isLoadingPods } = useQuery({
    queryKey: ['watchtower', 'pods'],
    queryFn: fetchPods,
    staleTime: 1000 * 60 * 5,
  })

  // We only fetch channel IDs if we are editing an existing rule
  const { data: fetchedChannelIds = [], isLoading: isLoadingChannels } =
    useQuery({
      queryKey: ['watchtower', 'channel-ids', editRule?.id],
      queryFn: () => fetchChannelIds(editRule?.id),
      enabled: !!editRule?.id,
      staleTime: 0, // Always fresh for edit form
    })

  // Combine loading states for initial render
  const isFetchingInitialData =
    isLoadingParents || isLoadingPods || isLoadingChannels

  // -- Form State --

  const [isCompound, setIsCompound] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetTable, setTargetTable] = useState<string>('')
  const [severity, setSeverity] = useState<string>('warning')
  const [logicOperator, setLogicOperator] = useState<string>('AND')
  const [timeRangeDays, setTimeRangeDays] = useState<number | null>(null)
  const [useCustomTimeRange, setUseCustomTimeRange] = useState(false)
  const [fieldName, setFieldName] = useState('')
  const [condition, setCondition] = useState<string>('greater_than')
  const [thresholdValue, setThresholdValue] = useState('')
  const [clauses, setClauses] = useState<RuleClause[]>([])

  const [notifyDiscord, setNotifyDiscord] = useState(false)
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false)

  const [selectedPodIds, setSelectedPodIds] = useState<string[]>([])

  // Local Channel ID state (synced from fetch, then mutable)
  const [channelIds, setChannelIds] = useState<ChannelIdEntry[]>([])
  const [newChannelId, setNewChannelId] = useState('')
  const [newChannelLabel, setNewChannelLabel] = useState('')

  const [parentRuleId, setParentRuleId] = useState<string>('')
  const [dependencyCondition, setDependencyCondition] = useState<string>('')

  // Derived state for available fields based on selected table
  const [availableFields, setAvailableFields] = useState<FieldDefinition[]>([])

  // -- Effects --

  // 1. Sync fetched channel IDs to local state when they load
  useEffect(() => {
    if (fetchedChannelIds) {
      setChannelIds(fetchedChannelIds)
    }
  }, [fetchedChannelIds])

  // 2. Update available fields when target table changes
  useEffect(() => {
    if (targetTable) {
      const tableConfig = TABLE_FIELDS.find((t) => t.table === targetTable)
      setAvailableFields(tableConfig?.fields || [])
    } else {
      setAvailableFields([])
    }
  }, [targetTable])

  // 3. Initialize form with edit data
  useEffect(() => {
    if (editRule) {
      setName(editRule.name)
      setDescription(editRule.description || '')
      setTargetTable(editRule.target_table || '')
      setSeverity(editRule.severity)
      setLogicOperator(editRule.logic_operator)
      const days = editRule.time_range_days
      setTimeRangeDays(days)
      const isPreset = TIME_RANGE_PRESETS.some((p) => p.value === days)
      setUseCustomTimeRange(!isPreset && days !== null)
      setFieldName(editRule.field_name)
      setCondition(editRule.condition)
      setThresholdValue(editRule.threshold_value || '')
      setNotifyDiscord(editRule.notify_discord)
      setNotifyWhatsapp(editRule.notify_whatsapp)

      setSelectedPodIds(editRule.pod_ids || [])

      // Note: channel_ids are handled by the specific query + effect above

      setParentRuleId(editRule.parent_rule_id || '')
      setDependencyCondition(editRule.dependency_condition || '')

      setIsCompound(!!editRule.group_id)
    }
  }, [editRule])

  const getFieldType = useCallback(
    (name: string): FieldDefinition['type'] | undefined => {
      return availableFields.find((f) => f.name === name)?.type
    },
    [availableFields],
  )

  const currentDomain = useMemo(
    () => (targetTable as TargetTable) || undefined,
    [targetTable],
  )

  const availableConditionsForField = useMemo(() => {
    const fieldType = getFieldType(fieldName)
    return getConditionsForDomainAndFieldType(currentDomain, fieldType)
  }, [fieldName, getFieldType, currentDomain])

  const getConditionsForClause = useCallback(
    (clauseFieldName: string): RuleCondition[] => {
      const fieldType = getFieldType(clauseFieldName)
      return getConditionsForDomainAndFieldType(currentDomain, fieldType)
    },
    [getFieldType, currentDomain],
  )

  const handleFieldChange = useCallback(
    (newFieldName: string) => {
      setFieldName(newFieldName)
      const newFieldType = availableFields.find(
        (f) => f.name === newFieldName,
      )?.type
      const validConditions = getConditionsForDomainAndFieldType(
        currentDomain,
        newFieldType,
      )
      if (!validConditions.includes(condition as RuleCondition)) {
        setCondition(validConditions[0] || 'equals')
      }
    },
    [availableFields, condition, currentDomain],
  )

  // Validate condition when target table changes
  useEffect(() => {
    if (!targetTable || !fieldName) return
    const fieldType = getFieldType(fieldName)
    const validConditions = getConditionsForDomainAndFieldType(
      currentDomain,
      fieldType,
    )
    if (!validConditions.includes(condition as RuleCondition)) {
      setCondition(validConditions[0] || 'equals')
    }
  }, [targetTable, fieldName, getFieldType, currentDomain, condition])

  const handleClauseFieldChange = useCallback(
    (clauseId: string, newFieldName: string) => {
      setClauses((prev) =>
        prev.map((clause) => {
          if (clause.id !== clauseId) return clause
          const newFieldType = availableFields.find(
            (f) => f.name === newFieldName,
          )?.type
          const validConditions = getConditionsForDomainAndFieldType(
            currentDomain,
            newFieldType,
          )
          const currentConditionValid = validConditions.includes(
            clause.condition,
          )
          return {
            ...clause,
            field_name: newFieldName,
            condition: currentConditionValid
              ? clause.condition
              : (validConditions[0] as RuleCondition),
          }
        }),
      )
    },
    [availableFields, currentDomain],
  )

  // Validate clauses when target table changes
  useEffect(() => {
    if (!targetTable || clauses.length === 0) return
    setClauses((prev) =>
      prev.map((clause) => {
        if (!clause.field_name) return clause
        const fieldType = availableFields.find(
          (f) => f.name === clause.field_name,
        )?.type
        const validConditions = getConditionsForDomainAndFieldType(
          currentDomain,
          fieldType,
        )
        if (!validConditions.includes(clause.condition)) {
          return {
            ...clause,
            condition: validConditions[0] as RuleCondition,
          }
        }
        return clause
      }),
    )
  }, [targetTable, currentDomain, availableFields])

  const addClause = useCallback(() => {
    const defaultConditions = getConditionsForDomainAndFieldType(
      currentDomain,
      undefined,
    )
    setClauses((prev) => [
      ...prev,
      {
        id: `clause_${Date.now()}`,
        field_name: '',
        condition: (defaultConditions[0] || 'equals') as RuleCondition,
        threshold_value: null,
      },
    ])
  }, [currentDomain])

  const removeClause = useCallback((id: string) => {
    setClauses((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const updateClause = useCallback(
    (id: string, field: keyof RuleClause, value: string | null) => {
      setClauses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
      )
    },
    [],
  )

  const selectedPodsWithDiscord = useMemo(() => {
    return availablePods.filter(
      (pod) => selectedPodIds.includes(pod.id.toString()) && pod.discord_id,
    )
  }, [availablePods, selectedPodIds])

  const selectedPodsWithWhatsapp = useMemo(() => {
    return availablePods.filter(
      (pod) =>
        selectedPodIds.includes(pod.id.toString()) && pod.whatsapp_number,
    )
  }, [availablePods, selectedPodIds])

  const handleAddChannelId = () => {
    if (
      newChannelId.trim() &&
      !channelIds.some((c) => c.channel_id === newChannelId.trim())
    ) {
      setChannelIds((prev) => [
        ...prev,
        {
          channel_id: newChannelId.trim(),
          label: newChannelLabel.trim() || null,
        },
      ])
      setNewChannelId('')
      setNewChannelLabel('')
    }
  }

  const handleRemoveChannelId = (channelId: string) => {
    setChannelIds((prev) => prev.filter((c) => c.channel_id !== channelId))
  }

  const handleTogglePod = (podId: string) => {
    setSelectedPodIds((prev) =>
      prev.includes(podId)
        ? prev.filter((id) => id !== podId)
        : [...prev, podId],
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const baseData = {
      name,
      description: description || undefined,
      severity: severity as 'info' | 'warning' | 'critical' | 'urgent',
      time_range_days: timeRangeDays,
      notify_discord: notifyDiscord,
      notify_whatsapp: notifyWhatsapp,
      pod_ids: selectedPodIds.length > 0 ? selectedPodIds : undefined,
      channel_ids:
        notifyDiscord && channelIds.length > 0 ? channelIds : undefined,
      parent_rule_id: parentRuleId || undefined,
      dependency_condition: (dependencyCondition || undefined) as
        | 'triggered'
        | 'not_triggered'
        | 'acknowledged'
        | undefined,
    }

    if (isCompound && clauses.length > 0) {
      const compoundRule: CompoundRuleInput = {
        ...baseData,
        target_table: (targetTable || undefined) as TargetTable | undefined,
        clauses: clauses.map((c) => ({
          id: c.id,
          field_name: c.field_name,
          condition: c.condition,
          threshold_value: c.threshold_value,
        })),
        logic_operator: logicOperator as 'AND' | 'OR',
      }
      await onSave(compoundRule)
    } else {
      const singleRule: CreateRuleInput = {
        ...baseData,
        target_table: (targetTable || undefined) as TargetTable | undefined,
        field_name: fieldName,
        condition: condition as RuleCondition,
        threshold_value: thresholdValue || undefined,
      }
      await onSave(singleRule)
    }
  }

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-purple-400" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      default:
        return <Info className="h-4 w-4 text-blue-400" />
    }
  }

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  if (isFetchingInitialData) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-white/30" />
        <p className="text-sm text-white/50">Loading rule configuration...</p>
      </div>
    )
  }

  // ==========================================================================
  // MAIN FORM
  // ==========================================================================
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-xl font-semibold text-white">
          {editRule ? 'Edit Rule' : 'Create New Rule'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-white/60 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Rule Type Toggle */}
      {!editRule && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={!isCompound ? 'default' : 'outline'}
            onClick={() => setIsCompound(false)}
            size="sm"
          >
            Single Rule
          </Button>
          <Button
            type="button"
            variant={isCompound ? 'default' : 'outline'}
            onClick={() => {
              setIsCompound(true)
              if (clauses.length === 0) addClause()
            }}
            size="sm"
          >
            Compound Rule (Multiple Clauses)
          </Button>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white/80">Basic Information</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-white/70">
              Rule Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Low ROAS Alert"
              required
              className="border-white/10 bg-zinc-900"
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Select
                label="Severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                {SEVERITY_LEVELS.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="pb-1">{getSeverityIcon(severity)}</div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/70">
            Description
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description of what this rule monitors"
            className="border-white/10 bg-zinc-900"
          />
        </div>
      </div>

      {/* Target Configuration */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white/80">
          Target Configuration
        </h3>
        <p className="text-xs text-white/50">
          Select the Hub data domain this rule should monitor
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Data Domain"
            value={targetTable}
            onChange={(e) => setTargetTable(e.target.value)}
          >
            <option value="">Select data domain...</option>
            {TARGET_TABLES.map((table) => (
              <option key={table} value={table}>
                {getTargetTableLabel(table)}
              </option>
            ))}
          </Select>

          {/* Time Range - Presets or Custom */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">
              Time Range
            </label>
            {!useCustomTimeRange ? (
              <div className="flex flex-wrap items-center gap-2">
                {TIME_RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setTimeRangeDays(preset.value)}
                    className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                      timeRangeDays === preset.value
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomTimeRange(true)
                    setTimeRangeDays(14)
                  }}
                  className="rounded-md border border-dashed border-white/20 px-3 py-1.5 text-xs text-white/50 transition-colors hover:border-white/40 hover:text-white/70"
                >
                  Custom...
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={timeRangeDays ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    setTimeRangeDays(isNaN(val) ? 0 : val)
                  }}
                  className="w-24"
                  placeholder="Days"
                />
                <span className="text-sm text-white/60">days</span>
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomTimeRange(false)
                    setTimeRangeDays(null)
                  }}
                  className="text-xs text-white/50 underline hover:text-white/70"
                >
                  Use presets
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Time Range Info */}
        <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/40" />
          <div className="text-xs text-white/60">
            <span className="font-medium text-white/80">Time Range:</span>{' '}
            {getTimeRangeDaysLabel(timeRangeDays)}
            <p className="mt-1 text-white/50">
              {timeRangeDays === null
                ? `This rule will check all ${targetTable ? getTargetTableLabel(targetTable) : ''} data regardless of date.`
                : timeRangeDays === 0
                  ? `This rule will only check today's ${targetTable ? getTargetTableLabel(targetTable) : ''} data.`
                  : `This rule will only check ${targetTable ? getTargetTableLabel(targetTable) : ''} data from the last ${timeRangeDays} days. Older records will be ignored.`}
            </p>
          </div>
        </div>

        {/* Domain Description */}
        {targetTable && (
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-400/80">
            {getTargetTableDescription(targetTable)}
          </div>
        )}
      </div>

      {/* Rule Conditions */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white/80">
          {isCompound ? 'Rule Clauses' : 'Rule Condition'}
        </h3>

        {targetTable && availableFields.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm text-yellow-500/80">
            <AlertTriangle className="h-4 w-4" />
            No fields defined for this data domain.
          </div>
        )}

        {isCompound ? (
          <>
            {/* Logic Operator */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">
                Combine clauses with:
              </span>
              <Select
                value={logicOperator}
                onChange={(e) => setLogicOperator(e.target.value)}
                className="w-24"
              >
                {LOGIC_OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </Select>
            </div>

            {/* Clauses */}
            <div className="space-y-3">
              {clauses.map((clause, index) => {
                const clauseFieldType = getFieldType(clause.field_name)
                const clauseConditions = getConditionsForClause(
                  clause.field_name,
                )
                const showThreshold = conditionRequiresThreshold(
                  clause.condition,
                )

                return (
                  <div
                    key={clause.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                  >
                    <span className="text-sm font-medium text-white/60">
                      {index + 1}.
                    </span>

                    <Select
                      value={clause.field_name}
                      onChange={(e) =>
                        handleClauseFieldChange(clause.id, e.target.value)
                      }
                      className="min-w-[140px] flex-1"
                    >
                      <option value="">Select field...</option>
                      {availableFields.map((field) => (
                        <option key={field.name} value={field.name}>
                          {field.label} ({field.type})
                        </option>
                      ))}
                    </Select>

                    <Select
                      value={clause.condition}
                      onChange={(e) =>
                        updateClause(clause.id, 'condition', e.target.value)
                      }
                      className="w-44"
                      disabled={!clause.field_name}
                    >
                      {!clause.field_name && (
                        <option value="">Select field first</option>
                      )}
                      {clauseConditions.map((cond) => (
                        <option key={cond} value={cond}>
                          {CONDITION_LABELS[cond]}
                        </option>
                      ))}
                    </Select>

                    {showThreshold ? (
                      <Input
                        value={clause.threshold_value || ''}
                        onChange={(e) =>
                          updateClause(
                            clause.id,
                            'threshold_value',
                            e.target.value || null,
                          )
                        }
                        placeholder={
                          clauseFieldType === 'number'
                            ? 'Value'
                            : clauseFieldType === 'boolean'
                              ? 'true/false'
                              : 'Value'
                        }
                        className="w-28 border-white/10 bg-zinc-900"
                      />
                    ) : (
                      <div className="w-28 rounded-md border border-white/5 bg-zinc-900/30 px-2 py-2 text-center text-xs text-white/30">
                        N/A
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeClause(clause.id)}
                      disabled={clauses.length === 1}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addClause}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Clause
            </Button>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Select
                label="Field"
                value={fieldName}
                onChange={(e) => handleFieldChange(e.target.value)}
              >
                <option value="">Select field...</option>
                {availableFields.map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.label} ({field.type})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select
                label="Condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                disabled={!fieldName}
              >
                {!fieldName && <option value="">Select a field first</option>}
                {availableConditionsForField.map((cond) => (
                  <option key={cond} value={cond}>
                    {CONDITION_LABELS[cond]}
                  </option>
                ))}
              </Select>
              {!fieldName && (
                <p className="mt-1 text-xs text-white/40">
                  Select a field to see available conditions
                </p>
              )}
            </div>

            {conditionRequiresThreshold(condition) ? (
              <div>
                <label className="mb-1 block text-sm text-white/70">
                  Threshold Value
                </label>
                <Input
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(e.target.value)}
                  placeholder={
                    getFieldType(fieldName) === 'number'
                      ? 'e.g., 1.5'
                      : getFieldType(fieldName) === 'boolean'
                        ? 'true or false'
                        : 'e.g., pending'
                  }
                  className="border-white/10 bg-zinc-900"
                />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm text-white/70">
                  Threshold Value
                </label>
                <div className="flex h-10 items-center rounded-md border border-white/10 bg-zinc-900/50 px-3 text-sm text-white/40">
                  Not required for this condition
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dependencies */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white/80">
          Rule Dependencies (Optional)
        </h3>
        <p className="text-xs text-white/50">
          Make this rule depend on another rule being triggered or acknowledged
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Parent Rule"
            value={parentRuleId}
            onChange={(e) => setParentRuleId(e.target.value)}
          >
            <option value="">No dependency</option>
            {availableParentRules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.name}
              </option>
            ))}
          </Select>

          {parentRuleId && (
            <Select
              label="Dependency Condition"
              value={dependencyCondition}
              onChange={(e) => setDependencyCondition(e.target.value)}
            >
              <option value="">Select condition...</option>
              {DEPENDENCY_CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  Parent must be {cond.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white/80">
          Notification Settings
        </h3>
        <p className="text-xs text-white/50">
          Configure how you want to be notified when this rule triggers
        </p>

        {availablePods && availablePods.length > 0 ? (
          <Fragment>
            {/* Notification Type Toggles */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={notifyDiscord}
                  onChange={(e) => setNotifyDiscord(e.target.checked)}
                  className="rounded border-white/20 bg-zinc-900"
                />
                Discord Notifications
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={notifyWhatsapp}
                  onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                  className="rounded border-white/20 bg-zinc-900"
                />
                WhatsApp Notifications
              </label>
            </div>

            {(notifyDiscord || notifyWhatsapp) && (
              <Fragment>
                {/* Pod Selection - Unified for both Discord and WhatsApp */}
                <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80">
                      Select Pods for Notifications
                    </label>
                    <p className="mt-1 text-xs text-white/40">
                      Selected pods&apos; Discord IDs and WhatsApp numbers will
                      receive notifications
                    </p>
                  </div>

                  {/* Pod Selection Grid */}
                  <div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto pb-1 sm:grid-cols-2 lg:grid-cols-3">
                    {availablePods.map((pod) => {
                      const isSelected = selectedPodIds.includes(
                        pod.id.toString(),
                      )
                      const hasDiscord = !!pod.discord_id
                      const hasWhatsapp = !!pod.whatsapp_number

                      return (
                        <button
                          key={pod.id}
                          type="button"
                          onClick={() => handleTogglePod(pod.id.toString())}
                          className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                            isSelected
                              ? 'border-emerald-500/50 bg-emerald-500/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <span className="font-medium text-white/90">
                            {pod.name}
                          </span>
                          <div className="flex gap-2 text-xs">
                            {hasDiscord ? (
                              <span className="text-blue-400">Discord ✓</span>
                            ) : (
                              <span className="text-white/30">No Discord</span>
                            )}
                            {hasWhatsapp ? (
                              <span className="text-green-400">WhatsApp ✓</span>
                            ) : (
                              <span className="text-white/30">No WhatsApp</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Selected Pods Summary */}
                  {selectedPodIds.length > 0 && (
                    <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-3">
                      <p className="mb-2 text-xs font-medium text-white/70">
                        Selected: {selectedPodIds.length} pod
                        {selectedPodIds.length > 1 ? 's' : ''}
                      </p>
                      {notifyDiscord && (
                        <p className="text-xs text-blue-400">
                          Discord: {selectedPodsWithDiscord.length} channel
                          {selectedPodsWithDiscord.length !== 1 ? 's' : ''} will
                          be notified
                          {selectedPodsWithDiscord.length <
                            selectedPodIds.length && (
                            <span className="ml-1 text-yellow-400">
                              (
                              {selectedPodIds.length -
                                selectedPodsWithDiscord.length}{' '}
                              missing Discord ID)
                            </span>
                          )}
                        </p>
                      )}
                      {notifyWhatsapp && (
                        <p className="text-xs text-green-400">
                          WhatsApp: {selectedPodsWithWhatsapp.length} number
                          {selectedPodsWithWhatsapp.length !== 1
                            ? 's'
                            : ''}{' '}
                          will be notified
                          {selectedPodsWithWhatsapp.length <
                            selectedPodIds.length && (
                            <span className="ml-1 text-yellow-400">
                              (
                              {selectedPodIds.length -
                                selectedPodsWithWhatsapp.length}{' '}
                              missing WhatsApp)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Fragment>
            )}

            {/* Extra Discord Channel IDs */}
            {notifyDiscord && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white/80">
                    Additional Discord Channel IDs
                  </label>
                  <p className="mt-1 text-xs text-white/40">
                    Add custom channel IDs that aren&apos;t tied to any pod
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Channel ID"
                    value={newChannelId}
                    onChange={(e) => setNewChannelId(e.target.value)}
                    className="flex-1 border-white/10 bg-zinc-900"
                  />
                  <Input
                    placeholder="Label (optional)"
                    value={newChannelLabel}
                    onChange={(e) => setNewChannelLabel(e.target.value)}
                    className="w-32 border-white/10 bg-zinc-900"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddChannelId}
                    disabled={!newChannelId.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {channelIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {channelIds.map((channel) => (
                      <span
                        key={channel.channel_id}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70"
                      >
                        {channel.label && (
                          <span className="text-white/50">
                            {channel.label}:
                          </span>
                        )}
                        <code className="font-mono text-blue-400">
                          {channel.channel_id.length > 12
                            ? `${channel.channel_id.slice(0, 12)}...`
                            : channel.channel_id}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveChannelId(channel.channel_id)
                          }
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Fragment>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-white/60">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">No pods available</p>
              <p className="text-xs text-white/40">
                You must create a pod in the system before you can assign
                notifications.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Saving...' : editRule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  )
}
