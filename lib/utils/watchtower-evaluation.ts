import type { RuleCondition } from '@/types/api-storage'
import type { WatchtowerRule } from '@/types/watchtower'

// ============================================================================
// Pure Evaluation Utilities (no server actions)
// These are extracted from watchtower-engine for use in API routes
// ============================================================================

/**
 * Evaluate a single condition against a value
 */
export function evaluateCondition(
  condition: RuleCondition,
  currentValue: unknown,
  thresholdValue: string | null,
  previousValue?: unknown,
): boolean {
  // Handle null/undefined values
  if (condition === 'is_null') {
    return currentValue === null || currentValue === undefined
  }
  if (condition === 'is_not_null') {
    return currentValue !== null && currentValue !== undefined
  }

  // Convert values for comparison
  const current =
    typeof currentValue === 'number'
      ? currentValue
      : parseFloat(String(currentValue))
  const threshold = thresholdValue ? parseFloat(thresholdValue) : 0

  switch (condition) {
    case 'equals':
      return String(currentValue) === thresholdValue
    case 'not_equals':
      return String(currentValue) !== thresholdValue
    case 'greater_than':
      return !isNaN(current) && current > threshold
    case 'less_than':
      return !isNaN(current) && current < threshold
    case 'greater_than_or_equal':
      return !isNaN(current) && current >= threshold
    case 'less_than_or_equal':
      return !isNaN(current) && current <= threshold
    case 'changed':
      return previousValue !== undefined && currentValue !== previousValue
    case 'changed_by_percent':
      if (previousValue === undefined || previousValue === 0) return false
      const prev =
        typeof previousValue === 'number'
          ? previousValue
          : parseFloat(String(previousValue))
      if (isNaN(prev) || isNaN(current) || prev === 0) return false
      const changePercent = Math.abs(((current - prev) / prev) * 100)
      return changePercent >= threshold
    case 'contains':
      return thresholdValue
        ? String(currentValue).includes(thresholdValue)
        : false
    case 'not_contains':
      return thresholdValue
        ? !String(currentValue).includes(thresholdValue)
        : true
    default:
      return false
  }
}

/**
 * Generate a human-readable alert message for a triggered rule
 */
export function generateAlertMessage(
  rule: WatchtowerRule,
  currentValue: string,
  previousValue?: string,
): string {
  const fieldLabel = rule.field_name.replace(/_/g, ' ')
  const conditionText = getConditionText(rule.condition)

  let message = `${rule.name}: ${fieldLabel} ${conditionText}`

  if (rule.threshold_value) {
    message += ` ${rule.threshold_value}`
  }

  message += ` (current: ${currentValue})`

  if (previousValue && rule.condition.includes('changed')) {
    message += ` (previous: ${previousValue})`
  }

  return message
}

/**
 * Get human-readable condition text
 */
export function getConditionText(condition: string): string {
  const conditionMap: Record<string, string> = {
    equals: 'equals',
    not_equals: 'does not equal',
    greater_than: 'is greater than',
    less_than: 'is less than',
    greater_than_or_equal: 'is at least',
    less_than_or_equal: 'is at most',
    changed: 'has changed',
    changed_by_percent: 'changed by more than',
    contains: 'contains',
    not_contains: 'does not contain',
    is_null: 'is empty',
    is_not_null: 'is not empty',
  }
  return conditionMap[condition] || condition
}
