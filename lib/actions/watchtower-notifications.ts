'use server'

/**
 * Watchtower Notification System
 * Handles Discord notifications for monitoring alerts
 */

import type {
  Severity,
  WatchtowerAlert,
  WatchtowerRule,
} from '@/types/watchtower'
import { sendDiscordMessage } from './discord'

// ============================================================================
// Watchtower Notification System (Discord Only)
// ============================================================================

/**
 * Discord channel mapping for different severity levels
 * You can customize these channel names based on your Discord server setup
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
**Alert ID:** ${alert.id}`
}

/**
 * Format multiple alerts for a digest notification
 */
function formatDiscordDigest(
  alerts: WatchtowerAlert[],
  rule: WatchtowerRule,
): string {
  const severityEmoji: Record<Severity, string> = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length
  const infoCount = alerts.filter((a) => a.severity === 'info').length

  let summary = `📊 **Watchtower Alert Digest** for rule: **${rule.name}**\n\n`
  summary += `**Total Alerts:** ${alerts.length}\n`

  if (criticalCount > 0) summary += `• 🚨 Critical: ${criticalCount}\n`
  if (warningCount > 0) summary += `• ⚠️ Warning: ${warningCount}\n`
  if (infoCount > 0) summary += `• ℹ️ Info: ${infoCount}\n`

  summary += `\n**Recent Alerts:**\n`

  // Show up to 5 most recent alerts
  const recentAlerts = alerts.slice(0, 5)
  recentAlerts.forEach((alert, index) => {
    const emoji = severityEmoji[alert.severity] || '📢'
    summary += `${index + 1}. ${emoji} ${alert.message}\n`
  })

  if (alerts.length > 5) {
    summary += `\n... and ${alerts.length - 5} more alerts`
  }

  return summary
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
 * Send Discord digest notification for multiple alerts
 */
export async function sendDiscordDigest(
  alerts: WatchtowerAlert[],
  rule: WatchtowerRule,
): Promise<boolean> {
  try {
    const channel = rule.discord_channel_id || DISCORD_CHANNELS[rule.severity]
    const message = formatDiscordDigest(alerts, rule)

    await sendDiscordMessage(channel, message)
    console.log(
      `Discord digest sent for ${alerts.length} alerts to channel ${channel}`,
    )
    return true
  } catch (error) {
    console.error('Failed to send Discord digest:', error)
    return false
  }
}

// ============================================================================
// Combined Notification Handler
// ============================================================================

/**
 * Send all configured notifications for an alert
 * Currently supports Discord only
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

/**
 * Send digest notifications for scheduled rules
 * Currently supports Discord only
 */
export async function sendDigestNotifications(
  alerts: WatchtowerAlert[],
  rule: WatchtowerRule,
): Promise<{ discord: boolean }> {
  const results = { discord: false }

  if (alerts.length === 0) {
    return results
  }

  // Send Discord digest if enabled
  if (rule.notify_discord) {
    results.discord = await sendDiscordDigest(alerts, rule)
  }

  return results
}
