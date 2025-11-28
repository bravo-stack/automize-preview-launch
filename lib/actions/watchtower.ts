'use server'

import type {
  DependencyCondition,
  LogicOperator,
  NotifySchedule,
  RuleCondition,
  Severity,
  TargetTable,
  WatchtowerAlert,
  WatchtowerAlertWithRule,
  WatchtowerRule,
} from '../../types/api-responses'
import { createAdminClient } from '../db/admin'

// ============================================================================
// Rule Input Type
// ============================================================================

export interface CreateRuleInput {
  // Required
  name: string
  field_name: string
  condition: RuleCondition
  // Targeting (at least one required)
  source_id?: string
  target_table?: TargetTable
  client_id?: number
  // Optional
  description?: string
  threshold_value?: string
  severity?: Severity
  // Dependencies & compound rules
  parent_rule_id?: string
  dependency_condition?: DependencyCondition
  logic_operator?: LogicOperator
  group_id?: string
  // Notifications
  notify_immediately?: boolean
  notify_schedule?: NotifySchedule
  notify_time?: string
  notify_day_of_week?: number
  notify_discord?: boolean
  notify_email?: boolean
  discord_channel_id?: string
  email_recipients?: string[]
}

// ============================================================================
// Rule Operations
// ============================================================================

export async function createRule(
  input: CreateRuleInput,
): Promise<WatchtowerRule | null> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('watchtower_rules')
    .insert({
      source_id: input.source_id || null,
      target_table: input.target_table || null,
      client_id: input.client_id || null,
      name: input.name,
      description: input.description || null,
      field_name: input.field_name,
      condition: input.condition,
      threshold_value: input.threshold_value || null,
      severity: input.severity || 'warning',
      is_active: true,
      // Dependencies
      parent_rule_id: input.parent_rule_id || null,
      dependency_condition: input.dependency_condition || null,
      // Compound rules
      logic_operator: input.logic_operator || 'AND',
      group_id: input.group_id || null,
      // Notifications
      notify_immediately: input.notify_immediately ?? true,
      notify_schedule: input.notify_schedule || null,
      notify_time: input.notify_time || null,
      notify_day_of_week: input.notify_day_of_week ?? null,
      notify_discord: input.notify_discord || false,
      notify_email: input.notify_email || false,
      discord_channel_id: input.discord_channel_id || null,
      email_recipients: input.email_recipients || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating rule:', error)
    return null
  }
  return data
}

export async function updateRule(
  ruleId: string,
  updates: Partial<Omit<WatchtowerRule, 'id' | 'created_at' | 'updated_at'>>,
): Promise<boolean> {
  const db = createAdminClient()
  const { error } = await db
    .from('watchtower_rules')
    .update(updates)
    .eq('id', ruleId)

  if (error) {
    console.error('Error updating rule:', error)
    return false
  }
  return true
}

export async function deleteRule(ruleId: string): Promise<boolean> {
  const db = createAdminClient()
  const { error } = await db.from('watchtower_rules').delete().eq('id', ruleId)

  if (error) {
    console.error('Error deleting rule:', error)
    return false
  }
  return true
}

export async function getRules(
  options: {
    sourceId?: string
    clientId?: number
    targetTable?: TargetTable
    groupId?: string
    includeInactive?: boolean
  } = {},
): Promise<WatchtowerRule[]> {
  const db = createAdminClient()
  let query = db.from('watchtower_rules').select('*')

  if (!options.includeInactive) {
    query = query.eq('is_active', true)
  }
  if (options.sourceId) query = query.eq('source_id', options.sourceId)
  if (options.clientId) query = query.eq('client_id', options.clientId)
  if (options.targetTable) query = query.eq('target_table', options.targetTable)
  if (options.groupId) query = query.eq('group_id', options.groupId)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

// Get rules that depend on a specific parent rule
export async function getDependentRules(
  parentRuleId: string,
): Promise<WatchtowerRule[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('watchtower_rules')
    .select('*')
    .eq('parent_rule_id', parentRuleId)
    .eq('is_active', true)

  if (error) return []
  return data || []
}

// Get all rules in a compound group
export async function getCompoundRules(
  groupId: string,
): Promise<WatchtowerRule[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('watchtower_rules')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .order('created_at')

  if (error) return []
  return data || []
}

export async function createAlert(
  ruleId: string,
  snapshotId: string,
  severity: Severity,
  message: string,
  currentValue: string | null,
  options: {
    previousValue?: string
    recordId?: string
    clientId?: number
  } = {},
): Promise<WatchtowerAlert | null> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('watchtower_alerts')
    .insert({
      rule_id: ruleId,
      snapshot_id: snapshotId,
      record_id: options.recordId || null,
      client_id: options.clientId || null,
      severity,
      message,
      current_value: currentValue,
      previous_value: options.previousValue || null,
      is_acknowledged: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating alert:', error)
    return null
  }
  return data
}

export async function getAlerts(
  options: {
    clientId?: number
    ruleId?: string
    acknowledged?: boolean
    severity?: Severity
    limit?: number
  } = {},
): Promise<WatchtowerAlertWithRule[]> {
  const db = createAdminClient()
  let query = db
    .from('watchtower_alerts')
    .select('*, rule:watchtower_rules(*)')
    .order('created_at', { ascending: false })

  if (options.clientId) query = query.eq('client_id', options.clientId)
  if (options.ruleId) query = query.eq('rule_id', options.ruleId)
  if (options.acknowledged !== undefined) {
    query = query.eq('is_acknowledged', options.acknowledged)
  }
  if (options.severity) query = query.eq('severity', options.severity)
  if (options.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) return []
  return (data || []) as WatchtowerAlertWithRule[]
}

export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy?: string,
): Promise<boolean> {
  const db = createAdminClient()
  const { error } = await db
    .from('watchtower_alerts')
    .update({
      is_acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: acknowledgedBy || null,
    })
    .eq('id', alertId)

  if (error) {
    console.error('Error acknowledging alert:', error)
    return false
  }
  return true
}

export function evaluateRule(
  rule: WatchtowerRule,
  currentValue: string | number,
  previousValue?: string | number,
): boolean {
  const threshold = rule.threshold_value
  const current =
    typeof currentValue === 'string' ? currentValue : String(currentValue)
  const currentNum = Number(currentValue)
  const thresholdNum = threshold ? Number(threshold) : 0

  switch (rule.condition) {
    case 'equals':
      return current === threshold
    case 'greater_than':
      return currentNum > thresholdNum
    case 'less_than':
      return currentNum < thresholdNum
    case 'changed':
      return previousValue !== undefined && current !== String(previousValue)
    case 'contains':
      return threshold ? current.includes(threshold) : false
    default:
      return false
  }
}

export async function getAlertStats(
  options: { clientId?: number; days?: number } = {},
): Promise<{
  total: number
  by_severity: Record<Severity, number>
  acknowledged: number
}> {
  const db = createAdminClient()
  const days = options.days ?? 30
  const startDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString()

  let query = db
    .from('watchtower_alerts')
    .select('severity, is_acknowledged')
    .gte('created_at', startDate)

  if (options.clientId) query = query.eq('client_id', options.clientId)

  const { data, error } = await query

  if (error || !data) {
    return {
      total: 0,
      by_severity: { info: 0, warning: 0, critical: 0 },
      acknowledged: 0,
    }
  }

  return {
    total: data.length,
    by_severity: {
      info: data.filter((a) => a.severity === 'info').length,
      warning: data.filter((a) => a.severity === 'warning').length,
      critical: data.filter((a) => a.severity === 'critical').length,
    },
    acknowledged: data.filter((a) => a.is_acknowledged).length,
  }
}

// ============================================================================
// Rule Dependency & Compound Rule Helpers
// ============================================================================

/**
 * Check if a rule's dependency condition is satisfied
 */
export async function checkRuleDependency(
  rule: WatchtowerRule,
): Promise<boolean> {
  if (!rule.parent_rule_id || !rule.dependency_condition) {
    return true // No dependency, always satisfied
  }

  const db = createAdminClient()

  // Get recent alerts for parent rule (last 24 hours)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: parentAlerts } = await db
    .from('watchtower_alerts')
    .select('is_acknowledged')
    .eq('rule_id', rule.parent_rule_id)
    .gte('created_at', cutoff)

  const hasTriggered = parentAlerts && parentAlerts.length > 0
  const hasAcknowledged = parentAlerts?.some((a) => a.is_acknowledged)

  switch (rule.dependency_condition) {
    case 'triggered':
      return hasTriggered === true
    case 'not_triggered':
      return hasTriggered === false
    case 'acknowledged':
      return hasAcknowledged === true
    default:
      return true
  }
}

/**
 * Evaluate a compound rule (multiple conditions with same group_id)
 */
export async function evaluateCompoundRule(
  groupId: string,
  valuesByField: Record<string, string | number>,
): Promise<boolean> {
  const rules = await getCompoundRules(groupId)
  if (rules.length === 0) return false

  let result = true
  for (const rule of rules) {
    const value = valuesByField[rule.field_name]
    if (value === undefined) continue

    const conditionMet = evaluateRule(rule, value)

    if (rule.logic_operator === 'AND') {
      result = result && conditionMet
    } else {
      result = result || conditionMet
    }
  }

  return result
}
