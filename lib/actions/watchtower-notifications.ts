'use server'

/**
 * Watchtower Notification System
 * Handles immediate Discord notifications for monitoring alerts
 */

import type {
  Severity,
  WatchtowerAlert,
  WatchtowerRule,
} from '@/types/watchtower'
import { sendDiscordMessage } from './discord'

// ============================================================================
// Discord Notification System
// ============================================================================

/**
 * Discord channel mapping for different severity levels
 * Used as fallback when no custom channel is specified
 */
const DISCORD_CHANNELS: Record<Severity, string> = {
  critical: 'watchtower-critical',
  warning: 'watchtower-alerts',
  info: 'watchtower-info',
}

/**
 * Format alert for Discord message
 */
function formatDiscordAlert(
  alert: WatchtowerAlert,
  rule: WatchtowerRule,
): string {
  const severityEmoji: Record<Severity, string> = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
  }

  const emoji = severityEmoji[alert.severity] || '📢'
  const timestamp = new Date(alert.created_at).toLocaleString()

  return `${emoji} **${rule.name}** [${alert.severity.toUpperCase()}]

**Message:** ${alert.message}

**Details:**
• Current Value: \`${alert.current_value || 'N/A'}\`
• Previous Value: \`${alert.previous_value || 'N/A'}\`
• Field: \`${rule.field_name}\`
• Condition: ${rule.condition} ${rule.threshold_value || ''}

**Timestamp:** ${timestamp}
**Alert ID:** \`${alert.id.slice(0, 8)}...\``
}

/**
 * Send Discord notification for an alert
 */
export async function sendDiscordNotification(
  alert: WatchtowerAlert,
  rule: WatchtowerRule,
): Promise<boolean> {
  try {
    // Determine channel - use custom channel if specified, otherwise use severity-based channel
    const channel = rule.discord_channel_id || DISCORD_CHANNELS[rule.severity]
    const message = formatDiscordAlert(alert, rule)

    await sendDiscordMessage(channel, message)
    console.log(
      `Discord notification sent for alert ${alert.id} to channel ${channel}`,
    )
    return true
  } catch (error) {
    console.error('Failed to send Discord notification:', error)
    return false
  }
}

/**
 * Send all configured notifications for an alert (currently Discord only)
 * Called immediately when a rule triggers
 */
export async function sendAlertNotifications(
  alert: WatchtowerAlert,
  rule: WatchtowerRule,
): Promise<{ discord: boolean }> {
  const results = { discord: false }

  // Send Discord notification if enabled
  if (rule.notify_discord) {
    results.discord = await sendDiscordNotification(alert, rule)
  }

  return results
}
