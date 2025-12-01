// ============================================================================
// WhatsApp Notification Types
// ============================================================================

// Schedule frequency options for WhatsApp summaries
export type ScheduleFrequency = 'daily' | 'weekly' | 'custom'

// Days of the week (0 = Sunday, 6 = Saturday)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

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
