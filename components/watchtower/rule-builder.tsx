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
import { AlertTriangle, Calendar, Info, Plus, Trash2, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

// ============================================================================
// Target Table Labels & Descriptions - Maps to Hub Data Domains
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

/**
 * Check if a condition requires a threshold value input
 */
function conditionRequiresThreshold(condition: string): boolean {
  return !['changed', 'is_null', 'is_not_null'].includes(condition)
}

interface Pod {
  id: number
  name: string
  discord_id: string | null
  whatsapp_number: string | null
}

interface RuleBuilderProps {
  onSave: (rule: CreateRuleInput | CompoundRuleInput) => Promise<void>
  onCancel: () => void
  editRule?: WatchtowerRule | null
  isLoading?: boolean
}

export default function RuleBuilder({
  onSave,
  onCancel,
  editRule,
  isLoading = false,
}: RuleBuilderProps) {
  const [isCompound, setIsCompound] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetTable, setTargetTable] = useState<string>('')
  const [severity, setSeverity] = useState<string>('warning')
  const [logicOperator, setLogicOperator] = useState<string>('AND')
  // Time range in days: null = all time, 0 = today, positive number = last N days
  const [timeRangeDays, setTimeRangeDays] = useState<number | null>(null)
  const [useCustomTimeRange, setUseCustomTimeRange] = useState(false)

  // Single rule fields
  const [fieldName, setFieldName] = useState('')
  const [condition, setCondition] = useState<string>('greater_than')
  const [thresholdValue, setThresholdValue] = useState('')

  // Compound rule clauses
  const [clauses, setClauses] = useState<RuleClause[]>([])

  // Notification settings
  const [notifyDiscord, setNotifyDiscord] = useState(false)
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false)
  const [selectedPodId, setSelectedPodId] = useState<string>('')
  // Multiple pods for Discord notifications
  const [selectedPodIds, setSelectedPodIds] = useState<string[]>([])
  // Extra Discord channel IDs
  const [extraDiscordChannelIds, setExtraDiscordChannelIds] = useState<
    string[]
  >([])
  const [newChannelId, setNewChannelId] = useState<string>('')
  // Extra WhatsApp numbers
  const [extraWhatsappNumbers, setExtraWhatsappNumbers] = useState<string[]>([])
  const [newWhatsappNumber, setNewWhatsappNumber] = useState<string>('')

  // Dependency settings
  const [parentRuleId, setParentRuleId] = useState<string>('')
  const [dependencyCondition, setDependencyCondition] = useState<string>('')

  // Available data
  const [availableParentRules, setAvailableParentRules] = useState<
    WatchtowerRule[]
  >([])
  const [availableFields, setAvailableFields] = useState<FieldDefinition[]>([])
  const [availablePods, setAvailablePods] = useState<Pod[]>([])

  // Fetch available parent rules and pods
  useEffect(() => {
    async function fetchData() {
      try {
        const [parentsRes, podsRes] = await Promise.all([
          fetch(
            `/api/watchtower/rules?action=parent-rules${editRule ? `&exclude=${editRule.id}` : ''}`,
          ),
          fetch('/api/watchtower/pods'),
        ])

        const parentsJson = await parentsRes.json()
        const podsJson = await podsRes.json()

        if (parentsJson.success) setAvailableParentRules(parentsJson.data)
        if (podsJson.success) setAvailablePods(podsJson.data)
      } catch (error) {
        console.error('Error fetching rule builder data:', error)
      }
    }

    fetchData()
  }, [editRule])

  // Update available fields when target table changes
  useEffect(() => {
    if (targetTable) {
      const tableConfig = TABLE_FIELDS.find((t) => t.table === targetTable)
      setAvailableFields(tableConfig?.fields || [])
    } else {
      setAvailableFields([])
    }
  }, [targetTable])

  // Initialize form with edit data
  useEffect(() => {
    if (editRule) {
      setName(editRule.name)
      setDescription(editRule.description || '')
      setTargetTable(editRule.target_table || '')
      setSeverity(editRule.severity)
      setLogicOperator(editRule.logic_operator)
      // Handle numeric time_range_days
      const days = editRule.time_range_days
      setTimeRangeDays(days)
      // Check if it's a custom value (not in presets)
      const isPreset = TIME_RANGE_PRESETS.some((p) => p.value === days)
      setUseCustomTimeRange(!isPreset && days !== null)
      setFieldName(editRule.field_name)
      setCondition(editRule.condition)
      setThresholdValue(editRule.threshold_value || '')
      setNotifyDiscord(editRule.notify_discord)
      setNotifyWhatsapp(editRule.notify_whatsapp)
      setSelectedPodId(editRule.pod_id || '')
      // Load multi-pod selection
      setSelectedPodIds(editRule.pod_ids || [])
      // Load extra Discord channel IDs
      setExtraDiscordChannelIds(editRule.extra_discord_channel_ids || [])
      // Load extra WhatsApp numbers
      setExtraWhatsappNumbers(editRule.extra_whatsapp_numbers || [])
      setParentRuleId(editRule.parent_rule_id || '')
      setDependencyCondition(editRule.dependency_condition || '')

      // If editing a grouped rule, it's compound
      setIsCompound(!!editRule.group_id)
    }
  }, [editRule])

  /**
   * Get the field type for a given field name from available fields.
   * O(n) lookup where n = number of fields in table (typically < 20)
   */
  const getFieldType = useCallback(
    (name: string): FieldDefinition['type'] | undefined => {
      return availableFields.find((f) => f.name === name)?.type
    },
    [availableFields],
  )

  /**
   * Memoized domain cast to avoid recreation on each render.
   * Uses type assertion only when value is valid.
   */
  const currentDomain = useMemo(
    () => (targetTable as TargetTable) || undefined,
    [targetTable],
  )

  /**
   * Get available conditions for the currently selected single field.
   * Uses domain + field type intersection for precise filtering.
   */
  const availableConditionsForField = useMemo(() => {
    const fieldType = getFieldType(fieldName)
    return getConditionsForDomainAndFieldType(currentDomain, fieldType)
  }, [fieldName, getFieldType, currentDomain])

  /**
   * Get available conditions for a clause's selected field.
   * Returns domain-constrained conditions based on clause field type.
   */
  const getConditionsForClause = useCallback(
    (clauseFieldName: string): RuleCondition[] => {
      const fieldType = getFieldType(clauseFieldName)
      return getConditionsForDomainAndFieldType(currentDomain, fieldType)
    },
    [getFieldType, currentDomain],
  )

  /**
   * When field changes, reset condition if invalid for new domain + field type combo.
   */
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
        // Reset to first valid condition for domain + field type
        setCondition(validConditions[0] || 'equals')
      }
    },
    [availableFields, condition, currentDomain],
  )

  /**
   * When target table (domain) changes, validate current condition is still valid.
   */
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

  /**
   * When clause field changes, update condition if invalid for domain + field type.
   */
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

  /**
   * When domain changes, validate all clause conditions.
   */
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
  }, [targetTable, currentDomain, availableFields]) // eslint-disable-line react-hooks/exhaustive-deps

  const addClause = useCallback(() => {
    // Default to first valid condition for the domain (no field type yet)
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Get the selected pod's discord_id for notifications (primary pod)
    const selectedPod = availablePods.find(
      (p) => p.id.toString() === selectedPodId,
    )

    const baseData = {
      name,
      description: description || undefined,
      severity: severity as 'info' | 'warning' | 'critical',
      time_range_days: timeRangeDays,
      notify_discord: notifyDiscord,
      discord_channel_id:
        notifyDiscord && selectedPod?.discord_id
          ? selectedPod.discord_id
          : undefined,
      // Include extra Discord channel IDs
      extra_discord_channel_ids:
        notifyDiscord && extraDiscordChannelIds.length > 0
          ? extraDiscordChannelIds
          : undefined,
      notify_whatsapp: notifyWhatsapp,
      // Include extra WhatsApp numbers
      extra_whatsapp_numbers:
        notifyWhatsapp && extraWhatsappNumbers.length > 0
          ? extraWhatsappNumbers
          : undefined,
      pod_id: selectedPodId || undefined,
      // Include multiple pod IDs for notifications
      pod_ids:
        (notifyDiscord || notifyWhatsapp) && selectedPodIds.length > 0
          ? selectedPodIds
          : undefined,
      parent_rule_id: parentRuleId || undefined,
      dependency_condition: (dependencyCondition || undefined) as
        | 'triggered'
        | 'not_triggered'
        | 'acknowledged'
        | undefined,
    }

    if (isCompound && clauses.length > 0) {
      // Compound rule
      const compoundRule: CompoundRuleInput = {
        ...baseData,
        target_table: (targetTable || undefined) as
          | 'facebook_metrics'
          | 'finance_metrics'
          | 'api_records'
          | 'form_submissions'
          | 'api_snapshots'
          | 'sheet_snapshots'
          | undefined,
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
      // Single rule
      const singleRule: CreateRuleInput = {
        ...baseData,
        target_table: (targetTable || undefined) as
          | 'facebook_metrics'
          | 'finance_metrics'
          | 'api_records'
          | 'form_submissions'
          | 'api_snapshots'
          | 'sheet_snapshots'
          | undefined,
        field_name: fieldName,
        condition: condition as RuleCondition,
        threshold_value: thresholdValue || undefined,
      }
      await onSave(singleRule)
    }
  }

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      default:
        return <Info className="h-4 w-4 text-blue-400" />
    }
  }

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
                    setTimeRangeDays(14) // Default custom value
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
                    setTimeRangeDays(null) // Reset to all time
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
          Discord Notifications
        </h3>
        <p className="text-xs text-white/50">
          Send immediate Discord notifications when this rule triggers
        </p>

        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={notifyDiscord}
            onChange={(e) => setNotifyDiscord(e.target.checked)}
            className="rounded border-white/20 bg-zinc-900"
          />
          Enable Discord Notifications
        </label>

        {/* Pod Selection for Discord */}
        {notifyDiscord && (
          <div className="space-y-4">
            {/* Primary Pod Selection */}
            <Select
              label="Primary Pod (for main Discord channel)"
              value={selectedPodId}
              onChange={(e) => setSelectedPodId(e.target.value)}
            >
              <option value="">Select a pod...</option>
              {availablePods.map((pod) => (
                <option key={pod.id} value={pod.id.toString()}>
                  {pod.name}
                </option>
              ))}
            </Select>

            {selectedPodId && availablePods && availablePods?.length > 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
                {(() => {
                  const pod = availablePods.find(
                    (p) => p.id.toString() === selectedPodId,
                  )
                  if (!pod) return null
                  return (
                    <div className="space-y-1">
                      <p className="font-medium text-white/80">{pod.name}</p>
                      <p className="text-white/50">
                        Discord ID:{' '}
                        <span className="font-mono text-blue-400">
                          {pod.discord_id || 'Not configured'}
                        </span>
                      </p>
                    </div>
                  )
                })()}
              </div>
            ) : null}

            {/* Warning if selected pod is missing Discord ID */}
            {selectedPodId &&
              !availablePods.find((p) => p.id.toString() === selectedPodId)
                ?.discord_id && (
                <p className="text-xs text-yellow-400">
                  ⚠️ Selected pod does not have a Discord ID configured
                </p>
              )}

            {/* Multiple Pods Selection */}
            <div className="space-y-2">
              <label className="block text-sm text-white/70">
                Additional Pods (Optional)
              </label>
              <p className="text-xs text-white/40">
                Select multiple pods to notify their Discord channels as well
              </p>
              <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-white/10 bg-zinc-900/50 p-3">
                {availablePods
                  .filter((pod) => pod.id.toString() !== selectedPodId)
                  .map((pod) => (
                    <label
                      key={pod.id}
                      className="flex items-center gap-2 text-sm text-white/70"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPodIds.includes(pod.id.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPodIds((prev) => [
                              ...prev,
                              pod.id.toString(),
                            ])
                          } else {
                            setSelectedPodIds((prev) =>
                              prev.filter((id) => id !== pod.id.toString()),
                            )
                          }
                        }}
                        className="rounded border-white/20 bg-zinc-900"
                      />
                      <span className="truncate">{pod.name}</span>
                      {pod.discord_id ? (
                        <span className="text-xs text-blue-400">✓</span>
                      ) : (
                        <span className="text-xs text-yellow-400">⚠</span>
                      )}
                    </label>
                  ))}
              </div>
              {selectedPodIds.length > 0 && (
                <p className="text-xs text-blue-400">
                  {selectedPodIds.length} additional pod
                  {selectedPodIds.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Extra Discord Channel IDs */}
            <div className="space-y-2">
              <label className="block text-sm text-white/70">
                Extra Discord Channel IDs (Optional)
              </label>
              <p className="text-xs text-white/40">
                Add custom channel IDs to also receive notifications
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Discord Channel ID"
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  className="flex-1 border-white/10 bg-zinc-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (
                      newChannelId.trim() &&
                      !extraDiscordChannelIds.includes(newChannelId.trim())
                    ) {
                      setExtraDiscordChannelIds((prev) => [
                        ...prev,
                        newChannelId.trim(),
                      ])
                      setNewChannelId('')
                    }
                  }}
                  disabled={!newChannelId.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {extraDiscordChannelIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {extraDiscordChannelIds.map((channelId) => (
                    <span
                      key={channelId}
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70"
                    >
                      <code className="font-mono text-blue-400">
                        {channelId.slice(0, 12)}
                        {channelId.length > 12 ? '...' : ''}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          setExtraDiscordChannelIds((prev) =>
                            prev.filter((id) => id !== channelId),
                          )
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
          </div>
        )}
      </div>

      {/* WhatsApp Notification Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white/80">
          WhatsApp Notifications
        </h3>
        <p className="text-xs text-white/50">
          Send immediate WhatsApp notifications when this rule triggers
        </p>

        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={notifyWhatsapp}
            onChange={(e) => setNotifyWhatsapp(e.target.checked)}
            className="rounded border-white/20 bg-zinc-900"
          />
          Enable WhatsApp Notifications
        </label>

        {/* Pod Selection for WhatsApp (if Discord not already selecting one) */}
        {notifyWhatsapp &&
        !notifyDiscord &&
        availablePods &&
        availablePods?.length > 0 ? (
          <div className="space-y-3">
            <Select
              label="Select Pod"
              value={selectedPodId}
              onChange={(e) => setSelectedPodId(e.target.value)}
            >
              <option value="">Select a pod...</option>
              {availablePods.map((pod) => (
                <option key={pod.id} value={pod.id.toString()}>
                  {pod.name}
                  {pod.whatsapp_number
                    ? ` (WhatsApp: ${pod.whatsapp_number.slice(0, 8)}...)`
                    : ''}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {/* WhatsApp number info display */}
        {notifyWhatsapp &&
        selectedPodId &&
        availablePods &&
        availablePods?.length > 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
            {(() => {
              const pod = availablePods.find(
                (p) => p.id.toString() === selectedPodId,
              )
              if (!pod) return null
              return (
                <div className="space-y-1">
                  <p className="font-medium text-white/80">{pod.name}</p>
                  <p className="text-white/50">
                    WhatsApp:{' '}
                    <span className="font-mono text-green-400">
                      {pod.whatsapp_number || 'Not configured'}
                    </span>
                  </p>
                </div>
              )
            })()}
          </div>
        ) : null}

        {/* Warning if selected pod is missing WhatsApp number */}
        {notifyWhatsapp &&
          selectedPodId &&
          !availablePods.find((p) => p.id.toString() === selectedPodId)
            ?.whatsapp_number && (
            <p className="text-xs text-yellow-400">
              ⚠️ Selected pod does not have a WhatsApp number configured
            </p>
          )}

        {/* Extra WhatsApp Numbers */}
        {notifyWhatsapp && (
          <div className="space-y-2">
            <label className="block text-sm text-white/70">
              Extra WhatsApp Numbers (Optional)
            </label>
            <p className="text-xs text-white/40">
              Add custom WhatsApp numbers to also receive notifications
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter WhatsApp number (e.g., +1234567890)"
                value={newWhatsappNumber}
                onChange={(e) => setNewWhatsappNumber(e.target.value)}
                className="flex-1 border-white/10 bg-zinc-900"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (
                    newWhatsappNumber.trim() &&
                    !extraWhatsappNumbers.includes(newWhatsappNumber.trim())
                  ) {
                    setExtraWhatsappNumbers((prev) => [
                      ...prev,
                      newWhatsappNumber.trim(),
                    ])
                    setNewWhatsappNumber('')
                  }
                }}
                disabled={!newWhatsappNumber.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {extraWhatsappNumbers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {extraWhatsappNumbers.map((number) => (
                  <span
                    key={number}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70"
                  >
                    <code className="font-mono text-green-400">
                      {number.length > 15
                        ? `${number.slice(0, 8)}...${number.slice(-4)}`
                        : number}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        setExtraWhatsappNumbers((prev) =>
                          prev.filter((n) => n !== number),
                        )
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
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : editRule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  )
}
