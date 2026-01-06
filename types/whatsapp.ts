// ============================================================================
// WhatsApp Notification Types
// ============================================================================

import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message'

// Feature types matching the database enum
// Note: 'late_alert' is handled by the Discord NodeJS service
export type WaFeatureType = 'daily_summary' | 'ad_error'

// Schedule frequency options for WhatsApp summaries
export type ScheduleFrequency = 'daily' | 'weekly' | 'custom'

// Days of the week (0 = Sunday, 6 = Saturday)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

// Configuration for pod WhatsApp notifications
export interface PodWhatsAppConfig {
  id: number
  pod_name: string
  feature_type: WaFeatureType
  is_active: boolean
  custom_message_header: string | null
  frequency: string // 'daily', 'weekly', etc.
  scheduled_time: string // TIME format: '09:00:00'
  active_days: string | null // e.g., 'Mon,Tue,Wed' or null for all days
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

// A scheduled WhatsApp summary configuration stored in `whatsapp_schedules` table
export interface WhatsAppSchedule {
  id: string
  pod_name: string // References pod.name (text)
  frequency: ScheduleFrequency
  time: string // TIME column: '09:00' format (stored as TIME in PostgreSQL)
  timezone: string // IANA timezone string, defaults to 'UTC'
  days_of_week: DayOfWeek[] // 0 = Sunday, 6 = Saturday; defaults to [1,2,3,4,5]
  custom_message: string // Message shown before the client list
  is_active: boolean
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

// Input for creating/updating a schedule
export interface WhatsAppScheduleInput {
  pod_name: string // References pod.name (text)
  frequency: ScheduleFrequency
  time: string
  timezone: string
  days_of_week?: DayOfWeek[]
  custom_message: string
  is_active?: boolean
}

// Result of sending a WhatsApp message
export interface WhatsAppSendResult {
  success: boolean
  date_created?: Date | string | null
  delivery_status?: WhatsAppDeliveryStatus
  messageId?: string
  error?: string
}

// Client needing response (used in scheduled summaries)
export interface ClientNeedingResponse {
  channel_name: string
  days_since_ixm_message: number
  guild_name: string
}

// Global WhatsApp configuration that applies to all pods as default
// Uses the whatsapp_schedules table with a special "__GLOBAL__" pod_name
export interface GlobalWhatsAppConfig {
  id: string
  pod_name: '__GLOBAL__'
  frequency: ScheduleFrequency
  time: string // TIME format: '09:00' (stored as TIME in PostgreSQL)
  timezone: string // IANA timezone string, defaults to 'UTC'
  days_of_week: DayOfWeek[] // 0 = Sunday, 6 = Saturday; defaults to [1,2,3,4,5]
  custom_message: string // Message shown before the client list
  is_active: boolean
  last_sent_at: string | null
  created_at: string
  updated_at: string
  // Feature-specific fields (extending the table purpose)
  feature_type?: WaFeatureType
}

// Input for creating/updating global config
export interface GlobalWhatsAppConfigInput {
  frequency: ScheduleFrequency
  time: string
  timezone: string
  days_of_week?: DayOfWeek[]
  custom_message: string
  is_active?: boolean
}

// Pod with WhatsApp information for the main page
export interface PodWithWhatsApp {
  id: string
  name: string
  user_id: string | null
  whatsapp_number: string | null
}

// ============================================================================
// WhatsApp Message Log Types
// ============================================================================

// Source features that can trigger WhatsApp messages
export type WhatsAppSourceFeature =
  | 'daily_summary'
  | 'ad_error'
  | 'watchtower_alert'

// Delivery status for WhatsApp messages
export type WhatsAppDeliveryStatus = MessageInstance['status']

// WhatsApp message log entry (matches whatsapp_message_logs table)
export interface WhatsAppMessageLog {
  id: number
  sent_at: string
  pod_name: string
  recipient_name: string | null
  recipient_phone_number: string
  source_feature: WhatsAppSourceFeature
  message_content: string | null
  delivery_status: WhatsAppDeliveryStatus
  twilio_message_sid: string | null
  failure_reason: string | null
}

// Input for creating a WhatsApp message log entry
export interface WhatsAppMessageLogInput {
  pod_name: string
  recipient_name?: string | null
  recipient_phone_number: string
  source_feature: WhatsAppSourceFeature
  message_content?: string | null
  delivery_status: WhatsAppDeliveryStatus | undefined
  twilio_message_sid?: string | null
  failure_reason?: string | null
}

// ============================================================================
// Status Tracking & History Types
// ============================================================================

// Twilio WhatsApp-specific status callback payload
export interface TwilioWhatsAppStatusPayload {
  MessageSid: string
  MessageStatus: string
  To: string
  From: string
  AccountSid: string
  ApiVersion?: string
  // Error fields (present when status is 'failed' or 'undelivered')
  ErrorCode?: string
  ErrorMessage?: string
  // WhatsApp-specific fields
  ChannelPrefix?: 'whatsapp'
  ChannelInstallSid?: string
  ChannelStatusMessage?: string
  EventType?: 'READ' | string // 'READ' when message is read by recipient
}

/**
 * Status history entry for audit trail
 * Tracks each status change for a message
 */
export interface WhatsAppStatusHistoryEntry {
  id: number
  message_log_id: number
  twilio_message_sid: string
  previous_status: WhatsAppDeliveryStatus | null
  new_status: WhatsAppDeliveryStatus
  changed_at: string
  error_code?: string | null
  error_message?: string | null
  event_type?: string | null // e.g., 'READ' for read receipts
}

/**
 * Input for creating a status history entry
 */
export interface WhatsAppStatusHistoryInput {
  message_log_id: number
  twilio_message_sid: string
  previous_status: WhatsAppDeliveryStatus | null
  new_status: WhatsAppDeliveryStatus
  error_code?: string | null
  error_message?: string | null
  event_type?: string | null
}

/**
 * Extended message log with read receipt tracking
 */
export interface WhatsAppMessageLogExtended extends WhatsAppMessageLog {
  is_read: boolean
  read_at: string | null
  status_updated_at: string | null
  twilio_error_code: string | null
}

/**
 * Result from background sync job
 */
export interface WhatsAppSyncJobResult {
  processed: number
  updated: number
  failed: number
  errors: Array<{ messageSid: string; error: string }>
}

/**
 * Terminal statuses that don't need further tracking
 */
export const TERMINAL_STATUSES: WhatsAppDeliveryStatus[] = [
  'delivered',
  'read',
  'failed',
  'undelivered',
]

/**
 * Pending statuses that may need sync
 */
export const PENDING_STATUSES: WhatsAppDeliveryStatus[] = [
  'queued',
  'accepted',
  'sending',
  'sent',
]
