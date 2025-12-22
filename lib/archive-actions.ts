'use server'

import { DiscordChannelArchive } from '@/types/discord-archives'
import {
  ARCHIVE_BUCKET,
  ArchiveFilters,
  ArchiveListResponse,
  buildSearchOr,
  PAGE_SIZE,
  sanitizeWildcard,
  toUtcIso,
} from './archives'
import { createAdminClient } from './db/admin'

export async function getArchives(
  filters: ArchiveFilters,
  page = 0,
  pageSize = PAGE_SIZE,
): Promise<ArchiveListResponse> {
  const supabase = createAdminClient()

  let query = supabase
    .from('discord_channel_archives')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  const guildOr = filters.guild
    ? buildSearchOr('guild_name', 'guild_id', filters.guild)
    : undefined
  if (guildOr) {
    query = query.or(guildOr)
  }

  const channelOr = filters.channel
    ? buildSearchOr('channel_name', 'channel_id', filters.channel)
    : undefined
  if (channelOr) {
    query = query.or(channelOr)
  }

  const categoryOr = filters.category
    ? buildSearchOr('category_name', 'category_id', filters.category)
    : undefined
  if (categoryOr) {
    query = query.or(categoryOr)
  }

  if (filters.batchId) {
    query = query.ilike('batch_id', `%${sanitizeWildcard(filters.batchId)}%`)
  }

  const start = toUtcIso(filters.startDate)
  if (start) {
    query = query.gte('created_at', start)
  }

  const end = toUtcIso(filters.endDate, true)
  if (end) {
    query = query.lte('created_at', end)
  }

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    archives: (data ?? []) as DiscordChannelArchive[],
    total: count ?? 0,
  }
}

export async function getArchiveById(
  id: string,
): Promise<DiscordChannelArchive | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('discord_channel_archives')
    .select('*')
    .eq('id', id)
    .single()

  if (error?.code === 'PGRST116') {
    return null
  }

  if (error) {
    throw new Error(error.message)
  }

  return (data as DiscordChannelArchive) ?? null
}

export async function getSignedArchiveUrl(objectKey: string, expiresIn = 60) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(ARCHIVE_BUCKET)
    .createSignedUrl(objectKey, expiresIn)

  if (error) {
    throw new Error(error.message)
  }

  return data.signedUrl
}

export async function deleteArchives(
  ids: string[],
): Promise<{ deleted: number; failed: number }> {
  if (!ids.length) {
    return { deleted: 0, failed: 0 }
  }

  const supabase = createAdminClient()

  // First, get the archives to find their storage prefixes
  const { data: archives, error: fetchError } = await supabase
    .from('discord_channel_archives')
    .select('id, storage_prefix, attachments_prefix')
    .in('id', ids)

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let deleted = 0
  let failed = 0

  for (const archive of archives ?? []) {
    try {
      // Delete storage files if prefix exists
      if (archive.storage_prefix) {
        const { data: files } = await supabase.storage
          .from(ARCHIVE_BUCKET)
          .list(archive.storage_prefix)

        if (files && files.length > 0) {
          const filePaths = files.map(
            (f) => `${archive.storage_prefix}/${f.name}`,
          )
          await supabase.storage.from(ARCHIVE_BUCKET).remove(filePaths)
        }
      }

      // Delete the database record
      const { error: deleteError } = await supabase
        .from('discord_channel_archives')
        .delete()
        .eq('id', archive.id)

      if (deleteError) {
        failed += 1
      } else {
        deleted += 1
      }
    } catch {
      failed += 1
    }
  }

  return { deleted, failed }
}
