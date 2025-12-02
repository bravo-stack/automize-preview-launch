'use server'

import { createAdminClient } from '@/lib/db/admin'
import type { WhatsAppSchedule, WhatsAppScheduleInput } from '@/types/whatsapp'

/**
 * Get all WhatsApp schedules for a pod
 */
export async function getSchedulesForPod(
  podName: string,
): Promise<WhatsAppSchedule[]> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('whatsapp_schedules')
    .select('*')
    .eq('pod_name', podName)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching schedules:', error)
    return []
  }

  return data || []
}

/**
 * Create a new WhatsApp schedule
 */
export async function createSchedule(
  input: WhatsAppScheduleInput,
): Promise<{ success: boolean; schedule?: WhatsAppSchedule; error?: string }> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('whatsapp_schedules')
    .insert({
      pod_name: input.pod_name,
      frequency: input.frequency,
      time: input.time,
      timezone: input.timezone,
      days_of_week: input.days_of_week || [1, 2, 3, 4, 5], // Default Mon-Fri
      custom_message: input.custom_message,
      is_active: input.is_active ?? true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating schedule:', error)
    return { success: false, error: error.message }
  }

  return { success: true, schedule: data }
}

/**
 * Update an existing WhatsApp schedule
 */
export async function updateSchedule(
  id: string,
  input: Partial<WhatsAppScheduleInput>,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  const { error } = await db
    .from('whatsapp_schedules')
    .update({
      ...(input.frequency && { frequency: input.frequency }),
      ...(input.time && { time: input.time }),
      ...(input.timezone && { timezone: input.timezone }),
      ...(input.days_of_week && { days_of_week: input.days_of_week }),
      ...(input.custom_message !== undefined && {
        custom_message: input.custom_message,
      }),
      ...(input.is_active !== undefined && { is_active: input.is_active }),
      // Note: updated_at is handled by database trigger
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating schedule:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Delete a WhatsApp schedule
 */
export async function deleteSchedule(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  const { error } = await db.from('whatsapp_schedules').delete().eq('id', id)

  if (error) {
    console.error('Error deleting schedule:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Toggle schedule active state
 */
export async function toggleScheduleActive(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  return updateSchedule(id, { is_active: isActive })
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
