import { DateTime, Duration } from 'luxon'

import type {
  ArchiveAttachment,
  DiscordChannelArchive,
} from '@/types/discord-archives'

export interface ArchiveFilters {
  guild?: string
  channel?: string
  category?: string
  batchId?: string
  startDate?: string
  endDate?: string
}

export interface ArchiveListResponse {
  archives: DiscordChannelArchive[]
  total: number
}

export const ARCHIVE_BUCKET = 'discord-archives'
export const PAGE_SIZE = 50
export const ARCHIVE_PAGE_SIZE = PAGE_SIZE

export const sanitizeWildcard = (value: string) =>
  value.replace(/[%_]/g, (match) => `\\${match}`)

export const buildSearchOr = (
  columnA: string,
  columnB: string,
  rawValue: string,
) => {
  const safeValue = sanitizeWildcard(rawValue.trim())
  if (!safeValue) return undefined
  return `${columnA}.ilike.%${safeValue}%,${columnB}.ilike.%${safeValue}%`
}

export const toUtcIso = (date?: string, endOfDay?: boolean) => {
  if (!date) return undefined
  const base = DateTime.fromISO(date, { zone: 'America/New_York' })
  if (!base.isValid) return undefined
  const zoned = endOfDay ? base.endOf('day') : base.startOf('day')
  return zoned.toUTC().toISO()
}

export const joinObjectKey = (prefix: string, filename: string) => {
  const normalizedPrefix = prefix.replace(/\/+$/g, '')
  const normalizedFile = filename.replace(/^\/+/, '')
  return `${normalizedPrefix}/${normalizedFile}`
}

export const formatArchiveDate = (iso: string | null) => {
  if (!iso) return '—'
  const dt = DateTime.fromISO(iso)
  if (!dt.isValid) return '—'
  return dt.setZone('America/New_York').toFormat('MMM d, yyyy • h:mm a ZZZZ')
}

export const formatDuration = (seconds?: number | null) => {
  if (seconds === undefined || seconds === null) return '—'
  const duration = Duration.fromObject({ seconds })
  const hours = Math.floor(duration.as('hours'))
  const minutes = Math.floor(duration.as('minutes') % 60)
  const parts = [] as string[]
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (!parts.length) {
    parts.push(`${Math.round(duration.as('seconds'))}s`)
  }
  return parts.join(' ')
}

export const formatBytes = (size?: number | null) => {
  if (size === undefined || size === null) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = size
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

export const sumMessages = (archives: DiscordChannelArchive[]) =>
  archives.reduce((total, archive) => total + (archive.message_count ?? 0), 0)

export const sumAttachments = (archives: DiscordChannelArchive[]) =>
  archives.reduce(
    (total, archive) => total + (archive.attachment_count ?? 0),
    0,
  )

export const flattenAttachments = (archive: DiscordChannelArchive) =>
  (archive.attachments_metadata ?? []) as ArchiveAttachment[]
