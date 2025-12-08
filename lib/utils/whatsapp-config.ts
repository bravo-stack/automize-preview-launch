'use server'

import { createAdminClient } from '@/lib/db/admin'
import type {
  GlobalWhatsAppConfig,
  PodWhatsAppConfig,
  WaFeatureType,
} from '@/types/whatsapp'

// ============================================================================
// WhatsApp Configuration Utilities
// ============================================================================
// Configuration hierarchy: Pod-specific config > Global config > Disabled

const GLOBAL_POD_NAME = '__GLOBAL__'

/**
 * Fetches global configuration from the whatsapp_schedules table.
 * The global config uses pod_name = '__GLOBAL__'.
 * Returns null if no active global config exists.
 */
export async function getGlobalActiveConfig(
  featureType: WaFeatureType,
): Promise<GlobalWhatsAppConfig | null> {
  const db = createAdminClient()

  // Query from whatsapp_schedules with the global pod name
  const { data, error } = await db
    .from('whatsapp_schedules')
    .select('*')
    .eq('pod_name', GLOBAL_POD_NAME)
    .eq('is_active', true)
    .single()

  if (error) {
    console.warn(
      `[WhatsApp Config] No global config for ${featureType}:`,
      error.message,
    )
    return null
  }

  return data as GlobalWhatsAppConfig
}

/**
 * Fetches active configuration for a specific pod and feature.
 * Falls back to global configuration if no pod-specific config exists.
 * Returns null if no active config exists (neither pod nor global).
 */
export async function getActiveConfig(
  podName: string,
  featureType: WaFeatureType,
): Promise<PodWhatsAppConfig | null> {
  const db = createAdminClient()

  // First, try to get pod-specific config
  const { data: podConfig, error: podError } = await db
    .from('pod_whatsapp_configs')
    .select('*')
    .eq('pod_name', podName)
    .eq('feature_type', featureType)
    .single()

  // If pod config exists (active or not), respect it
  if (podConfig) {
    if (!podConfig.is_active) {
      console.log(
        `[WhatsApp Config] Pod config for ${podName} - ${featureType} is disabled`,
      )
      return null
    }
    return podConfig
  }

  // No pod-specific config - check global config
  const globalConfig = await getGlobalActiveConfig(featureType)

  if (!globalConfig) {
    console.log(
      `[WhatsApp Config] No config for ${podName} - ${featureType} (neither pod nor global)`,
    )
    return null
  }

  // Create a synthetic PodWhatsAppConfig from the global config
  // This allows the job to run using global settings
  // Note: We convert integer[] days_of_week to string format for compatibility
  console.log(
    `[WhatsApp Config] Using global config for ${podName} - ${featureType}`,
  )

  // Convert integer array to day name string for PodWhatsAppConfig compatibility
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const activeDaysString = globalConfig.days_of_week
    ? globalConfig.days_of_week.map((d) => dayNames[d]).join(',')
    : null

  return {
    id: -1, // Synthetic ID to indicate this is from global
    pod_name: podName,
    feature_type: featureType,
    is_active: globalConfig.is_active,
    custom_message_header: globalConfig.custom_message,
    frequency: globalConfig.frequency,
    scheduled_time: globalConfig.time,
    active_days: activeDaysString,
    last_sent_at: null, // Global config doesn't track per-pod last_sent
    created_at: globalConfig.created_at,
    updated_at: globalConfig.updated_at,
  }
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
 * Handles both pod-specific configs and synthetic configs (from global).
 * For synthetic configs (id === -1), this is a no-op since global configs
 * don't track per-pod last_sent timestamps.
 */
export async function markConfigAsSent(
  configId: number,
): Promise<{ success: boolean; error?: string }> {
  // Synthetic ID means this config was derived from global config
  // We don't track last_sent per pod for global configs
  if (configId === -1) {
    console.log(
      '[WhatsApp Config] Skipping last_sent update for global-derived config',
    )
    return { success: true }
  }

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
 * Note: This is a pure utility function, not a server action.
 */
function getMessageHeader(
  config: PodWhatsAppConfig | null,
  defaultHeader: string,
): string {
  return config?.custom_message_header || defaultHeader
}

export { getMessageHeader }
