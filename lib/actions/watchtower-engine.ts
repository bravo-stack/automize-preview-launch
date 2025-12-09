'use server'

import {
  evaluateCondition,
  generateAlertMessage,
  getConditionText,
} from '@/lib/utils/watchtower-evaluation'
import type { TargetTable, WatchtowerAlert } from '@/types/api-storage'
import type {
  RuleCondition,
  RuleEvaluationContext,
  RuleEvaluationResult,
} from '@/types/watchtower'
import {
  checkRuleDependency,
  createAlert,
  getCompoundRules,
  getRules,
  updateRuleLastNotified,
  updateRuleTriggerTracking,
} from './watchtower'
import { sendAlertNotifications } from './watchtower-notifications'

// Re-export for backward compatibility
export { evaluateCondition, generateAlertMessage, getConditionText }

// ============================================================================
// Rule Evaluation Engine
// ============================================================================

/**
 * Evaluate a single rule and return the result
 */
export async function evaluateRule(
  context: RuleEvaluationContext,
): Promise<RuleEvaluationResult> {
  const { rule, currentValue, previousValue, snapshot_id } = context

  // Check dependency condition first
  const dependencySatisfied = await checkRuleDependency(rule)
  if (!dependencySatisfied) {
    return {
      rule_id: rule.id,
      triggered: false,
      message: 'Dependency condition not satisfied',
      current_value: String(currentValue),
      previous_value: previousValue ? String(previousValue) : undefined,
      severity: rule.severity,
    }
  }

  // Evaluate the condition
  const triggered = evaluateCondition(
    rule.condition as RuleCondition,
    currentValue,
    rule.threshold_value,
    previousValue,
  )

  const message = triggered
    ? generateAlertMessage(
        rule,
        String(currentValue),
        previousValue ? String(previousValue) : undefined,
      )
    : `Rule "${rule.name}" not triggered`

  return {
    rule_id: rule.id,
    triggered,
    message,
    current_value: String(currentValue),
    previous_value: previousValue ? String(previousValue) : undefined,
    severity: rule.severity,
  }
}

/**
 * Evaluate a compound rule (multiple clauses with same group_id)
 */
export async function evaluateCompoundRule(
  groupId: string,
  valuesByField: Record<string, unknown>,
  previousValues?: Record<string, unknown>,
  snapshotId?: string,
): Promise<RuleEvaluationResult | null> {
  const rules = await getCompoundRules(groupId)
  if (rules.length === 0) return null

  const mainRule = rules[0]
  const logicOperator = mainRule.logic_operator

  // Check dependency for the main rule
  const dependencySatisfied = await checkRuleDependency(mainRule)
  if (!dependencySatisfied) {
    return {
      rule_id: mainRule.id,
      triggered: false,
      message: 'Dependency condition not satisfied',
      current_value: JSON.stringify(valuesByField),
      severity: mainRule.severity,
    }
  }

  // Evaluate each clause
  const results: boolean[] = []
  const triggeredClauses: string[] = []

  for (const rule of rules) {
    const currentValue = valuesByField[rule.field_name]
    const previousValue = previousValues?.[rule.field_name]

    if (currentValue === undefined) continue

    const triggered = evaluateCondition(
      rule.condition as RuleCondition,
      currentValue,
      rule.threshold_value,
      previousValue,
    )

    results.push(triggered)

    if (triggered) {
      triggeredClauses.push(
        `${rule.field_name} ${getConditionText(rule.condition)} ${rule.threshold_value || ''}`,
      )
    }
  }

  // Apply logic operator
  let overallTriggered: boolean
  if (logicOperator === 'AND') {
    overallTriggered = results.length > 0 && results.every((r) => r)
  } else {
    overallTriggered = results.some((r) => r)
  }

  const message = overallTriggered
    ? `${mainRule.name}: ${triggeredClauses.join(` ${logicOperator} `)}`
    : `Compound rule "${mainRule.name}" not triggered`

  return {
    rule_id: mainRule.id,
    triggered: overallTriggered,
    message,
    current_value: JSON.stringify(valuesByField),
    previous_value: previousValues ? JSON.stringify(previousValues) : undefined,
    severity: mainRule.severity,
  }
}

/**
 * Evaluate all active rules against a record and create alerts for triggered rules
 */
export async function evaluateRecordAgainstRules(
  record: Record<string, unknown>,
  snapshotId: string,
  clientId?: number,
  previousRecord?: Record<string, unknown>,
): Promise<{ triggered: number; alerts: string[] }> {
  // Get all active rules
  const rules = await getRules({ includeInactive: false })
  const triggered: string[] = []
  const processedGroups = new Set<string>()

  for (const rule of rules) {
    // Skip if this rule is part of a group we've already processed
    if (rule.group_id && processedGroups.has(rule.group_id)) {
      continue
    }

    // Handle compound rules
    if (rule.group_id) {
      processedGroups.add(rule.group_id)

      const result = await evaluateCompoundRule(
        rule.group_id,
        record,
        previousRecord,
        snapshotId,
      )

      if (result?.triggered) {
        const alert = await createAlert(
          result.rule_id,
          snapshotId,
          result.severity,
          result.message,
          result.current_value,
          {
            previousValue: result.previous_value,
            clientId,
          },
        )

        if (alert) {
          triggered.push(alert.id)
          // Track that this rule was triggered
          await updateRuleTriggerTracking(result.rule_id)
          // Send immediate notifications if enabled
          if (rule.notify_immediately) {
            await sendAlertNotifications(alert as WatchtowerAlert, rule)
            await updateRuleLastNotified(result.rule_id)
          }
        }
      }
      continue
    }

    // Handle single rules
    const fieldValue = record[rule.field_name]
    if (fieldValue === undefined) continue

    const previousValue = previousRecord?.[rule.field_name]

    const result = await evaluateRule({
      rule,
      currentValue: fieldValue,
      previousValue,
      snapshot_id: snapshotId,
    })

    if (result.triggered) {
      const alert = await createAlert(
        rule.id,
        snapshotId,
        rule.severity,
        result.message,
        result.current_value,
        {
          previousValue: result.previous_value,
          clientId,
        },
      )

      if (alert) {
        triggered.push(alert.id)
        // Track that this rule was triggered
        await updateRuleTriggerTracking(rule.id)
        // Send immediate notifications if enabled
        if (rule.notify_immediately) {
          await sendAlertNotifications(alert as WatchtowerAlert, rule)
          await updateRuleLastNotified(rule.id)
        }
      }
    }
  }

  return {
    triggered: triggered.length,
    alerts: triggered,
  }
}

/**
 * Evaluate rules for a specific target table against multiple records
 */
export async function evaluateTableRecords(
  targetTable: TargetTable,
  records: Record<string, unknown>[],
  snapshotId: string,
  clientId?: number,
  previousRecords?: Record<string, unknown>[],
): Promise<{ triggered: number; alerts: string[] }> {
  // Get rules for this target table
  const rules = await getRules({
    targetTable,
    includeInactive: false,
  })

  if (rules.length === 0) {
    return { triggered: 0, alerts: [] }
  }

  const allAlerts: string[] = []

  // Create a map of previous records by a unique identifier if available
  const previousMap = new Map<string, Record<string, unknown>>()
  if (previousRecords) {
    for (const prev of previousRecords) {
      const key = String(prev.id || prev.external_id || '')
      if (key) previousMap.set(key, prev)
    }
  }

  for (const record of records) {
    const recordKey = String(record.id || record.external_id || '')
    const previousRecord = recordKey ? previousMap.get(recordKey) : undefined

    const { alerts } = await evaluateRecordAgainstRules(
      record,
      snapshotId,
      clientId,
      previousRecord,
    )

    allAlerts.push(...alerts)
  }

  return {
    triggered: allAlerts.length,
    alerts: allAlerts,
  }
}
