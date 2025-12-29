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
 * Supports primary channel, extra channel IDs, and multiple pod Discord channels
 */
export async function sendDiscordNotification(
  alert: WatchtowerAlert,
  rule: WatchtowerRule,
): Promise<boolean> {
  try {
    const message = formatDiscordAlert(alert, rule)
    const channelsToNotify: string[] = []
    const db = createAdminClient()

    // Add Discord channels from selected pods
    if (rule.pod_ids?.length) {
      const { data: pods } = await db
        .from('pod')
        .select('discord_id, name')
        .in('id', rule.pod_ids)

      if (pods) {
        const podChannels = pods
          .map((p) => `${p.name}-to-do-list`)
          .filter((id): id is string => !!id)
        channelsToNotify.push(...podChannels)
      }
    }

    // Add custom channel IDs from watchtower_channel_ids table
    const { data: customChannels } = await db
      .from('watchtower_channel_ids')
      .select('channel_id')
      .eq('rule_id', rule.id)

    if (customChannels) {
      channelsToNotify.push(...customChannels.map((c) => c.channel_id))
    }

    // Fallback to severity-based channel if no channels configured
    if (channelsToNotify.length === 0) {
      channelsToNotify.push(DISCORD_CHANNELS[rule.severity])
    }

    // Deduplicate channels
    const uniqueChannels = Array.from(new Set(channelsToNotify))

    // Send to all channels
    const results = await Promise.allSettled(
      uniqueChannels.map((channel) =>
        sendDiscordMessage(channel, message, {
          sourceFeature: 'watchtower_alert',
        }),
      ),
    )

    const successCount = results.filter((r) => r.status === 'fulfilled').length
    console.log(
      `[Discord] Notification sent for alert ${alert.id} to ${successCount}/${uniqueChannels.length} channels`,
    )

    return successCount > 0
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
 * Get multiple pods' information including WhatsApp numbers
 */
async function getMultiplePodsInfo(
  podIds: string[],
): Promise<{ name: string; whatsapp_number: string | null }[]> {
  if (!podIds.length) return []

  const db = createAdminClient()

  const { data: pods, error } = await db
    .from('pod')
    .select('name, whatsapp_number')
    .in('id', podIds)

  if (error || !pods) {
    console.error(`[WhatsApp] Failed to fetch pods:`, error)
    return []
  }

  return pods
}

/**
 * Send WhatsApp notification for an alert
 * Supports primary pod and multiple additional pods
 */
export async function sendWhatsAppNotification(
  alert: WatchtowerAlert,
  rule: WatchtowerRule,
): Promise<boolean> {
  const message = formatWhatsAppAlert(alert, rule)
  const numbersToNotify: { name: string; whatsapp_number: string }[] = []
  const db = createAdminClient()

  // Get WhatsApp numbers from selected pods
  if (rule.pod_ids?.length) {
    const { data: pods } = await db
      .from('pod')
      .select('name, whatsapp_number')
      .in('id', rule.pod_ids)

    if (pods) {
      for (const pod of pods) {
        if (pod.whatsapp_number) {
          numbersToNotify.push({
            name: pod.name,
            whatsapp_number: pod.whatsapp_number,
          })
        }
      }
    }
  }

  // Deduplicate by WhatsApp number
  const uniqueNumbers = numbersToNotify.filter(
    (item, index, self) =>
      index ===
      self.findIndex((p) => p.whatsapp_number === item.whatsapp_number),
  )

  if (uniqueNumbers.length === 0) {
    console.warn(
      `[WhatsApp] Rule ${rule.id} has notify_whatsapp enabled but no valid WhatsApp numbers found`,
    )
    return false
  }

  // Send to all unique WhatsApp numbers
  const results = await Promise.allSettled(
    uniqueNumbers.map(async (recipient) => {
      const result = await sendAndLogWhatsAppMessage(
        recipient.whatsapp_number,
        message,
        recipient.name,
        'watchtower_alert',
        recipient.name,
      )
      return { name: recipient.name, success: result.success }
    }),
  )

  const successCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success,
  ).length

  console.log(
    `[WhatsApp] Notification sent for alert ${alert.id} to ${successCount}/${uniqueNumbers.length} numbers`,
  )

  return successCount > 0
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
