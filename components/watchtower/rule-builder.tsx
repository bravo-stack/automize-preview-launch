'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  DEPENDENCY_CONDITIONS,
  LOGIC_OPERATORS,
  NOTIFY_SCHEDULES,
  RULE_CONDITIONS,
  SEVERITY_LEVELS,
  TABLE_FIELDS,
  TARGET_TABLES,
  type CompoundRuleInput,
  type CreateRuleInput,
  type FieldDefinition,
  type RuleClause,
  type RuleCondition,
  type WatchtowerRule,
} from '@/types/watchtower'
import { AlertTriangle, Info, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

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

interface Pod {
  id: number
  name: string
  discord_id: string | null
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

  // Single rule fields
  const [fieldName, setFieldName] = useState('')
  const [condition, setCondition] = useState<string>('greater_than')
  const [thresholdValue, setThresholdValue] = useState('')

  // Compound rule clauses
  const [clauses, setClauses] = useState<RuleClause[]>([])

  // Notification settings
  const [notifyImmediately, setNotifyImmediately] = useState(true)
  const [notifySchedule, setNotifySchedule] = useState<string>('')
  const [notifyTime, setNotifyTime] = useState('')
  const [notifyDayOfWeek, setNotifyDayOfWeek] = useState<string>('')
  const [notifyDiscord, setNotifyDiscord] = useState(false)
  const [selectedPodId, setSelectedPodId] = useState<string>('')

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
      setFieldName(editRule.field_name)
      setCondition(editRule.condition)
      setThresholdValue(editRule.threshold_value || '')
      setNotifyImmediately(editRule.notify_immediately)
      setNotifySchedule(editRule.notify_schedule || '')
      setNotifyTime(editRule.notify_time || '')
      setNotifyDayOfWeek(editRule.notify_day_of_week?.toString() || '')
      setNotifyDiscord(editRule.notify_discord)
      setSelectedPodId(editRule.pod_id || '')
      setParentRuleId(editRule.parent_rule_id || '')
      setDependencyCondition(editRule.dependency_condition || '')

      // If editing a grouped rule, it's compound
      setIsCompound(!!editRule.group_id)
    }
  }, [editRule])

  const addClause = useCallback(() => {
    setClauses((prev) => [
      ...prev,
      {
        id: `clause_${Date.now()}`,
        field_name: '',
        condition: 'greater_than' as RuleCondition,
        threshold_value: null,
      },
    ])
  }, [])

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

    // Get the selected pod's discord_id for notifications
    const selectedPod = availablePods.find(
      (p) => p.id.toString() === selectedPodId,
    )

    const baseData = {
      name,
      description: description || undefined,
      severity: severity as 'info' | 'warning' | 'critical',
      notify_immediately: notifyImmediately,
      notify_schedule: (notifySchedule || undefined) as
        | 'daily'
        | 'weekly'
        | undefined,
      notify_time: notifyTime || undefined,
      notify_day_of_week: notifyDayOfWeek
        ? parseInt(notifyDayOfWeek, 10)
        : undefined,
      notify_discord: notifyDiscord,
      discord_channel_id:
        notifyDiscord && selectedPod?.discord_id
          ? selectedPod.discord_id
          : undefined,
      pod_id: selectedPodId || undefined,
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
              {clauses.map((clause, index) => (
                <div
                  key={clause.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <span className="text-sm font-medium text-white/60">
                    {index + 1}.
                  </span>

                  <Select
                    value={clause.field_name}
                    onChange={(e) =>
                      updateClause(clause.id, 'field_name', e.target.value)
                    }
                    className="flex-1"
                  >
                    <option value="">Select field...</option>
                    {availableFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.label}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={clause.condition}
                    onChange={(e) =>
                      updateClause(clause.id, 'condition', e.target.value)
                    }
                    className="w-40"
                  >
                    {RULE_CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Select>

                  <Input
                    value={clause.threshold_value || ''}
                    onChange={(e) =>
                      updateClause(
                        clause.id,
                        'threshold_value',
                        e.target.value || null,
                      )
                    }
                    placeholder="Value"
                    className="w-32 border-white/10 bg-zinc-900"
                  />

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
              ))}
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
            <Select
              label="Field"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
            >
              <option value="">Select field...</option>
              {availableFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.label}
                </option>
              ))}
            </Select>

            <Select
              label="Condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              {RULE_CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>

            <div>
              <label className="mb-1 block text-sm text-white/70">
                Threshold Value
              </label>
              <Input
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                placeholder="e.g., 1.5"
                className="border-white/10 bg-zinc-900"
              />
            </div>
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
        <h3 className="text-sm font-medium text-white/80">Notifications</h3>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={notifyImmediately}
              onChange={(e) => setNotifyImmediately(e.target.checked)}
              className="rounded border-white/20 bg-zinc-900"
            />
            Notify Immediately
          </label>

          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={notifyDiscord}
              onChange={(e) => setNotifyDiscord(e.target.checked)}
              className="rounded border-white/20 bg-zinc-900"
            />
            Discord
          </label>
        </div>

        {!notifyImmediately && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Schedule"
              value={notifySchedule}
              onChange={(e) => setNotifySchedule(e.target.value)}
            >
              <option value="">Select schedule...</option>
              {NOTIFY_SCHEDULES.map((schedule) => (
                <option key={schedule} value={schedule}>
                  {schedule.charAt(0).toUpperCase() + schedule.slice(1)}
                </option>
              ))}
            </Select>

            <div>
              <label className="mb-1 block text-sm text-white/70">Time</label>
              <Input
                type="time"
                value={notifyTime}
                onChange={(e) => setNotifyTime(e.target.value)}
                className="border-white/10 bg-zinc-900"
              />
            </div>

            {notifySchedule === 'weekly' && (
              <Select
                label="Day of Week"
                value={notifyDayOfWeek}
                onChange={(e) => setNotifyDayOfWeek(e.target.value)}
              >
                <option value="">Select day...</option>
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </Select>
            )}
          </div>
        )}

        {/* Pod Selection for Discord */}
        {notifyDiscord && (
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
                  {pod.discord_id
                    ? ` (Discord: ${pod.discord_id.slice(0, 8)}...)`
                    : ''}
                </option>
              ))}
            </Select>

            {selectedPodId && (
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
            )}

            {/* Warning if selected pod is missing Discord ID */}
            {selectedPodId &&
              !availablePods.find((p) => p.id.toString() === selectedPodId)
                ?.discord_id && (
                <p className="text-xs text-yellow-400">
                  ⚠️ Selected pod does not have a Discord ID configured
                </p>
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
