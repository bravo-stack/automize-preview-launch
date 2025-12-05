'use server'

import { createAdminClient } from '@/lib/db/admin'
import type { PodWhatsAppConfig, WaFeatureType } from '@/types/whatsapp'

/**
 * Get all WhatsApp configs for a pod
 */
export async function getConfigsForPod(
  podName: string,
): Promise<PodWhatsAppConfig[]> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('pod_whatsapp_configs')
    .select('*')
    .eq('pod_name', podName)
    .order('feature_type', { ascending: true })

  if (error) {
    console.error('Error fetching configs:', error)
    return []
  }

  return data || []
}

/**
 * Get a specific config for a pod and feature
 */
export async function getConfig(
  podName: string,
  featureType: WaFeatureType,
): Promise<PodWhatsAppConfig | null> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('pod_whatsapp_configs')
    .select('*')
    .eq('pod_name', podName)
    .eq('feature_type', featureType)
    .single()

  if (error) {
    console.error('Error fetching config:', error)
    return null
  }

  return data
}

/**
 * Create or update a WhatsApp config (upsert)
 */
export async function upsertConfig(input: {
  pod_name: string
  feature_type: WaFeatureType
  is_active: boolean
  custom_message_header: string | null
  frequency: string
  scheduled_time: string
  active_days: string | null
}): Promise<{ success: boolean; config?: PodWhatsAppConfig; error?: string }> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('pod_whatsapp_configs')
    .upsert(
      {
        pod_name: input.pod_name,
        feature_type: input.feature_type,
        is_active: input.is_active,
        custom_message_header: input.custom_message_header,
        frequency: input.frequency,
        scheduled_time: input.scheduled_time,
        active_days: input.active_days,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'pod_name,feature_type',
      },
    )
    .select()
    .single()

  if (error) {
    console.error('Error upserting config:', error)
    return { success: false, error: error.message }
  }

  return { success: true, config: data }
}

/**
 * Toggle config active state
 */
export async function toggleConfigActive(
  podName: string,
  featureType: WaFeatureType,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  const { error } = await db
    .from('pod_whatsapp_configs')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('pod_name', podName)
    .eq('feature_type', featureType)

  if (error) {
    console.error('Error toggling config:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Delete a WhatsApp config
 */
export async function deleteConfig(
  podName: string,
  featureType: WaFeatureType,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  const { error } = await db
    .from('pod_whatsapp_configs')
    .delete()
    .eq('pod_name', podName)
    .eq('feature_type', featureType)

  if (error) {
    console.error('Error deleting config:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update the pod's WhatsApp number
 */
export async function updatePodWhatsAppNumber(
  podName: string,
  whatsappNumber: string,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  // E.164 format validation (e.g., +1234567890)
  const cleanNumber = whatsappNumber.replace(/\s/g, '')
  if (cleanNumber && !cleanNumber.match(/^\+?[1-9]\d{6,14}$/)) {
    return {
      success: false,
      error: 'Invalid phone number format (use E.164: +1234567890)',
    }
  }

  const { error } = await db
    .from('pod')
    .update({ whatsapp_number: cleanNumber || null })
    .eq('name', podName)

  if (error) {
    console.error('Error updating WhatsApp number:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
