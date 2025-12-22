export interface ArchiveAttachment {
  name: string
  discord_attachment_id: string
  message_id: string
  mime_type: string
  size: number
  object_key: string
}

export interface DiscordChannelArchive {
  id: string
  batch_id: string | null
  guild_id: string
  guild_name: string
  channel_id: string
  channel_name: string
  category_id: string | null
  category_name: string | null
  storage_prefix: string
  transcript_url: string | null
  attachments_prefix: string | null
  attachments_metadata: ArchiveAttachment[] | null
  message_count: number
  attachment_count: number
  duration_seconds: number | null
  requested_by_id: string | null
  requested_by_tag: string | null
  created_at: string
  completed_at: string | null
}
