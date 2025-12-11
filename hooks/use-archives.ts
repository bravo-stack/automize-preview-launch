'use client'

import type { UseQueryResult } from '@tanstack/react-query'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import {
  getArchiveById,
  getArchives,
  getSignedArchiveUrl,
} from '@/lib/archive-actions'
import type { ArchiveFilters, ArchiveListResponse } from '@/lib/archives'
import type { DiscordChannelArchive } from '@/types/discord-archives'

export const useArchives = (
  filters: ArchiveFilters,
  page: number,
): UseQueryResult<ArchiveListResponse, Error> =>
  useQuery<ArchiveListResponse, Error>({
    queryKey: ['archives', filters, page],
    queryFn: () => getArchives(filters, page),
    placeholderData: keepPreviousData,
  })

export const useArchiveDetails = (
  archiveId?: string,
): UseQueryResult<DiscordChannelArchive | null, Error> =>
  useQuery<DiscordChannelArchive | null, Error>({
    queryKey: ['archive-detail', archiveId],
    queryFn: () => getArchiveById(archiveId!),
    enabled: Boolean(archiveId),
    refetchOnWindowFocus: 'always',
    retry: 1,
  })

export const useSignedUrl = (
  objectKey?: string,
  expiresIn = 60,
  { enabled }: { enabled?: boolean } = {},
): UseQueryResult<string, Error> =>
  useQuery<string, Error>({
    queryKey: ['signed-url', objectKey, expiresIn],
    queryFn: () => getSignedArchiveUrl(objectKey!, expiresIn),
    enabled: enabled ?? Boolean(objectKey),
    staleTime: 0,
    gcTime: 60 * 1000,
    refetchOnWindowFocus: 'always',
    retry: 1,
  })
