// ============================================================================
// WhatsApp Notification Types
// ============================================================================

// Schedule frequency options for WhatsApp summaries
export type ScheduleFrequency = 'daily' | 'weekly' | 'custom'

// Days of the week (0 = Sunday, 6 = Saturday)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

// Configuration for when to send scheduled summaries
export interface ScheduleConfig {
  frequency: ScheduleFrequency
  time: string // 24h format: '09:00', '14:30'
  timezone: string // e.g., 'America/New_York'
  days_of_week?: DayOfWeek[] // For weekly/custom: [1,2,3,4,5] = Mon-Fri
}

// A scheduled WhatsApp summary configuration Stored in `whatsapp_schedules` table
export interface WhatsAppSchedule {
  id: string
  pod_name: string // References pod.name (text)
  schedule: ScheduleConfig
  custom_message: string // Message shown before the client list
  is_active: boolean
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

// Ad account error record Stored in `ad_account_errors` table
export interface AdAccountError {
  id: string
  client_id: number
  error_type: string // 'invalid_token', 'account_disabled', 'rate_limited', etc.
  error_message: string
  first_detected_at: string
  last_alerted_at: string | null
  resolved_at: string | null
  is_resolved: boolean
}

// Input for creating an ad account error
export interface AdAccountErrorInput {
  client_id: number
  error_type: string
  error_message: string
}

// Result of sending a WhatsApp message
export interface WhatsAppSendResult {
  success: boolean
  messageId?: string
  error?: string
}

// Client needing response (used in scheduled summaries)
export interface ClientNeedingResponse {
  channel_name: string
  days_since_ixm_message: number
  guild_name: string
}
