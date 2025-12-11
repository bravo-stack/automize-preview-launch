'use client'
/* eslint-disable @next/next/no-img-element */

import { Button } from '@/components/ui/button'
import { useArchiveDetails, useSignedUrl } from '@/hooks/use-archives'
import { getSignedArchiveUrl } from '@/lib/archive-actions'
import {
  formatArchiveDate,
  formatBytes,
  formatDuration,
  joinObjectKey,
} from '@/lib/archives'
import { cn } from '@/lib/utils'
import type { ArchiveAttachment } from '@/types/discord-archives'
import {
  ArrowLeft,
  CalendarClock,
  Clipboard,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Maximize2,
  MessageSquare,
  Paperclip,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

interface ArchiveDetailProps {
  archiveId: string
  fontClass: string
}

const numberFormatter = new Intl.NumberFormat('en-US')

export function ArchiveDetail({ archiveId, fontClass }: ArchiveDetailProps) {
  const {
    data: archive,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useArchiveDetails(archiveId)

  const transcriptKey = archive?.storage_prefix
    ? joinObjectKey(archive.storage_prefix, 'transcript.txt')
    : undefined

  const transcriptQuery = useSignedUrl(transcriptKey, 60, {
    enabled: Boolean(transcriptKey),
  })

  const attachments = useMemo(
    () => (archive?.attachments_metadata ?? []) as ArchiveAttachment[],
    [archive?.attachments_metadata],
  )

  const previewableAttachments = useMemo(
    () => attachments.filter(isImageAttachment),
    [attachments],
  )

  const [transcriptContent, setTranscriptContent] = useState('')
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    if (!transcriptQuery.data) {
      setTranscriptContent('')
      return
    }

    let cancelled = false
    setTranscriptError(null)
    setTranscriptContent('')

    const loadTranscript = async () => {
      try {
        const response = await fetch(transcriptQuery.data)
        if (!response.ok) throw new Error('Failed to load transcript')
        const text = await response.text()
        if (!cancelled) {
          setTranscriptContent(text)
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error)
          setTranscriptError(
            'Unable to load transcript preview. Use the external link instead.',
          )
        }
      }
    }

    loadTranscript()

    return () => {
      cancelled = true
    }
  }, [transcriptQuery.data])

  useEffect(() => {
    if (!archive || !previewableAttachments.length) {
      setPreviewUrls({})
      setPreviewLoading(false)
      return
    }

    let cancelled = false

    const loadPreviews = async () => {
      setPreviewLoading(true)
      const entries: [string, string][] = []
      for (const attachment of previewableAttachments) {
        const objectKey =
          attachment.object_key ??
          (archive.attachments_prefix
            ? joinObjectKey(archive.attachments_prefix, attachment.name)
            : undefined)

        if (!objectKey) continue

        try {
          const url = await getSignedArchiveUrl(objectKey, 60)
          entries.push([attachment.discord_attachment_id, url])
        } catch (error) {
          console.error(error)
        }
      }

      if (!cancelled) {
        setPreviewUrls(Object.fromEntries(entries))
        setPreviewLoading(false)
      }
    }

    loadPreviews().catch((error) => {
      console.error(error)
      if (!cancelled) setPreviewLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [archive, previewableAttachments])

  const transcriptLoading =
    transcriptQuery.isLoading || transcriptQuery.isFetching

  const copyToClipboard = async (label: string, value?: string | null) => {
    if (!value) {
      toast.error(`Missing ${label}`)
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch (error) {
      console.error(error)
      toast.error('Unable to copy value')
    }
  }

  const getAutomizeLink = () =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/dashboard/archives/${archiveId}`
      : `/dashboard/archives/${archiveId}`

  const openTranscriptExternally = async () => {
    if (!transcriptKey) {
      toast.error('Transcript unavailable')
      return
    }

    const currentUrl = transcriptQuery.data
    if (currentUrl) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer')
      return
    }

    const { data, error } = await transcriptQuery.refetch()
    if (error || !data) {
      toast.error('Unable to sign transcript URL')
      return
    }
    window.open(data, '_blank', 'noopener,noreferrer')
  }

  const refreshTranscript = () => {
    if (!transcriptKey) {
      toast.error('Transcript path missing')
      return
    }
    transcriptQuery.refetch()
  }

  const handleAttachmentLink = async (attachment: ArchiveAttachment) => {
    const objectKey = attachment.object_key
      ? attachment.object_key
      : archive?.attachments_prefix
        ? joinObjectKey(archive.attachments_prefix, attachment.name)
        : null

    if (!objectKey) {
      toast.error('Missing attachment key')
      return
    }

    try {
      const url = await getSignedArchiveUrl(objectKey, 60)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error(error)
      toast.error('Unable to sign attachment URL')
    }
  }

  if (isLoading) {
    return <DetailSkeleton fontClass={fontClass} />
  }

  if (isError) {
    return <DetailError fontClass={fontClass} onRetry={refetch} />
  }

  if (!archive) {
    return <DetailEmpty fontClass={fontClass} />
  }

  return (
    <main
      className={cn(
        'min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black px-4 py-10 text-white md:px-8',
        fontClass,
      )}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            asChild
            variant="ghost"
            className="text-zinc-300 hover:text-white"
          >
            <Link href="/dashboard/archives">
              <ArrowLeft className="size-4" /> Back to archives
            </Link>
          </Button>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-zinc-500">
            <ShieldCheck className="size-4" /> Internal only
          </p>
        </div>

        <header className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_25px_80px_-40px_rgba(0,0,0,0.8)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
                Archive summary
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                {archive.guild_name} /
                <span className="text-zinc-300"> #{archive.channel_name}</span>
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Requested by {archive.requested_by_tag ?? 'unknown'} ·{' '}
                {formatArchiveDate(archive.created_at)}
              </p>
              {archive.completed_at ? (
                <p className="text-xs text-zinc-500">
                  Completed {formatArchiveDate(archive.completed_at)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="rounded-2xl bg-white px-6 text-black hover:bg-zinc-200"
                onClick={openTranscriptExternally}
                disabled={transcriptLoading || isFetching}
              >
                {transcriptLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ExternalLink className="size-4" />
                )}
                Open transcript
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() =>
                  copyToClipboard('Automize link', getAutomizeLink())
                }
              >
                <LinkIcon className="size-4" /> Copy link
              </Button>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <MetaStat
              label="Messages"
              value={numberFormatter.format(archive.message_count)}
              icon={<MessageSquare className="size-4" />}
            />
            <MetaStat
              label="Attachments"
              value={numberFormatter.format(archive.attachment_count)}
              icon={<Paperclip className="size-4" />}
            />
            <MetaStat
              label="Duration"
              value={formatDuration(archive.duration_seconds)}
              icon={<CalendarClock className="size-4" />}
            />
          </dl>
        </header>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Metadata</h2>
              <p className="text-sm text-zinc-500">
                All identifiers stay private—copy them as needed when syncing
                with IXM bot logs.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <MetadataList
              title="Discord context"
              items={[
                ['Guild ID', archive.guild_id],
                ['Channel ID', archive.channel_id],
                ['Category', archive.category_name ?? '—'],
                [
                  'Batch ID',
                  archive.batch_id ?? '—',
                  archive.batch_id
                    ? () => copyToClipboard('Batch ID', archive.batch_id)
                    : undefined,
                ],
              ]}
            />
            <MetadataList
              title="Storage"
              items={[
                [
                  'Storage prefix',
                  archive.storage_prefix ?? '—',
                  archive.storage_prefix
                    ? () =>
                        copyToClipboard(
                          'Storage prefix',
                          archive.storage_prefix,
                        )
                    : undefined,
                ],
                ['Transcript key', transcriptKey ?? '—'],
                ['Attachments prefix', archive.attachments_prefix ?? '—'],
                ['Requested by', archive.requested_by_tag ?? '—'],
              ]}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Transcript</h2>
              <p className="text-sm text-zinc-500">
                Preview updates from a signed URL every time you refresh this
                view.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={refreshTranscript}
                disabled={transcriptLoading}
              >
                <RefreshCw className="size-4" /> Refresh link
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="bg-white text-black hover:bg-zinc-200"
                onClick={openTranscriptExternally}
                disabled={transcriptLoading}
              >
                <Maximize2 className="size-4" /> Open in new tab
              </Button>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/60 p-4">
            {transcriptLoading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="size-4 animate-spin" /> Generating signed
                URL…
              </div>
            ) : transcriptError ? (
              <div className="text-sm text-red-200">{transcriptError}</div>
            ) : transcriptContent ? (
              <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap text-sm text-zinc-200">
                {transcriptContent}
              </pre>
            ) : transcriptKey ? (
              <p className="text-sm text-zinc-500">
                Transcript ready. Use the buttons above to refresh or open it.
              </p>
            ) : (
              <p className="text-sm text-zinc-500">
                Transcript file is not available for this archive.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Attachments</h2>
              <p className="text-sm text-zinc-500">
                {attachments.length} file{attachments.length === 1 ? '' : 's'}{' '}
                captured · {previewableAttachments.length} inline preview
                {previewableAttachments.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          {attachments.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-zinc-500">
              No attachments were archived for this request.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {attachments.map((attachment) => (
                <AttachmentCard
                  key={attachment.discord_attachment_id}
                  attachment={attachment}
                  previewUrl={previewUrls[attachment.discord_attachment_id]}
                  loadingPreview={previewLoading}
                  onOpen={() => handleAttachmentLink(attachment)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function MetadataList({
  title,
  items,
}: {
  title: string
  items: [string, string, (() => void)?][]
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
        {title}
      </p>
      <dl className="mt-4 space-y-3 text-sm">
        {items.map(([label, value, onCopy]) => (
          <div
            key={label}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <dt className="text-zinc-500">{label}</dt>
            <dd className="text-white">
              <span className="mr-2 text-zinc-100">{value}</span>
              {onCopy ? (
                <button
                  type="button"
                  className="text-xs text-white/70 hover:text-white"
                  onClick={onCopy}
                >
                  <Clipboard className="mr-1 inline size-3" /> Copy
                </button>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function AttachmentCard({
  attachment,
  previewUrl,
  loadingPreview,
  onOpen,
}: {
  attachment: ArchiveAttachment
  previewUrl?: string
  loadingPreview: boolean
  onOpen: () => void
}) {
  const isImage = isImageAttachment(attachment)

  return (
    <div className="rounded-3xl border border-white/10 bg-black/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{attachment.name}</p>
          <p className="text-xs text-zinc-500">
            {attachment.mime_type ?? 'Unknown type'} ·{' '}
            {formatBytes(attachment.size)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={onOpen}
        >
          <Download className="size-4" /> Download
        </Button>
      </div>
      {isImage ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/60">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={attachment.name}
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
              {loadingPreview ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading preview…
                </>
              ) : (
                'Preview not ready. Try again shortly.'
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
          <ImageIcon className="mr-2 inline size-4" /> Inline preview not
          supported for this file type.
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
        <span>Message {attachment.message_id ?? '—'}</span>
        <Button
          type="button"
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={onOpen}
        >
          <ExternalLink className="size-3.5" /> Open in new tab
        </Button>
      </div>
    </div>
  )
}

const DetailSkeleton = ({ fontClass }: { fontClass: string }) => (
  <div className={cn('min-h-screen bg-black px-4 py-12', fontClass)}>
    <div className="mx-auto max-w-5xl space-y-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-3xl bg-white/5"
        />
      ))}
    </div>
  </div>
)

const DetailError = ({
  fontClass,
  onRetry,
}: {
  fontClass: string
  onRetry: () => void
}) => (
  <div
    className={cn(
      'min-h-screen bg-black px-4 py-12 text-center text-red-200',
      fontClass,
    )}
  >
    <div className="mx-auto max-w-md space-y-4">
      <p className="text-lg font-semibold">Unable to load archive metadata.</p>
      <Button variant="secondary" onClick={onRetry}>
        <RefreshCw className="size-4" /> Retry
      </Button>
    </div>
  </div>
)

const DetailEmpty = ({ fontClass }: { fontClass: string }) => (
  <div
    className={cn(
      'min-h-screen bg-black px-4 py-12 text-center text-zinc-300',
      fontClass,
    )}
  >
    <div className="mx-auto max-w-md space-y-3">
      <p className="text-lg font-semibold">Archive not found</p>
      <p className="text-sm text-zinc-500">
        Double-check the identifier that the IXM bot shared and try again.
      </p>
      <Button asChild variant="ghost" className="text-white">
        <Link href="/dashboard/archives">
          <ArrowLeft className="size-4" /> Return to list
        </Link>
      </Button>
    </div>
  </div>
)

function MetaStat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
        <span className="text-white/70">{icon}</span>
        {value}
      </p>
    </div>
  )
}

const isImageAttachment = (attachment: ArchiveAttachment) =>
  Boolean(attachment.mime_type?.startsWith('image/'))
