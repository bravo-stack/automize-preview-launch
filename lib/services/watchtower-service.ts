import { createAdminClient } from '@/lib/db/admin'
import type {
  AlertQueryParams,
  AlertSortBy,
  RuleQueryParams,
  RuleSortBy,
  WatchtowerAlertWithRelations,
  WatchtowerRuleWithRelations,
  WatchtowerStats,
} from '@/types/watchtower'
import type { Severity, TargetTable } from '@/types/api-storage'

// ============================================================================
// Data Fetching Service (Vanilla Supabase - No Server Actions)
// ============================================================================

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

  let query = db
    .from('watchtower_alerts')
    .select(
      `
      *,
      rule:watchtower_rules!inner (
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
    .is('rule.deleted_at', null)

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
      db
        .from('watchtower_alerts')
        .select('id, severity, is_acknowledged, watchtower_rules!inner(id)')
        .is('watchtower_rules.deleted_at', null),
      db
        .from('watchtower_alerts')
        .select('id, watchtower_rules!inner(id)')
        .is('watchtower_rules.deleted_at', null)
        .gte('created_at', startOfDay),
      db
        .from('watchtower_alerts')
        .select('id, watchtower_rules!inner(id)')
        .is('watchtower_rules.deleted_at', null)
        .gte('created_at', startOfWeek),
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
    urgentAlerts: alerts.filter((a) => a.severity === 'urgent').length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
    warningAlerts: alerts.filter((a) => a.severity === 'warning').length,
    infoAlerts: alerts.filter((a) => a.severity === 'info').length,
    alertsToday: todayAlerts.length,
    alertsThisWeek: weekAlerts.length,
  }
}
