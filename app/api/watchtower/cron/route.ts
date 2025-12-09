// ============================================================================
// Watchtower Cron Endpoint (PAUSED)
// ============================================================================
// This cron endpoint is currently NOT scheduled/enabled.
// Future implementation will use a service worker for:
// - Instant Discord messaging for immediate alerts
// - Scheduled notifications based on rule configuration
//
// The rule evaluation logic here is preserved for when we implement
// the service worker-based alert system.
// ============================================================================

import {
  checkRuleDependency,
  createAlert,
  getRules,
  updateRuleLastNotified,
  updateRuleTriggerTracking,
} from '@/lib/actions/watchtower'
import { sendAlertNotifications } from '@/lib/actions/watchtower-notifications'
import { createAdminClient } from '@/lib/db/admin'
import {
  evaluateCondition,
  generateAlertMessage,
} from '@/lib/utils/watchtower-evaluation'
import type {
  RuleCondition,
  TargetTable,
  WatchtowerAlert as WatchtowerAlertType,
} from '@/types/api-storage'
import type { WatchtowerRule } from '@/types/watchtower'
import { NextResponse } from 'next/server'

interface EvaluationResult {
  targetTable: TargetTable
  recordsChecked: number
  rulesEvaluated: number
  alertsCreated: number
  alertsSkipped: number
  alerts: string[]
}

/**
 * Get records from a target table for watchtower evaluation
 */
async function getTargetTableRecords(
  targetTable: TargetTable,
): Promise<{ records: Record<string, unknown>[]; snapshotId: string | null }> {
  const db = createAdminClient()

  switch (targetTable) {
    case 'facebook_metrics': {
      // Get the latest autometric snapshot
      const { data: snapshot } = await db
        .from('sheet_refresh_snapshots')
        .select('id')
        .eq('refresh_type', 'autometric')
        .eq('refresh_status', 'completed')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single()

      if (!snapshot) return { records: [], snapshotId: null }

      const { data: records } = await db
        .from('refresh_snapshot_metrics')
        .select('*')
        .eq('snapshot_id', snapshot.id)

      return { records: records || [], snapshotId: snapshot.id }
    }

    case 'finance_metrics': {
      // Get the latest financialx snapshot
      const { data: snapshot } = await db
        .from('sheet_refresh_snapshots')
        .select('id')
        .eq('refresh_type', 'financialx')
        .eq('refresh_status', 'completed')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single()

      if (!snapshot) return { records: [], snapshotId: null }

      const { data: records } = await db
        .from('refresh_snapshot_metrics')
        .select('*')
        .eq('snapshot_id', snapshot.id)

      return { records: records || [], snapshotId: snapshot.id }
    }

    case 'api_records': {
      // Get the latest API snapshot with records
      const { data: snapshot } = await db
        .from('api_snapshots')
        .select('id')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!snapshot) return { records: [], snapshotId: null }

      const { data: records } = await db
        .from('api_records')
        .select('*')
        .eq('snapshot_id', snapshot.id)

      return { records: records || [], snapshotId: snapshot.id }
    }

    case 'form_submissions': {
      const { data: records } = await db
        .from('form_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      return { records: records || [], snapshotId: 'form_submissions' }
    }

    case 'api_snapshots': {
      const { data: records } = await db
        .from('api_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      return { records: records || [], snapshotId: 'api_snapshots' }
    }

    case 'sheet_snapshots': {
      const { data: records } = await db
        .from('sheet_refresh_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(100)

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
  // For non-api tables (facebook_metrics, finance_metrics, etc.), don't pass record_id
  // as it has FK constraint to api_records
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
      skipSnapshotValidation: !isApiTable, // Skip for non-api tables
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
 * Evaluate all rules for a specific target table
 */
async function evaluateTargetTable(
  targetTable: TargetTable,
): Promise<EvaluationResult> {
  const result: EvaluationResult = {
    targetTable,
    recordsChecked: 0,
    rulesEvaluated: 0,
    alertsCreated: 0,
    alertsSkipped: 0,
    alerts: [],
  }

  // Get rules for this target table
  const rules = await getRules({
    targetTable,
    includeInactive: false,
  })

  if (rules.length === 0) {
    return result
  }

  // Get records for this target table
  const { records, snapshotId } = await getTargetTableRecords(targetTable)
  if (records.length === 0 || !snapshotId) {
    return result
  }

  result.recordsChecked = records.length
  result.rulesEvaluated = rules.length

  // Track alerts per rule to prevent flooding
  const alertsPerRule = new Map<string, number>()
  const MAX_ALERTS_PER_RULE = 10 // Limit alerts per rule per cron run

  // Evaluate each rule against each record
  for (const record of records) {
    for (const rule of rules) {
      // Skip compound rules for now (they need group handling)
      if (rule.group_id) continue

      // Check if we've hit the limit for this rule
      const currentCount = alertsPerRule.get(rule.id) || 0
      if (currentCount >= MAX_ALERTS_PER_RULE) {
        result.alertsSkipped++
        continue
      }

      const { triggered, alertId } = await evaluateRuleAgainstRecord(
        rule,
        record,
        snapshotId,
        targetTable,
      )

      if (triggered && alertId) {
        result.alertsCreated++
        result.alerts.push(alertId)
        alertsPerRule.set(rule.id, currentCount + 1)
      }
    }
  }

  return result
}

/**
 * Cron endpoint for Watchtower - Evaluates all active rules against latest data
 *
 * This endpoint should be called periodically (e.g., every 5 minutes via Vercel Cron)
 * to evaluate watchtower rules and create alerts for triggered conditions.
 */
export async function GET() {
  const startTime = Date.now()
  const results: EvaluationResult[] = []

  // Get all distinct target tables that have active rules
  const db = createAdminClient()
  const { data: rulesWithTargets } = await db
    .from('watchtower_rules')
    .select('target_table')
    .eq('is_active', true)
    .not('target_table', 'is', null)

  const targetTables = Array.from(
    new Set(
      (rulesWithTargets || [])
        .map((r) => r.target_table)
        .filter(Boolean) as TargetTable[],
    ),
  )

  // Evaluate each target table
  for (const targetTable of targetTables) {
    try {
      const result = await evaluateTargetTable(targetTable)
      results.push(result)
    } catch (error) {
      console.error(`Error evaluating ${targetTable}:`, error)
      results.push({
        targetTable,
        recordsChecked: 0,
        rulesEvaluated: 0,
        alertsCreated: 0,
        alertsSkipped: 0,
        alerts: [],
      })
    }
  }

  const duration = Date.now() - startTime
  const totalAlerts = results.reduce((sum, r) => sum + r.alertsCreated, 0)
  const totalRecords = results.reduce((sum, r) => sum + r.recordsChecked, 0)
  const totalRules = results.reduce((sum, r) => sum + r.rulesEvaluated, 0)

  return NextResponse.json({
    success: true,
    message: `Watchtower evaluation complete. ${totalAlerts} alerts created.`,
    timestamp: new Date().toISOString(),
    duration: `${duration}ms`,
    summary: {
      targetTablesEvaluated: targetTables.length,
      totalRecordsChecked: totalRecords,
      totalRulesEvaluated: totalRules,
      totalAlertsCreated: totalAlerts,
    },
    results,
  })
}

// Also support POST for more secure cron handlers
export async function POST(request: Request) {
  return GET()
}
