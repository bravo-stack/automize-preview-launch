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

    // Add primary channel (from pod or severity fallback)
    const primaryChannel =
      rule.discord_channel_id || DISCORD_CHANNELS[rule.severity]
    channelsToNotify.push(primaryChannel)

    // Add extra Discord channel IDs if configured
    if (rule.extra_discord_channel_ids?.length) {
      channelsToNotify.push(...rule.extra_discord_channel_ids)
    }

    // Add Discord channels from additional pods if configured
    if (rule.pod_ids?.length) {
      const db = createAdminClient()
      const { data: pods } = await db
        .from('pod')
        .select('discord_id')
        .in('id', rule.pod_ids)

      if (pods) {
        const podChannels = pods
          .map((p) => p.discord_id)
          .filter((id): id is string => !!id)
        channelsToNotify.push(...podChannels)
      }
    }

    // Deduplicate channels
    const uniqueChannels = [...new Set(channelsToNotify)]

    // Send to all channels
    const results = await Promise.allSettled(
      uniqueChannels.map((channel) => sendDiscordMessage(channel, message)),
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
  const podsToNotify: { name: string; whatsapp_number: string }[] = []

  // Add primary pod if configured
  if (rule.pod_id) {
    const pod = await getPodInfo(rule.pod_id)
    if (pod?.whatsapp_number) {
      podsToNotify.push({
        name: pod.name,
        whatsapp_number: pod.whatsapp_number,
      })
    }
  }

  // Add additional pods if configured
  if (rule.pod_ids?.length) {
    const additionalPods = await getMultiplePodsInfo(rule.pod_ids)
    for (const pod of additionalPods) {
      if (pod.whatsapp_number) {
        podsToNotify.push({
          name: pod.name,
          whatsapp_number: pod.whatsapp_number,
        })
      }
    }
  }

  // Deduplicate by WhatsApp number
  const uniquePods = podsToNotify.filter(
    (pod, index, self) =>
      index ===
      self.findIndex((p) => p.whatsapp_number === pod.whatsapp_number),
  )

  if (uniquePods.length === 0) {
    console.warn(
      `[WhatsApp] Rule ${rule.id} has notify_whatsapp enabled but no valid WhatsApp numbers found`,
    )
    return false
  }

  // Send to all unique WhatsApp numbers
  const results = await Promise.allSettled(
    uniquePods.map(async (pod) => {
      const result = await sendAndLogWhatsAppMessage(
        pod.whatsapp_number,
        message,
        pod.name,
        'watchtower_alert',
        pod.name,
      )
      return { pod: pod.name, success: result.success }
    }),
  )

  const successCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success,
  ).length

  console.log(
    `[WhatsApp] Notification sent for alert ${alert.id} to ${successCount}/${uniquePods.length} pods`,
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
