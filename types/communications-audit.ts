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
  last_client_is_former_member: boolean | null
  last_team_user_id: string | null
  last_team_username: string | null
  last_team_is_former_member: boolean | null
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
  previousDayReports?: CommunicationReport[]
  availableDates: string[]
  availablePods: Pod[]
  latestDate: string | null
}

export type SortOption =
  | 'high_priority'
  | 'medium_priority'
  | 'low_priority'
  | 'alphabetical'
  | 'category'
  | 'inactive'
  | 'transferred'
  | 'churned'

export type StatusFilter =
  | 'all'
  | 'ixm_no_reach_48h'
  | 'client_silent_5d'
  | 'client_awaiting_team'
  | 'active_communication'
  | 'no_messages'
  | 'team_only'
  | 'client_only_no_team'
  | 'inactive'
  | 'transferred'
  | 'churned'
  | 'imessage'
