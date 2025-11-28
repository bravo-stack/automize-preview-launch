'use server'

import type {
  RuleCondition,
  Severity,
  WatchtowerAlert,
  WatchtowerAlertWithRule,
  WatchtowerRule,
} from '../../types/api-responses'
import { createAdminClient } from '../db/admin'

export async function createRule(
  sourceId: string,
  name: string,
  fieldName: string,
  condition: RuleCondition,
  thresholdValue: string | null,
  options: { description?: string; severity?: Severity } = {},
): Promise<WatchtowerRule | null> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('watchtower_rules')
    .insert({
      source_id: sourceId,
      name: name,
      description: options.description || null,
      field_name: fieldName,
      condition: condition,
      threshold_value: thresholdValue,
      severity: options.severity || 'warning',
      is_active: true,
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
  updates: Partial<
    Pick<
      WatchtowerRule,
      | 'name'
      | 'description'
      | 'field_name'
      | 'condition'
      | 'threshold_value'
      | 'severity'
      | 'is_active'
    >
  >,
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

export async function getRules(sourceId?: string): Promise<WatchtowerRule[]> {
  const db = createAdminClient()
  let query = db.from('watchtower_rules').select('*').eq('is_active', true)

  if (sourceId) query = query.eq('source_id', sourceId)

  const { data, error } = await query
  if (error) return []
  return data || []
}

export async function createAlert(
  ruleId: string,
  snapshotId: string,
  severity: Severity,
  message: string,
  currentValue: string | null,
  previousValue?: string | null,
  recordId?: string,
): Promise<WatchtowerAlert | null> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('watchtower_alerts')
    .insert({
      rule_id: ruleId,
      snapshot_id: snapshotId,
      record_id: recordId || null,
      severity,
      message,
      current_value: currentValue,
      previous_value: previousValue || null,
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
  options: { sourceId?: string; acknowledged?: boolean } = {},
): Promise<WatchtowerAlertWithRule[]> {
  const db = createAdminClient()
  let query = db
    .from('watchtower_alerts')
    .select('*, rule:watchtower_rules(*)')
    .order('created_at', { ascending: false })

  if (options.acknowledged !== undefined) {
    query = query.eq('is_acknowledged', options.acknowledged)
  }

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

export async function getAlertStats(days: number = 30): Promise<{
  total: number
  by_severity: Record<Severity, number>
  acknowledged: number
}> {
  const db = createAdminClient()
  const startDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString()

  const { data, error } = await db
    .from('watchtower_alerts')
    .select('severity, is_acknowledged')
    .gte('created_at', startDate)

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
