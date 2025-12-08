'use server'

import { createAdminClient } from '@/lib/db/admin'
import type {
  GlobalWhatsAppConfig,
  GlobalWhatsAppConfigInput,
  PodWhatsAppConfig,
  ScheduleFrequency,
} from '@/types/whatsapp'

// ============================================================================
// Global WhatsApp Configuration Actions
// ============================================================================
//
// ARCHITECTURE:
// We use the `pod_whatsapp_configs` table (no FK constraint) instead of
// `whatsapp_schedules` (which has FK to pod table).
//
// RELATIONSHIP BETWEEN GLOBAL AND INDIVIDUAL CONFIG:
// ------------------------------------------------
// 1. GLOBAL CONFIG: A single config with pod_name = '__GLOBAL__' serves as the
//    default for ALL pods. When no individual config exists for a pod, the
//    global config values are used.
//
// 2. INDIVIDUAL CONFIG: Each pod can have its own config that OVERRIDES the
//    global default. When present, the pod's individual config takes precedence.
//
// 3. PRECEDENCE FLOW:
//    - System checks: Does pod have individual config? → Use it
//    - Otherwise: Use global config as fallback
//
// This allows:
// - Setting company-wide defaults (e.g., daily summaries at 9 AM Mon-Fri)
// - Individual pods can opt-out or customize (e.g., different time, different days)
// - Easy management: Update global config → all pods without individual configs
//   automatically get the new settings
//
// ============================================================================

const GLOBAL_POD_NAME = '__GLOBAL__'

// Helper to convert PodWhatsAppConfig to GlobalWhatsAppConfig format
function toGlobalConfig(config: PodWhatsAppConfig): GlobalWhatsAppConfig {
  // Parse active_days from string "Mon,Tue,Wed" to array [1,2,3]
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  let days_of_week: number[] = [1, 2, 3, 4, 5] // Default weekdays
  if (config.active_days) {
    const dayNames = config.active_days.split(',').map((d) => d.trim())
    days_of_week = dayNames
      .map((name) => dayMap[name])
      .filter((d) => d !== undefined)
  }

  return {
    id: String(config.id),
    pod_name: '__GLOBAL__',
    frequency: config.frequency as ScheduleFrequency,
    time: config.scheduled_time, // e.g., '09:00:00'
    timezone: 'UTC', // pod_whatsapp_configs doesn't have timezone, default to UTC
    days_of_week: days_of_week as GlobalWhatsAppConfig['days_of_week'],
    custom_message: config.custom_message_header || '',
    is_active: config.is_active,
    last_sent_at: config.last_sent_at,
    created_at: config.created_at,
    updated_at: config.updated_at,
  }
}

// Helper to convert GlobalWhatsAppConfigInput to PodWhatsAppConfig format
function toPodConfigInput(input: GlobalWhatsAppConfigInput): {
  frequency: string
  scheduled_time: string
  active_days: string | null
  custom_message_header: string | null
  is_active: boolean
} {
  // Convert days_of_week array [1,2,3,4,5] to string "Mon,Tue,Wed,Thu,Fri"
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const days = input.days_of_week ?? [1, 2, 3, 4, 5]
  const active_days = days.map((d) => dayNames[d]).join(',')

  return {
    frequency: input.frequency,
    scheduled_time: input.time,
    active_days,
    custom_message_header: input.custom_message || null,
    is_active: input.is_active ?? true,
  }
}

/**
 * Get the global WhatsApp configuration
 * Returns null if no global config exists
 * Note: Returns config regardless of is_active status (for UI display)
 */
export async function getGlobalConfig(): Promise<GlobalWhatsAppConfig | null> {
  const db = createAdminClient()

  // We use 'daily_summary' as the canonical feature for global config
  const { data, error } = await db
    .from('pod_whatsapp_configs')
    .select('*')
    .eq('pod_name', GLOBAL_POD_NAME)
    .eq('feature_type', 'daily_summary')
    .single()

  if (error) {
    // PGRST116 = no rows found - expected if global config doesn't exist
    if (error.code !== 'PGRST116') {
      console.error('[Global Config] Error fetching global config:', error)
    }
    return null
  }

  return toGlobalConfig(data as PodWhatsAppConfig)
}

/**
 * Get the global WhatsApp configuration ONLY if it's active
 * Used by job runners to determine if notifications should be sent
 */
export async function getActiveGlobalConfig(): Promise<GlobalWhatsAppConfig | null> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('pod_whatsapp_configs')
    .select('*')
    .eq('pod_name', GLOBAL_POD_NAME)
    .eq('feature_type', 'daily_summary')
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error(
        '[Global Config] Error fetching active global config:',
        error,
      )
    }
    return null
  }

  return toGlobalConfig(data as PodWhatsAppConfig)
}

/**
 * Get all global configs (for backward compatibility with existing UI)
 * Returns array for consistency with pod configs
 */
export async function getAllGlobalConfigs(): Promise<GlobalWhatsAppConfig[]> {
  const config = await getGlobalConfig()
  return config ? [config] : []
}

/**
 * Create or update the global WhatsApp configuration
 */
export async function upsertGlobalConfig(
  input: GlobalWhatsAppConfigInput,
): Promise<{
  success: boolean
  config?: GlobalWhatsAppConfig
  error?: string
}> {
  const db = createAdminClient()

  // Validate frequency
  const validFrequencies: ScheduleFrequency[] = ['daily', 'weekly', 'custom']
  if (!validFrequencies.includes(input.frequency)) {
    return { success: false, error: 'Invalid frequency value' }
  }

  // Validate days_of_week if provided
  if (input.days_of_week) {
    const validDays = input.days_of_week.every((day) => day >= 0 && day <= 6)
    if (!validDays) {
      return { success: false, error: 'Invalid days_of_week values' }
    }
  }

  const podConfigInput = toPodConfigInput(input)

  // Upsert using pod_whatsapp_configs table
  const { data, error } = await db
    .from('pod_whatsapp_configs')
    .upsert(
      {
        pod_name: GLOBAL_POD_NAME,
        feature_type: 'daily_summary', // Use daily_summary as canonical feature
        ...podConfigInput,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'pod_name,feature_type',
      },
    )
    .select()
    .single()

  if (error) {
    console.error('[Global Config] Error upserting global config:', error)
    return { success: false, error: error.message }
  }

  return { success: true, config: toGlobalConfig(data as PodWhatsAppConfig) }
}

/**
 * Toggle global config active state
 */
export async function toggleGlobalConfigActive(
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  const { error } = await db
    .from('pod_whatsapp_configs')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('pod_name', GLOBAL_POD_NAME)
    .eq('feature_type', 'daily_summary')

  if (error) {
    console.error('[Global Config] Error toggling global config:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get effective configuration for a pod
 * Returns pod-specific config if exists AND is active, otherwise global config
 *
 * PRECEDENCE:
 * 1. Pod has individual config AND is_active = true → Use pod config
 * 2. Pod config doesn't exist OR is_active = false → Use global config
 *
 * This allows pods to "opt-out" by setting is_active = false, which
 * effectively reverts them to using the global default.
 */
export async function getEffectiveConfigForPod(
  podName: string,
): Promise<GlobalWhatsAppConfig | null> {
  const db = createAdminClient()

  // First try pod-specific config that is ACTIVE
  const { data: podConfig, error: podError } = await db
    .from('pod_whatsapp_configs')
    .select('*')
    .eq('pod_name', podName)
    .eq('feature_type', 'daily_summary')
    .eq('is_active', true) // Only use if active
    .single()

  if (podConfig && !podError) {
    return toGlobalConfig(podConfig as PodWhatsAppConfig)
  }

  // Fall back to global config (only if active)
  return getActiveGlobalConfig()
}

/**
 * Get all pod schedules (excluding global)
 * Returns pods that have individual configs that override the global default
 */
export async function getAllPodSchedules(): Promise<GlobalWhatsAppConfig[]> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('pod_whatsapp_configs')
    .select('*')
    .neq('pod_name', GLOBAL_POD_NAME)
    .eq('feature_type', 'daily_summary')
    .order('pod_name')

  if (error) {
    console.error('[Global Config] Error fetching pod schedules:', error)
    return []
  }

  return (data || []).map((d) => toGlobalConfig(d as PodWhatsAppConfig))
}

/**
 * Create or update a pod-specific schedule (override global default)
 */
export async function upsertPodSchedule(
  podName: string,
  input: GlobalWhatsAppConfigInput,
): Promise<{
  success: boolean
  config?: GlobalWhatsAppConfig
  error?: string
}> {
  const db = createAdminClient()
  const podConfigInput = toPodConfigInput(input)

  // Upsert using pod_whatsapp_configs table
  const { data, error } = await db
    .from('pod_whatsapp_configs')
    .upsert(
      {
        pod_name: podName,
        feature_type: 'daily_summary',
        ...podConfigInput,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'pod_name,feature_type',
      },
    )
    .select()
    .single()

  if (error) {
    console.error('[Pod Schedule] Error upserting schedule:', error)
    return { success: false, error: error.message }
  }

  return { success: true, config: toGlobalConfig(data as PodWhatsAppConfig) }
}

/**
 * Delete a pod-specific schedule (reverts pod to using global config)
 */
export async function deletePodSchedule(
  podName: string,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  const { error } = await db
    .from('pod_whatsapp_configs')
    .delete()
    .eq('pod_name', podName)
    .eq('feature_type', 'daily_summary')
    .neq('pod_name', GLOBAL_POD_NAME) // Safety: never delete global

  if (error) {
    console.error('[Pod Schedule] Error deleting schedule:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
