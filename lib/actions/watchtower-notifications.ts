'use server'

/**
 * Watchtower Notification System
 * Handles immediate Discord and WhatsApp notifications for monitoring alerts
 */

import { createAdminClient } from '@/lib/db/admin'
import type {
  Severity,
  WatchtowerAlert,
  WatchtowerRule,
} from '@/types/watchtower'
import { sendDiscordMessage } from './discord'
import { sendAndLogWhatsAppMessage } from './whatsapp'

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

// ============================================================================
// WhatsApp Notification System
// ============================================================================

/**
 * Format alert for WhatsApp message (plain text, no markdown)
 */
function formatWhatsAppAlert(
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

  return `${emoji} *${rule.name}* [${alert.severity.toUpperCase()}]

*Message:* ${alert.message}

*Details:*
• Current Value: ${alert.current_value || 'N/A'}
• Previous Value: ${alert.previous_value || 'N/A'}
• Field: ${rule.field_name}
• Condition: ${rule.condition} ${rule.threshold_value || ''}

*Timestamp:* ${timestamp}
*Alert ID:* ${alert.id.slice(0, 8)}...`
}

/**
 * Get pod information including WhatsApp number
 */
async function getPodInfo(
  podId: string,
): Promise<{ name: string; whatsapp_number: string | null } | null> {
  const db = createAdminClient()

  const { data: pod, error } = await db
    .from('pod')
    .select('name, whatsapp_number')
    .eq('id', podId)
    .single()

  if (error || !pod) {
    console.error(`[WhatsApp] Failed to fetch pod ${podId}:`, error)
    return null
  }

  return pod
}

/**
 * Send WhatsApp notification for an alert
 */
export async function sendWhatsAppNotification(
  alert: WatchtowerAlert,
  rule: WatchtowerRule,
): Promise<boolean> {
  // Require pod_id for WhatsApp notifications
  if (!rule.pod_id) {
    console.warn(
      `[WhatsApp] Rule ${rule.id} has notify_whatsapp enabled but no pod_id configured`,
    )
    return false
  }

  // Fetch pod info to get WhatsApp number
  const pod = await getPodInfo(rule.pod_id)
  if (!pod) {
    console.error(`[WhatsApp] Could not fetch pod info for rule ${rule.id}`)
    return false
  }

  if (!pod.whatsapp_number) {
    console.warn(`[WhatsApp] Pod ${pod.name} has no WhatsApp number configured`)
    return false
  }

  const message = formatWhatsAppAlert(alert, rule)

  try {
    const result = await sendAndLogWhatsAppMessage(
      pod.whatsapp_number,
      message,
      pod.name,
      'watchtower_alert',
      pod.name, // Use pod name as recipient name
    )

    if (result.success) {
      console.log(
        `[WhatsApp] Notification sent for alert ${alert.id} to ${pod.whatsapp_number}`,
      )
      return true
    } else {
      console.error(
        `[WhatsApp] Failed to send notification for alert ${alert.id}:`,
        result.error,
      )
      return false
    }
  } catch (error) {
    console.error('[WhatsApp] Failed to send notification:', error)
    return false
  }
}

// ============================================================================
// Combined Notification Dispatcher
// ============================================================================

/**
 * Send all configured notifications for an alert (Discord and WhatsApp)
 * Called immediately when a rule triggers
 */
export async function sendAlertNotifications(
  alert: WatchtowerAlert,
  rule: WatchtowerRule,
): Promise<{ discord: boolean; whatsapp: boolean }> {
  const results = { discord: false, whatsapp: false }

  // Send Discord notification if enabled
  if (rule.notify_discord) {
    results.discord = await sendDiscordNotification(alert, rule)
  }

  // Send WhatsApp notification if enabled
  if (rule.notify_whatsapp) {
    results.whatsapp = await sendWhatsAppNotification(alert, rule)
  }

  return results
}
