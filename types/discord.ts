// ============================================================================
// Discord Message Log Types
// ============================================================================

// Source features that can trigger Discord messages
export type DiscordSourceFeature =
  | 'watchtower_alert'
  | 'daily_summary'
  | 'ad_error'
  | 'onboarding'
  | 'other'

// Delivery status for Discord messages
export type DiscordDeliveryStatus = 'sent' | 'failed'

// Discord message log entry (matches discord_message_logs table)
export interface DiscordMessageLog {
  id: number
  sent_at: string
  channel_name: string
  channel_id: string | null
  pod_name: string | null
  source_feature: DiscordSourceFeature
  message_content: string | null
  delivery_status: DiscordDeliveryStatus
  failure_reason: string | null
}

// Input for creating a Discord message log entry
export interface DiscordMessageLogInput {
  channel_name: string
  channel_id?: string | null
  pod_name?: string | null
  source_feature: DiscordSourceFeature
  message_content?: string | null
  delivery_status: DiscordDeliveryStatus
  failure_reason?: string | null
}