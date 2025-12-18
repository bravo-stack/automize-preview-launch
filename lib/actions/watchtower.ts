'use server'

import type {
  AlertQueryParams,
  CompoundRuleInput,
  DependencyCondition,
  LogicOperator,
  NotifySchedule,
  RuleCondition,
  RuleQueryParams,
  Severity,
  TargetTable,
  WatchtowerAlert,
  WatchtowerAlertWithRelations,
  WatchtowerRule,
  WatchtowerRuleWithRelations,
  WatchtowerStats,
} from '@/types/watchtower'
import { createAdminClient } from '../db/admin'

// ============================================================================
// Helper Functions
// ============================================================================

function generateGroupId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

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
  // Time range (number of days to look back, null = all time, 0 = today)
  time_range_days?: number | null
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
  discord_channel_id?: string
  // Support for multiple extra Discord channel IDs
  extra_discord_channel_ids?: string[]
  notify_whatsapp?: boolean
  pod_id?: string
  // Support for multiple pods
  pod_ids?: string[]
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
      time_range_days: input.time_range_days ?? null, // null = all time
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
      discord_channel_id: input.discord_channel_id || null,
      // TODO: Add these columns to DB schema first:
      extra_discord_channel_ids: input.extra_discord_channel_ids || null,
      notify_whatsapp: input.notify_whatsapp || false,
      pod_id: input.pod_id || null,
      pod_ids: input.pod_ids || null,
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
  const { error } = await db
    .from('watchtower_rules')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId)

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
  let query = db.from('watchtower_rules').select('*').is('deleted_at', null)

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
    .is('deleted_at', null)
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
    .is('deleted_at', null)
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
    skipSnapshotValidation?: boolean
  } = {},
): Promise<WatchtowerAlert | null> {
  const db = createAdminClient()

  // ============================================================================
  // Duplicate Alert Detection
  // Prevent creating duplicate alerts for the same rule + value + message
  // Only one unacknowledged alert per unique (rule_id, current_value, message)
  // This ensures: if 10 records match a rule, exactly 10 alerts are created
  // ============================================================================
  const { data: existingAlert } = await db
    .from('watchtower_alerts')
    .select('id')
    .eq('rule_id', ruleId)
    .eq('current_value', currentValue)
    .eq('message', message)
    .eq('is_acknowledged', false)
    .limit(1)
    .single()

  if (existingAlert) {
    // Duplicate found - skip creating new alert
    return null
  }

  // Determine the effective snapshot_id to use
  let effectiveSnapshotId: string | null = snapshotId

  // If skipSnapshotValidation is true, we need to find a valid api_snapshot
  // because the FK constraint requires a valid api_snapshots.id
  if (options.skipSnapshotValidation === true) {
    // Get the most recent api_snapshot as a fallback
    const { data: latestSnapshot } = await db
      .from('api_snapshots')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    effectiveSnapshotId = latestSnapshot?.id || null
  } else {
    // Check if this snapshot_id exists in api_snapshots
    const { data: apiSnapshot } = await db
      .from('api_snapshots')
      .select('id')
      .eq('id', snapshotId)
      .single()

    // If not found in api_snapshots, try to find a recent api_snapshot to use
    if (!apiSnapshot) {
      const { data: latestSnapshot } = await db
        .from('api_snapshots')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      effectiveSnapshotId = latestSnapshot?.id || null
    }
  }

  // If we still don't have a valid snapshot_id and it's required, fail gracefully
  if (!effectiveSnapshotId) {
    console.error('[createAlert] No valid api_snapshot found for FK constraint')
    ;(globalThis as any).__lastAlertError = {
      message: 'No valid api_snapshot found for FK constraint',
      details: `Original snapshotId: ${snapshotId}, skipValidation: ${options.skipSnapshotValidation}`,
      code: 'NO_VALID_SNAPSHOT',
      hint: 'Ensure at least one api_snapshot exists in the database',
    }
    return null
  }

  const insertData = {
    rule_id: ruleId,
    snapshot_id: effectiveSnapshotId,
    record_id: options.recordId || null,
    client_id: options.clientId || null,
    severity,
    message,
    current_value: currentValue,
    previous_value: options.previousValue || null,
    is_acknowledged: false,
  }

  const { data, error } = await db
    .from('watchtower_alerts')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error(
      '[createAlert] Error creating alert:',
      error.message,
      error.details,
      error.code,
      error.hint,
    )
    ;(globalThis as any).__lastAlertError = {
      message: error.message,
      details: error.details,
      code: error.code,
      hint: error.hint,
    }
    return null
  }
  return data
}

// Helper to get last alert error for debugging
export async function getLastAlertError(): Promise<{
  message: string
  details: string
  code: string
  hint: string
} | null> {
  return (globalThis as any).__lastAlertError || null
}

export async function getAlerts(
  options: {
    clientId?: number
    ruleId?: string
    acknowledged?: boolean
    severity?: Severity
    limit?: number
  } = {},
): Promise<WatchtowerAlertWithRelations[]> {
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
  return (data || []) as WatchtowerAlertWithRelations[]
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

export async function evaluateRule(
  rule: WatchtowerRule,
  currentValue: string | number,
  previousValue?: string | number,
): Promise<boolean> {
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

    const conditionMet = await evaluateRule(rule, value)

    if (rule.logic_operator === 'AND') {
      result = result && conditionMet
    } else {
      result = result || conditionMet
    }
  }

  return result
}

// ============================================================================
// Extended CRUD Operations for Full Watchtower Feature
// ============================================================================

/**
 * Create a compound rule with multiple clauses
 * All clauses share the same group_id and notification settings
 */
export async function createCompoundRule(
  input: CompoundRuleInput,
): Promise<WatchtowerRule[]> {
  const db = createAdminClient()
  const groupId = generateGroupId()

  const rulesToInsert = input.clauses.map((clause, index) => ({
    source_id: input.source_id || null,
    client_id: input.client_id || null,
    target_table: input.target_table || null,
    name: index === 0 ? input.name : `${input.name} - Clause ${index + 1}`,
    description: input.description || null,
    field_name: clause.field_name,
    condition: clause.condition,
    threshold_value: clause.threshold_value || null,
    time_range_days: input.time_range_days ?? null, // null = all time
    parent_rule_id: input.parent_rule_id || null,
    dependency_condition: input.dependency_condition || null,
    logic_operator: input.logic_operator,
    group_id: groupId,
    severity: input.severity || 'warning',
    is_active: input.is_active ?? true,
    notify_immediately: input.notify_immediately ?? true,
    notify_schedule: input.notify_schedule || null,
    notify_time: input.notify_time || null,
    notify_day_of_week: input.notify_day_of_week ?? null,
    notify_discord: input.notify_discord ?? false,
    discord_channel_id: input.discord_channel_id || null,
    // TODO: Add these columns to DB schema first:
    extra_discord_channel_ids: input.extra_discord_channel_ids || null,
    notify_whatsapp: input.notify_whatsapp ?? false,
    pod_id: input.pod_id || null,
    pod_ids: input.pod_ids || null,
  }))

  const { data, error } = await db
    .from('watchtower_rules')
    .insert(rulesToInsert)
    .select()

  if (error) {
    console.error('Error creating compound rule:', error)
    return []
  }

  return data || []
}

/**
 * Get a single rule by ID with full relations
 */
export async function getRuleById(
  ruleId: string,
): Promise<WatchtowerRuleWithRelations | null> {
  const db = createAdminClient()

  const { data: rule, error } = await db
    .from('watchtower_rules')
    .select(
      `
      *,
      source:api_sources (
        id,
        provider,
        display_name
      )
    `,
    )
    .is('deleted_at', null)
    .eq('id', ruleId)
    .single()

  if (error) {
    console.error('Error fetching rule:', error)
    return null
  }

  // If rule has a group_id, fetch sibling rules
  if (rule?.group_id) {
    const { data: groupRules } = await db
      .from('watchtower_rules')
      .select('*')
      .is('deleted_at', null)
      .eq('group_id', rule.group_id)
      .neq('id', ruleId)

    return {
      ...rule,
      group_rules: groupRules || [],
    } as WatchtowerRuleWithRelations
  }

  // Fetch child rules (rules that depend on this rule)
  const { data: childRules } = await db
    .from('watchtower_rules')
    .select('*')
    .is('deleted_at', null)
    .eq('parent_rule_id', ruleId)

  return {
    ...rule,
    child_rules: childRules || [],
  } as WatchtowerRuleWithRelations
}

/**
 * Get all rules with pagination and filtering (enhanced version)
 */
export async function getRulesPaginated(
  params: RuleQueryParams = {},
): Promise<{ rules: WatchtowerRuleWithRelations[]; total: number }> {
  const db = createAdminClient()
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const sortBy = params.sortBy || 'created_desc'
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = db
    .from('watchtower_rules')
    .select(
      `
      *,
      source:api_sources (
        id,
        provider,
        display_name
      )
    `,
      { count: 'exact' },
    )
    .is('deleted_at', null)

  // Apply sorting
  switch (sortBy) {
    case 'name_asc':
      query = query.order('name', { ascending: true })
      break
    case 'name_desc':
      query = query.order('name', { ascending: false })
      break
    case 'created_asc':
      query = query.order('created_at', { ascending: true })
      break
    case 'triggers_desc':
      query = query.order('trigger_count', { ascending: false })
      break
    case 'created_desc':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  // Apply filters
  if (params.source_id) query = query.eq('source_id', params.source_id)
  if (params.client_id) query = query.eq('client_id', params.client_id)
  if (params.target_table) query = query.eq('target_table', params.target_table)
  if (params.is_active !== undefined)
    query = query.eq('is_active', params.is_active)
  if (params.severity) query = query.eq('severity', params.severity)
  if (params.group_id) query = query.eq('group_id', params.group_id)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching rules:', error)
    return { rules: [], total: 0 }
  }

  return {
    rules: (data || []) as WatchtowerRuleWithRelations[],
    total: count || 0,
  }
}

/**
 * Get all alerts with pagination and filtering (enhanced version)
 */
export async function getAlertsPaginated(
  params: AlertQueryParams = {},
): Promise<{ alerts: WatchtowerAlertWithRelations[]; total: number }> {
  const db = createAdminClient()
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const sortBy = params.sortBy || 'created_desc'
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = db.from('watchtower_alerts').select(
    `
      *,
      rule:watchtower_rules (
        id,
        name,
        severity,
        field_name,
        condition,
        threshold_value,
        time_range_days,
        target_table,
        source:api_sources (
          id,
          provider,
          display_name
        )
      )
    `,
    { count: 'exact' },
  )

  // Apply sorting
  switch (sortBy) {
    case 'created_asc':
      query = query.order('created_at', { ascending: true })
      break
    case 'severity_desc':
      // Order by severity (critical first, then warning, then info)
      query = query
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false })
      break
    case 'created_desc':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  // Apply filters
  if (params.rule_id) query = query.eq('rule_id', params.rule_id)
  if (params.snapshot_id) query = query.eq('snapshot_id', params.snapshot_id)
  if (params.client_id) query = query.eq('client_id', params.client_id)
  if (params.severity) query = query.eq('severity', params.severity)
  if (params.is_acknowledged !== undefined)
    query = query.eq('is_acknowledged', params.is_acknowledged)
  if (params.start_date) query = query.gte('created_at', params.start_date)
  if (params.end_date) query = query.lte('created_at', params.end_date)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching alerts:', error)
    return { alerts: [], total: 0 }
  }

  return {
    alerts: (data || []) as WatchtowerAlertWithRelations[],
    total: count || 0,
  }
}

/**
 * Toggle rule active status
 */
export async function toggleRuleActive(
  ruleId: string,
  isActive: boolean,
): Promise<boolean> {
  const db = createAdminClient()

  const { error } = await db
    .from('watchtower_rules')
    .update({ is_active: isActive })
    .eq('id', ruleId)

  if (error) {
    console.error('Error toggling rule:', error)
    return false
  }

  return true
}

/**
 * Delete a rule (and all rules in its group if compound)
 */
export async function deleteRuleWithGroup(
  ruleId: string,
  deleteGroup = false,
): Promise<boolean> {
  const db = createAdminClient()

  // If deleteGroup is true and rule has a group_id, delete all rules in the group
  if (deleteGroup) {
    const { data: rule } = await db
      .from('watchtower_rules')
      .select('group_id')
      .is('deleted_at', null)
      .eq('id', ruleId)
      .single()

    if (rule?.group_id) {
      const { error } = await db
        .from('watchtower_rules')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('group_id', rule.group_id)

      if (error) {
        console.error('Error deleting rule group:', error)
        return false
      }
      return true
    }
  }

  // Delete single rule
  const { error } = await db
    .from('watchtower_rules')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId)

  if (error) {
    console.error('Error deleting rule:', error)
    return false
  }

  return true
}

// ============================================================================
// Deleted Rules Management
// ============================================================================

/**
 * Get all deleted rules with pagination
 */
export async function getDeletedRulesPaginated(
  params: RuleQueryParams = {},
): Promise<{ rules: WatchtowerRuleWithRelations[]; total: number }> {
  const db = createAdminClient()
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = db
    .from('watchtower_rules')
    .select(
      `
      *,
      source:api_sources (
        id,
        provider,
        display_name
      )
    `,
      { count: 'exact' },
    )
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  // Apply filters
  if (params.source_id) query = query.eq('source_id', params.source_id)
  if (params.client_id) query = query.eq('client_id', params.client_id)
  if (params.target_table) query = query.eq('target_table', params.target_table)
  if (params.severity) query = query.eq('severity', params.severity)
  if (params.group_id) query = query.eq('group_id', params.group_id)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching deleted rules:', error)
    return { rules: [], total: 0 }
  }

  return {
    rules: (data || []) as WatchtowerRuleWithRelations[],
    total: count || 0,
  }
}

/**
 * Restore a soft-deleted rule (and all rules in its group if compound)
 */
export async function restoreRule(
  ruleId: string,
  restoreGroup = false,
): Promise<boolean> {
  const db = createAdminClient()

  // If restoreGroup is true and rule has a group_id, restore all rules in the group
  if (restoreGroup) {
    const { data: rule } = await db
      .from('watchtower_rules')
      .select('group_id')
      .not('deleted_at', 'is', null)
      .eq('id', ruleId)
      .single()

    if (rule?.group_id) {
      const { error } = await db
        .from('watchtower_rules')
        .update({
          deleted_at: null,
          deleted_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('group_id', rule.group_id)

      if (error) {
        console.error('Error restoring rule group:', error)
        return false
      }
      return true
    }
  }

  // Restore single rule
  const { error } = await db
    .from('watchtower_rules')
    .update({
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId)

  if (error) {
    console.error('Error restoring rule:', error)
    return false
  }

  return true
}

/**
 * Hard delete a rule permanently (only allowed after 30 days of soft deletion)
 */
export async function hardDeleteRule(
  ruleId: string,
  deleteGroup = false,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // First, verify the rule is eligible for hard deletion
  const { data: rule, error: fetchError } = await db
    .from('watchtower_rules')
    .select('id, group_id, deleted_at')
    .eq('id', ruleId)
    .not('deleted_at', 'is', null)
    .single()

  if (fetchError || !rule) {
    return { success: false, error: 'Rule not found or not deleted' }
  }

  const deletedAt = new Date(rule.deleted_at)
  if (deletedAt > thirtyDaysAgo) {
    const daysRemaining = Math.ceil(
      (deletedAt.getTime() - thirtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000),
    )
    return {
      success: false,
      error: `Cannot permanently delete yet. ${daysRemaining} day(s) remaining until eligible for permanent deletion.`,
    }
  }

  // If deleteGroup is true and rule has a group_id, hard delete all rules in the group
  if (deleteGroup && rule.group_id) {
    // Verify all group rules are eligible for hard deletion
    const { data: groupRules, error: groupFetchError } = await db
      .from('watchtower_rules')
      .select('id, deleted_at')
      .eq('group_id', rule.group_id)
      .not('deleted_at', 'is', null)

    if (groupFetchError) {
      return { success: false, error: 'Failed to fetch group rules' }
    }

    // Check if all group rules are old enough
    const ineligibleRules = groupRules?.filter(
      (r) => new Date(r.deleted_at) > thirtyDaysAgo,
    )
    if (ineligibleRules && ineligibleRules.length > 0) {
      return {
        success: false,
        error: `Cannot permanently delete group. ${ineligibleRules.length} rule(s) are not yet eligible.`,
      }
    }

    const { error } = await db
      .from('watchtower_rules')
      .delete()
      .eq('group_id', rule.group_id)

    if (error) {
      console.error('Error hard deleting rule group:', error)
      return {
        success: false,
        error: 'Failed to permanently delete rule group',
      }
    }
    return { success: true }
  }

  // Hard delete single rule
  const { error } = await db.from('watchtower_rules').delete().eq('id', ruleId)

  if (error) {
    console.error('Error hard deleting rule:', error)
    return { success: false, error: 'Failed to permanently delete rule' }
  }

  return { success: true }
}

/**
 * Bulk acknowledge alerts
 */
export async function bulkAcknowledgeAlerts(
  alertIds: string[],
  acknowledgedBy: string,
): Promise<number> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('watchtower_alerts')
    .update({
      is_acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: acknowledgedBy,
    })
    .in('id', alertIds)
    .select('id')

  if (error) {
    console.error('Error bulk acknowledging alerts:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string): Promise<boolean> {
  const db = createAdminClient()

  const { error } = await db
    .from('watchtower_alerts')
    .delete()
    .eq('id', alertId)

  if (error) {
    console.error('Error deleting alert:', error)
    return false
  }

  return true
}

/**
 * Get Watchtower statistics
 * Note: Compound rules (multiple clauses with same group_id) are counted as one rule
 */
export async function getWatchtowerStats(): Promise<WatchtowerStats> {
  const db = createAdminClient()

  const now = new Date()
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - dayOfWeek,
  ).toISOString()

  const [rulesRes, alertsRes, todayAlertsRes, weekAlertsRes] =
    await Promise.all([
      db
        .from('watchtower_rules')
        .select('id, is_active, group_id')
        .is('deleted_at', null),
      db.from('watchtower_alerts').select('id, severity, is_acknowledged'),
      db.from('watchtower_alerts').select('id').gte('created_at', startOfDay),
      db.from('watchtower_alerts').select('id').gte('created_at', startOfWeek),
    ])

  const rules = rulesRes.data || []
  const alerts = alertsRes.data || []
  const todayAlerts = todayAlertsRes.data || []
  const weekAlerts = weekAlertsRes.data || []

  // Helper to check if a rule has a valid group_id (not null, undefined, or empty string)
  const hasGroupId = (r: { group_id: string | null }): boolean =>
    r.group_id !== null && r.group_id !== undefined && r.group_id !== ''

  // Count unique rules: standalone rules (no group_id) + unique group_ids
  // For compound rules, multiple rows share the same group_id - count once per group
  const standaloneRules = rules.filter((r) => !hasGroupId(r))
  const groupedRuleIds = new Set(
    rules.filter((r) => hasGroupId(r)).map((r) => r.group_id),
  )

  // For counting active/inactive, we need to check the main rule of each group
  // Get unique rules: standalone + first rule of each group
  const seenGroups = new Set<string>()
  const uniqueRules = rules.filter((r) => {
    if (!hasGroupId(r)) return true // Standalone rule
    if (seenGroups.has(r.group_id!)) return false // Already counted this group
    seenGroups.add(r.group_id!)
    return true
  })

  const totalUniqueRules = standaloneRules.length + groupedRuleIds.size
  const activeUniqueRules = uniqueRules.filter((r) => r.is_active).length
  const inactiveUniqueRules = uniqueRules.filter((r) => !r.is_active).length

  return {
    totalRules: totalUniqueRules,
    activeRules: activeUniqueRules,
    inactiveRules: inactiveUniqueRules,
    totalAlerts: alerts.length,
    unacknowledgedAlerts: alerts.filter((a) => !a.is_acknowledged).length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
    warningAlerts: alerts.filter((a) => a.severity === 'warning').length,
    infoAlerts: alerts.filter((a) => a.severity === 'info').length,
    alertsToday: todayAlerts.length,
    alertsThisWeek: weekAlerts.length,
  }
}

/**
 * Get all rules available as potential parent rules
 */
export async function getAvailableParentRules(
  excludeRuleId?: string,
): Promise<WatchtowerRule[]> {
  const db = createAdminClient()

  let query = db
    .from('watchtower_rules')
    .select('*')
    .is('deleted_at', null)
    .eq('is_active', true)
    .is('group_id', null)
    .order('name')

  if (excludeRuleId) {
    query = query.neq('id', excludeRuleId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching available parent rules:', error)
    return []
  }

  return data || []
}

/**
 * Get all API sources for rule targeting
 */
export async function getApiSourcesForRules(): Promise<
  Array<{ id: string; provider: string; display_name: string }>
> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('api_sources')
    .select('id, provider, display_name')
    .eq('is_active', true)
    .order('display_name')

  if (error) {
    console.error('Error fetching API sources:', error)
    return []
  }

  return data || []
}

/**
 * Update the last notified timestamp for a rule
 */
export async function updateRuleLastNotified(ruleId: string): Promise<boolean> {
  const db = createAdminClient()

  const { error } = await db
    .from('watchtower_rules')
    .update({ last_notified_at: new Date().toISOString() })
    .eq('id', ruleId)

  if (error) {
    console.error('Error updating last notified:', error)
    return false
  }

  return true
}

/**
 * Update the trigger tracking for a rule (last_triggered_at and increment trigger_count)
 */
export async function updateRuleTriggerTracking(
  ruleId: string,
): Promise<boolean> {
  const db = createAdminClient()

  // First get current trigger count
  const { data: rule, error: fetchError } = await db
    .from('watchtower_rules')
    .select('trigger_count')
    .is('deleted_at', null)
    .eq('id', ruleId)
    .single()

  if (fetchError) {
    console.error('Error fetching rule for trigger tracking:', fetchError)
    return false
  }

  const currentCount = rule?.trigger_count || 0

  const { error } = await db
    .from('watchtower_rules')
    .update({
      last_triggered_at: new Date().toISOString(),
      trigger_count: currentCount + 1,
    })
    .eq('id', ruleId)

  if (error) {
    console.error('Error updating trigger tracking:', error)
    return false
  }

  return true
}
