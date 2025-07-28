// Types for communication reports based on the database schema

export interface CommunicationReport {
  id: number
  created_at: string
  channel_name: string | null
  last_client_message_at: string | null
  days_since_client_message: number | null
  last_ixm_message_at: string | null
  days_since_ixm_message: number | null
  status: string | null
  guild_name: string | null
  report_date: string | null
  category_name: string | null
  last_client_user_id: string | null
  last_client_username: string | null
  last_client_is_orphaned: boolean | null
  last_team_user_id: string | null
  last_team_username: string | null
  last_team_is_orphaned: boolean | null
  status_notes: string | null
  guild_id: string | null
  channel_id: string | null
  last_team_message_at: string | null
  days_since_team_message: number | null
  processed_at: string | null
}

export interface Pod {
  guild_name: string
  guild_id: string
}

export interface CommunicationsAuditData {
  reports: CommunicationReport[]
  availableDates: string[]
  availablePods: Pod[]
  latestDate: string | null
}

export type SortOption =
  | 'not_replied'
  | 'replied'
  | 'alphabetical'
  | 'inactive'
  | 'transferred'
  | 'left_pod'

export type StatusFilter =
  | 'all'
  | 'not_replied_48h'
  | 'not_messaged_7d'
  | 'responded'
  | 'inactive'
  | 'transferred'
  | 'left_pod'
