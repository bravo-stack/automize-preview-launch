'use server'

import { createAdminClient } from '@/lib/db/admin'
import type { PodWhatsAppConfig, WaFeatureType } from '@/types/whatsapp'

// ============================================================================
// WhatsApp Configuration Utilities
// ============================================================================

/**
 * Fetches active configuration for a specific pod and feature.
 * Returns null if no active config exists.
 */
export async function getActiveConfig(
  podName: string,
  featureType: WaFeatureType,
): Promise<PodWhatsAppConfig | null> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('pod_whatsapp_configs')
    .select('*')
    .eq('pod_name', podName)
    .eq('feature_type', featureType)
    .eq('is_active', true)
    .single()

  if (error) {
    console.warn(
      `[WhatsApp Config] No active config for ${podName} - ${featureType}:`,
      error.message,
    )
    return null
  }

  return data
}

/**
 * Checks if a feature should run based on schedule configuration.
 * Considers: frequency, scheduled_time, and active_days.
 */
export async function shouldRunNow(
  config: PodWhatsAppConfig,
): Promise<boolean> {
  const now = new Date()

  // Check active_days if specified
  if (config.active_days) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const currentDay = dayNames[now.getDay()]
    const activeDays = config.active_days.split(',').map((d) => d.trim())

    if (!activeDays.includes(currentDay)) {
      console.log(
        `[WhatsApp Config] Skipping ${config.feature_type} - Not active on ${currentDay}`,
      )
      return false
    }
  }

  // Check if already sent today (for daily frequency)
  if (config.frequency === 'daily' && config.last_sent_at) {
    const lastSent = new Date(config.last_sent_at)
    const isSameDay =
      lastSent.toDateString() === now.toDateString() &&
      lastSent.getHours() >= parseInt(config.scheduled_time.split(':')[0])

    if (isSameDay) {
      console.log(
        `[WhatsApp Config] Skipping ${config.feature_type} - Already sent today`,
      )
      return false
    }
  }

  // TODO: Add time-based scheduling logic here if needed
  // For now, we assume the cron job timing handles this

  return true
}

/**
 * Updates the last_sent_at timestamp for a configuration.
 */
export async function markConfigAsSent(
  configId: number,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  const { error } = await db
    .from('pod_whatsapp_configs')
    .update({
      last_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', configId)

  if (error) {
    console.error('[WhatsApp Config] Failed to update last_sent_at:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Gets the message header to use - custom or default fallback.
 */
export function getMessageHeader(
  config: PodWhatsAppConfig | null,
  defaultHeader: string,
): string {
  return config?.custom_message_header || defaultHeader
}
