import {
  checkRuleDependency,
  createAlert,
  getRules,
  getWatchtowerStats,
  updateRuleLastNotified,
  updateRuleTriggerTracking,
} from '@/lib/actions/watchtower'
import { sendAlertNotifications } from '@/lib/actions/watchtower-notifications'
import { createAdminClient } from '@/lib/db/admin'
import {
  evaluateCondition,
  generateAlertMessage,
  getTimeRangeStartDate,
} from '@/lib/utils/watchtower-evaluation'
import type {
  RuleCondition,
  TargetTable,
  WatchtowerAlert as WatchtowerAlertType,
  WatchtowerRule,
  WatchtowerStats,
} from '@/types/watchtower'
import { NextResponse } from 'next/server'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// ============================================================================
// Watchtower Evaluate Endpoint
// ============================================================================
// This endpoint is called by the polling hook to:
// 1. Fetch fresh stats
// 2. Evaluate active rules against latest data
// 3. Create alerts for triggered conditions
// This combines stats fetching with rule evaluation for efficiency.
// ============================================================================

interface EvaluationSummary {
  rulesEvaluated: number
  rulesTriggered: number
  alertsCreated: number
  alertsSkippedDuplicate: number
  tablesChecked: string[]
}

/**
 * Get records from a target table for watchtower evaluation with optional time range filtering
 * @param targetTable - The table to fetch records from
 * @param timeRangeDays - Number of days to look back (null = all time, 0 = today)
 */
async function getTargetTableRecords(
  targetTable: TargetTable,
  timeRangeDays: number | null = null,
): Promise<{ records: Record<string, unknown>[]; snapshotId: string | null }> {
  const db = createAdminClient()
  const startDate = getTimeRangeStartDate(timeRangeDays)

  switch (targetTable) {
    case 'facebook_metrics': {
      // Get autometric snapshots within time range
      let snapshotQuery = db
        .from('sheet_refresh_snapshots')
        .select('id')
        .eq('refresh_type', 'autometric')
        .eq('refresh_status', 'completed')
        .order('snapshot_date', { ascending: false })

      if (startDate) {
        snapshotQuery = snapshotQuery.gte(
          'snapshot_date',
          startDate.toISOString(),
        )
      }

      const { data: snapshots } = await snapshotQuery.limit(startDate ? 100 : 1)

      if (!snapshots || snapshots.length === 0)
        return { records: [], snapshotId: null }

      // For time range queries, get records from all matching snapshots
      const snapshotIds = snapshots.map((s) => s.id)
      const { data: records } = await db
        .from('refresh_snapshot_metrics')
        .select('*')
        .in('snapshot_id', snapshotIds)

      return {
        records: records || [],
        snapshotId: snapshotIds[0],
      }
    }

    case 'finance_metrics': {
      // Get financialx snapshots within time range
      let snapshotQuery = db
        .from('sheet_refresh_snapshots')
        .select('id')
        .eq('refresh_type', 'financialx')
        .eq('refresh_status', 'completed')
        .order('snapshot_date', { ascending: false })

      if (startDate) {
        snapshotQuery = snapshotQuery.gte(
          'snapshot_date',
          startDate.toISOString(),
        )
      }

      const { data: snapshots } = await snapshotQuery.limit(startDate ? 100 : 1)

      if (!snapshots || snapshots.length === 0)
        return { records: [], snapshotId: null }

      const snapshotIds = snapshots.map((s) => s.id)
      const { data: records } = await db
        .from('refresh_snapshot_metrics')
        .select('*')
        .in('snapshot_id', snapshotIds)

      return {
        records: records || [],
        snapshotId: snapshotIds[0],
      }
    }

    case 'api_records': {
      // Get API snapshots within time range
      let snapshotQuery = db
        .from('api_snapshots')
        .select('id')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (startDate) {
        snapshotQuery = snapshotQuery.gte('created_at', startDate.toISOString())
      }

      const { data: snapshots } = await snapshotQuery.limit(startDate ? 100 : 1)

      if (!snapshots || snapshots.length === 0)
        return { records: [], snapshotId: null }

      const snapshotIds = snapshots.map((s) => s.id)
      const { data: records } = await db
        .from('api_records')
        .select('*')
        .in('snapshot_id', snapshotIds)

      return {
        records: records || [],
        snapshotId: snapshotIds[0],
      }
    }

    case 'form_submissions': {
      let query = db
        .from('form_submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }

      const { data: records } = await query.limit(500)

      return { records: records || [], snapshotId: 'form_submissions' }
    }

    case 'api_snapshots': {
      let query = db
        .from('api_snapshots')
        .select('*')
        .order('created_at', { ascending: false })

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }

      const { data: records } = await query.limit(500)

      return { records: records || [], snapshotId: 'api_snapshots' }
    }

    case 'sheet_snapshots': {
      let query = db
        .from('sheet_refresh_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })

      if (startDate) {
        query = query.gte('snapshot_date', startDate.toISOString())
      }

      const { data: records } = await query.limit(500)

      return { records: records || [], snapshotId: 'sheet_snapshots' }
    }

    default:
      return { records: [], snapshotId: null }
  }
}

/**
 * Evaluate a single rule against a record
 */
async function evaluateRuleAgainstRecord(
  rule: WatchtowerRule,
  record: Record<string, unknown>,
  snapshotId: string,
  targetTable: TargetTable,
): Promise<{ triggered: boolean; alertId?: string }> {
  // Check dependency first
  const dependencySatisfied = await checkRuleDependency(rule)
  if (!dependencySatisfied) {
    return { triggered: false }
  }

  const fieldValue = record[rule.field_name]
  if (fieldValue === undefined || fieldValue === null) {
    return { triggered: false }
  }

  const triggered = evaluateCondition(
    rule.condition as RuleCondition,
    fieldValue,
    rule.threshold_value,
    undefined,
  )

  if (!triggered) {
    return { triggered: false }
  }

  // Create alert
  // For non-api tables, don't pass record_id as it has FK constraint to api_records
  const isApiTable = targetTable === 'api_records'
  const message = generateAlertMessage(rule, String(fieldValue))
  const accountInfo = record.account_name ? ` [${record.account_name}]` : ''
  const fullMessage = message + accountInfo

  const alert = await createAlert(
    rule.id,
    snapshotId,
    rule.severity,
    fullMessage,
    String(fieldValue),
    {
      recordId: isApiTable ? (record.id as string | undefined) : undefined,
      skipSnapshotValidation: !isApiTable,
    },
  )

  if (alert) {
    await updateRuleTriggerTracking(rule.id)
    if (rule.notify_immediately) {
      await sendAlertNotifications(alert as WatchtowerAlertType, rule)
      await updateRuleLastNotified(rule.id)
    }
    return { triggered: true, alertId: alert.id }
  }

  return { triggered: false }
}

/**
 * Result of evaluating rules for a target table
 */
interface TableEvaluationResult {
  alertsCreated: number
  rulesTriggered: number
  alertsSkippedDuplicate: number
}

/**
 * Evaluate all rules for a specific target table and time range combination
 * @param targetTable - The table to evaluate
 * @param timeRangeDays - Number of days to look back (null = all time, 0 = today)
 * @param rules - Rules to evaluate
 */
async function evaluateTargetTable(
  targetTable: TargetTable,
  timeRangeDays: number | null,
  rules: WatchtowerRule[],
): Promise<TableEvaluationResult> {
  const result: TableEvaluationResult = {
    alertsCreated: 0,
    rulesTriggered: 0,
    alertsSkippedDuplicate: 0,
  }

  // Get records for this target table with the specified time range
  const { records, snapshotId } = await getTargetTableRecords(
    targetTable,
    timeRangeDays,
  )
  if (records.length === 0 || !snapshotId) {
    return result
  }

  // Track alerts per rule to prevent flooding (max 5 per rule per evaluation)
  const alertsPerRule = new Map<string, number>()
  const triggeredRules = new Set<string>()
  const MAX_ALERTS_PER_RULE = 5

  // Evaluate each rule against each record
  for (const record of records) {
    for (const rule of rules) {
      // Skip compound rules (they need group handling)
      if (rule.group_id) continue

      // Check if we've hit the limit for this rule
      const currentCount = alertsPerRule.get(rule.id) || 0
      if (currentCount >= MAX_ALERTS_PER_RULE) {
        result.alertsSkippedDuplicate++
        continue
      }

      const { triggered, alertId } = await evaluateRuleAgainstRecord(
        rule,
        record,
        snapshotId,
        targetTable,
      )

      if (triggered) {
        triggeredRules.add(rule.id)
        if (alertId) {
          result.alertsCreated++
          alertsPerRule.set(rule.id, currentCount + 1)
        } else {
          // Rule triggered but alert wasn't created (likely duplicate)
          result.alertsSkippedDuplicate++
        }
      }
    }
  }

  result.rulesTriggered = triggeredRules.size
  return result
}

export async function GET() {
  try {
    // Fetch stats and evaluate rules in parallel where possible
    const [stats, allRules] = await Promise.all([
      getWatchtowerStats(),
      getRules({ includeInactive: false }),
    ])

    const summary: EvaluationSummary = {
      rulesEvaluated: 0,
      rulesTriggered: 0,
      alertsCreated: 0,
      alertsSkippedDuplicate: 0,
      tablesChecked: [],
    }

    // Group rules by target table AND time range to optimize data fetching
    // Rules with the same table + time_range_days can share the same data fetch
    const rulesByTableAndTimeRange = new Map<
      string,
      {
        targetTable: TargetTable
        timeRangeDays: number | null
        rules: WatchtowerRule[]
      }
    >()

    for (const rule of allRules) {
      if (!rule.target_table) continue
      const timeRangeDays = rule.time_range_days ?? null
      const key = `${rule.target_table}:${timeRangeDays}`

      const existing = rulesByTableAndTimeRange.get(key)
      if (existing) {
        existing.rules.push(rule)
      } else {
        rulesByTableAndTimeRange.set(key, {
          targetTable: rule.target_table as TargetTable,
          timeRangeDays,
          rules: [rule],
        })
      }
    }

    // Evaluate each target table + time range combination
    const entries = Array.from(rulesByTableAndTimeRange.values())
    for (const { targetTable, timeRangeDays, rules } of entries) {
      summary.rulesEvaluated += rules.length
      if (!summary.tablesChecked.includes(targetTable)) {
        summary.tablesChecked.push(targetTable)
      }

      try {
        const result = await evaluateTargetTable(
          targetTable,
          timeRangeDays,
          rules,
        )
        summary.alertsCreated += result.alertsCreated
        summary.rulesTriggered += result.rulesTriggered
        summary.alertsSkippedDuplicate += result.alertsSkippedDuplicate
      } catch (error) {
        console.error(
          `Error evaluating ${targetTable} (${timeRangeDays ?? 'all'} days):`,
          error,
        )
      }
    }

    // Re-fetch stats if alerts were created (to get updated counts)
    const finalStats: WatchtowerStats =
      summary.alertsCreated > 0 ? await getWatchtowerStats() : stats

    return NextResponse.json(
      {
        success: true,
        data: {
          stats: finalStats,
          rulesEvaluated: summary.rulesEvaluated,
          rulesTriggered: summary.rulesTriggered,
          alertsCreated: summary.alertsCreated,
          alertsSkippedDuplicate: summary.alertsSkippedDuplicate,
          tablesChecked: summary.tablesChecked,
        },
        evaluation: summary,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    )
  } catch (error) {
    console.error('Error in watchtower evaluate:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to evaluate watchtower',
      },
      { status: 500 },
    )
  }
}
