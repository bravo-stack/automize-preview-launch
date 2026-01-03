'use server'

/**
 * Watchtower Notification System
 * Handles immediate Discord and WhatsApp notifications for monitoring alerts
 *
 * Work Hours Policy:
 * - 'info', 'warning', 'critical' severities: Send only during work hours (9am-5pm user's local time)
 * - 'urgent' severity: Send regardless of time (bypasses work hours restriction)
 */

import { createAdminClient } from '@/lib/db/admin'
import type {
  Severity,
  WatchtowerAlert,
  WatchtowerRule,
} from '@/types/watchtower'
import { sendDiscordMessage } from './discord'
import {
  sendAndLogWhatsAppMessage,
  validateAndCleanPhoneNumber,
} from './whatsapp'

// ============================================================================
// Work Hours Configuration
// ============================================================================

const WORK_HOURS = {
  start: 9, // 9 AM
  end: 17, // 5 PM (17:00)
} as const

/**
 * Check if the current time is within work hours (9am - 5pm)
 * This is timezone agnostic - it uses the server's local time
 * which represents the operational timezone of the system
 *
 * @returns true if current hour is between 9 (inclusive) and 17 (exclusive)
 */
function isWithinWorkHours(): boolean {
  const now = new Date()
  const currentHour = now.getHours()
  return currentHour >= WORK_HOURS.start && currentHour < WORK_HOURS.end
}

/**
 * Determines if a notification should be sent based on severity and work hours
 * - 'urgent' severity always sends (bypasses work hours)
 * - All other severities only send during work hours
 */
function shouldSendNotification(severity: Severity): boolean {
  // Urgent alerts bypass work hours restriction
  if (severity === 'urgent') {
    return true
  }
  // All other severities respect work hours
  return isWithinWorkHours()
}

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
  urgent: 'watchtower-urgent',
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
    urgent: '🆘',
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
 * Channels are sent to [pod-name]-to-do-list format for pod-based notifications
 */
export async function sendDiscordNotification(
  alert: WatchtowerAlert,
  rule: WatchtowerRule,
): Promise<boolean> {
  try {
    const message = formatDiscordAlert(alert, rule)
    const channelsToNotify: { channelName: string; podName?: string }[] = []
    const db = createAdminClient()

    // Add Discord channels from selected pods using [pod-name]-to-do-list format
    if (rule.pod_ids?.length) {
      const { data: pods } = await db
        .from('pod')
        .select('discord_id, name')
        .in('id', rule.pod_ids)

      if (pods) {
        for (const pod of pods) {
          if (pod.name) {
            const channelName = `${pod.name}-to-do-list`
            channelsToNotify.push({ channelName, podName: pod.name })
          }
        }
      }
    }

    // Add custom channel IDs from watchtower_channel_ids table
    const { data: customChannels } = await db
      .from('watchtower_channel_ids')
      .select('channel_id, label')
      .eq('rule_id', rule.id)

    if (customChannels) {
      for (const c of customChannels) {
        channelsToNotify.push({ channelName: c.channel_id })
      }
    }

    // Fallback to severity-based channel if no channels configured
    if (channelsToNotify.length === 0) {
      channelsToNotify.push({ channelName: DISCORD_CHANNELS[rule.severity] })
    }

    // Deduplicate channels by channelName
    const uniqueChannels = channelsToNotify.filter(
      (channel, index, self) =>
        index === self.findIndex((c) => c.channelName === channel.channelName),
    )

    // Send to all channels with proper logging
    const results = await Promise.allSettled(
      uniqueChannels.map((channel) =>
        sendDiscordMessage(channel.channelName, message, {
          sourceFeature: 'watchtower_alert',
          podName: channel.podName,
        }),
      ),
    )

    // Extract resolved channel names from successful results for logging
    const successfulResults = results
      .filter(
        (
          r,
        ): r is PromiseFulfilledResult<{
          success: boolean
          channelName?: string
        }> => r.status === 'fulfilled' && r.value.success,
      )
      .map((r) => r.value.channelName)
      .filter(Boolean)

    const successCount = successfulResults.length
    const resolvedChannelNames =
      successfulResults.length > 0
        ? successfulResults.join(', ')
        : uniqueChannels.map((c) => c.channelName).join(', ')

    console.log(
      `[Discord] Notification sent for alert ${alert.id} to ${successCount}/${uniqueChannels.length} channels: [${resolvedChannelNames}]`,
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
    urgent: '🆘',
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
        // Validate phone number before adding to list
        const cleanNumber = validateAndCleanPhoneNumber(pod.whatsapp_number)
        if (cleanNumber) {
          numbersToNotify.push({
            name: pod.name,
            whatsapp_number: cleanNumber,
          })
        } else if (pod.whatsapp_number) {
          // Log invalid numbers for debugging
          console.warn(
            `[WhatsApp] Invalid phone number for pod ${pod.name}: ${pod.whatsapp_number}`,
          )
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
 *
 * Work Hours Policy:
 * - 'info', 'warning', 'critical' severities: Send only during work hours (9am-5pm)
 * - 'urgent' severity: Send regardless of time (bypasses work hours restriction)
 */
export async function sendAlertNotifications(
  alert: WatchtowerAlert,
  rule: WatchtowerRule,
): Promise<{
  discord: boolean
  whatsapp: boolean
  skippedDueToWorkHours: boolean
}> {
  const results = {
    discord: false,
    whatsapp: false,
    skippedDueToWorkHours: false,
  }

  // Check if notification should be sent based on severity and work hours
  if (!shouldSendNotification(alert.severity)) {
    console.log(
      `[Notifications] Alert ${alert.id} (${alert.severity}) skipped - outside work hours (9am-5pm)`,
    )
    results.skippedDueToWorkHours = true
    return results
  }

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
