'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useArchives } from '@/hooks/use-archives'
import { deleteArchives, getSignedArchiveUrl } from '@/lib/archive-actions'
import {
  ARCHIVE_PAGE_SIZE,
  ArchiveFilters,
  formatArchiveDate,
  formatDuration,
  joinObjectKey,
  sumAttachments,
  sumMessages,
} from '@/lib/archives'
import { cn } from '@/lib/utils'
import type { DiscordChannelArchive } from '@/types/discord-archives'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import {
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Server,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import type { ChangeEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

interface ArchiveDirectoryProps {
  fontClass: string
}

interface CategoryGroup {
  key: string
  label: string
  archives: DiscordChannelArchive[]
  messageCount: number
  attachmentCount: number
}

interface ServerGroup {
  guildId: string
  guildName: string
  categories: CategoryGroup[]
  archiveCount: number
  messageCount: number
  attachmentCount: number
}

const numberFormatter = new Intl.NumberFormat('en-US')

const initialFilters = {
  guild: '',
  channel: '',
  category: '',
  batchId: '',
  startDate: '',
  endDate: '',
}

type FilterFormState = typeof initialFilters

const toQueryFilters = (formState: FilterFormState): ArchiveFilters => ({
  guild: formState.guild || undefined,
  channel: formState.channel || undefined,
  category: formState.category || undefined,
  batchId: formState.batchId || undefined,
  startDate: formState.startDate || undefined,
  endDate: formState.endDate || undefined,
})

const categoryLabel = (archive: DiscordChannelArchive) =>
  archive.category_name?.trim() || 'Uncategorized'

const formatCount = (value: number) => numberFormatter.format(value)

function groupByServer(archives: DiscordChannelArchive[]): ServerGroup[] {
  const serverMap = new Map<
    string,
    {
      guildId: string
      guildName: string
      categoryMap: Map<string, DiscordChannelArchive[]>
    }
  >()

  for (const archive of archives) {
    const guildId = archive.guild_id
    const guildName = archive.guild_name || 'Unknown Server'
    const catKey = categoryLabel(archive)

    if (!serverMap.has(guildId)) {
      serverMap.set(guildId, {
        guildId,
        guildName,
        categoryMap: new Map(),
      })
    }

    const server = serverMap.get(guildId)!
    if (!server.categoryMap.has(catKey)) {
      server.categoryMap.set(catKey, [])
    }
    server.categoryMap.get(catKey)!.push(archive)
  }

  const result: ServerGroup[] = []

  Array.from(serverMap.values()).forEach((server) => {
    const categories: CategoryGroup[] = []

    Array.from(server.categoryMap.entries()).forEach(
      ([catKey, catArchives]) => {
        categories.push({
          key: catKey,
          label: catKey,
          archives: catArchives,
          messageCount: sumMessages(catArchives),
          attachmentCount: sumAttachments(catArchives),
        })
      },
    )

    categories.sort((a, b) => a.label.localeCompare(b.label))

    const archiveCount = categories.reduce(
      (sum, cat) => sum + cat.archives.length,
      0,
    )
    const messageCount = categories.reduce(
      (sum, cat) => sum + cat.messageCount,
      0,
    )
    const attachmentCount = categories.reduce(
      (sum, cat) => sum + cat.attachmentCount,
      0,
    )

    result.push({
      guildId: server.guildId,
      guildName: server.guildName,
      categories,
      archiveCount,
      messageCount,
      attachmentCount,
    })
  })

  result.sort((a, b) => a.guildName.localeCompare(b.guildName))
  return result
}

export default function ArchiveDirectory({ fontClass }: ArchiveDirectoryProps) {
  const [formState, setFormState] = useState(initialFilters)
  const filters = useMemo(() => toQueryFilters(formState), [formState])
  const [page, setPage] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  )

  const { data, isLoading, isFetching, isError, refetch } = useArchives(
    filters,
    page,
  )

  const archives = useMemo(() => data?.archives ?? [], [data])
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE))

  useEffect(() => {
    setPage(0)
  }, [filters])

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>()
      archives.forEach((archive) => {
        if (prev.has(archive.id)) next.add(archive.id)
      })
      return next
    })
  }, [archives])

  const serverGroups = useMemo(() => groupByServer(archives), [archives])

  useEffect(() => {
    const keys = new Set<string>()
    serverGroups.forEach((server) => keys.add(server.guildId))
    setExpandedCategories(keys)
  }, [serverGroups])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleCategorySelection = (group: CategoryGroup) => {
    const ids = group.archives.map((archive) => archive.id)
    const allSelected = ids.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => {
        if (allSelected) {
          next.delete(id)
        } else {
          next.add(id)
        }
      })
      return next
    })
  }

  const handleInputChange = (key: keyof FilterFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFormState(initialFilters)
  }

  const selectedArchives = useMemo(
    () => archives.filter((archive) => selectedIds.has(archive.id)),
    [archives, selectedIds],
  )

  const selectedCount = selectedIds.size

  const handleCopySlug = async (archiveId: string) => {
    const origin = window?.location?.origin ?? ''
    const link = origin
      ? `${origin}/dashboard/archives/${archiveId}`
      : `/dashboard/archives/${archiveId}`

    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copied')
    } catch (error) {
      console.error(error)
      toast.error('Failed to copy link')
    }
  }

  const handleTranscriptDownload = async () => {
    if (!selectedArchives.length) return

    const loading = toast.loading('Downloading transcripts & attachments...')

    try {
      const zip = new JSZip()

      const results = await Promise.allSettled(
        selectedArchives.map(async (archive) => {
          if (!archive.storage_prefix) throw new Error('Missing storage prefix')

          // Create a folder for this archive: "server-channel-id/"
          const folderName = `${archive.channel_name}-${archive.guild_name}-${archive.id.slice(0, 8)}`
          const archiveFolder = zip.folder(folderName)
          if (!archiveFolder) throw new Error('Failed to create folder')

          // Fetch transcript
          const transcriptKey = joinObjectKey(
            archive.storage_prefix,
            'transcript.txt',
          )
          const transcriptUrl = await getSignedArchiveUrl(transcriptKey, 120)
          const transcriptResponse = await fetch(transcriptUrl)
          if (!transcriptResponse.ok)
            throw new Error('Failed to fetch transcript')
          const transcriptText = await transcriptResponse.text()
          archiveFolder.file('transcript.txt', transcriptText)

          // Fetch attachments if any
          if (
            archive.attachments_metadata &&
            archive.attachments_metadata.length > 0
          ) {
            const attachmentsFolder = archiveFolder.folder('attachments')
            if (!attachmentsFolder)
              throw new Error('Failed to create attachments folder')

            const attachmentResults = await Promise.allSettled(
              archive.attachments_metadata.map(async (attachment) => {
                const attachmentUrl = await getSignedArchiveUrl(
                  attachment.object_key,
                  120,
                )
                const attachmentResponse = await fetch(attachmentUrl)
                if (!attachmentResponse.ok)
                  throw new Error(
                    `Failed to fetch attachment ${attachment.name}`,
                  )
                const attachmentBlob = await attachmentResponse.blob()
                // Use message_id prefix so user knows which message the attachment belongs to
                const attachmentFileName = `${attachment.message_id.slice(-8)}_${attachment.name}`
                return { fileName: attachmentFileName, blob: attachmentBlob }
              }),
            )

            attachmentResults.forEach((result) => {
              if (result.status === 'fulfilled') {
                attachmentsFolder.file(result.value.fileName, result.value.blob)
              }
            })
          }

          return { folderName }
        }),
      )

      let successCount = 0
      let failureCount = 0

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          successCount += 1
        } else {
          failureCount += 1
        }
      })

      if (successCount > 0) {
        const blob = await zip.generateAsync({ type: 'blob' })
        saveAs(
          blob,
          `ixm-archives-${new Date().toISOString().slice(0, 10)}.zip`,
        )
        toast.success(
          `Downloaded ${successCount} archive${successCount > 1 ? 's' : ''} with attachments`,
        )
      }
      if (failureCount > 0) {
        toast.error(
          `${failureCount} archive${failureCount > 1 ? 's' : ''} failed`,
        )
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to create ZIP file')
    } finally {
      toast.dismiss(loading)
    }
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteSelected = async () => {
    if (!selectedArchives.length) return

    setIsDeleting(true)
    const loading = toast.loading('Deleting archives...')

    try {
      const ids = selectedArchives.map((a) => a.id)
      const { deleted, failed } = await deleteArchives(ids)

      if (deleted > 0) {
        toast.success(`Deleted ${deleted} archive${deleted > 1 ? 's' : ''}`)
        setSelectedIds(new Set())
        refetch()
      }
      if (failed > 0) {
        toast.error(
          `${failed} archive${failed > 1 ? 's' : ''} failed to delete`,
        )
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete archives')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      toast.dismiss(loading)
    }
  }

  const handlePageChange = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 0), totalPages - 1))
  }

  const messageTotal = useMemo(() => sumMessages(archives), [archives])
  const attachmentTotal = useMemo(() => sumAttachments(archives), [archives])

  const toggleServer = (guildId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(guildId)) {
        next.delete(guildId)
      } else {
        next.add(guildId)
      }
      return next
    })
  }

  const toggleServerSelection = (server: ServerGroup) => {
    const ids = server.categories.flatMap((cat) =>
      cat.archives.map((a) => a.id),
    )
    const allSelected = ids.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => {
        if (allSelected) {
          next.delete(id)
        } else {
          next.add(id)
        }
      })
      return next
    })
  }

  const content = () => {
    if (isLoading) return <ArchiveSkeleton />
    if (isError) return <ErrorState onRetry={refetch} />
    if (!serverGroups.length) return <EmptyState />

    return (
      <div className="space-y-6">
        {serverGroups.map((server) => (
          <ServerPanel
            key={server.guildId}
            server={server}
            expanded={expandedCategories.has(server.guildId)}
            onToggle={() => toggleServer(server.guildId)}
            selectedIds={selectedIds}
            onToggleArchive={toggleSelect}
            onToggleServerSelection={() => toggleServerSelection(server)}
            onCopyLink={handleCopySlug}
          />
        ))}
      </div>
    )
  }

  return (
    <main
      className={cn(
        'min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white',
        fontClass,
      )}
    >
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <header className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-600">
              IXM Archive Viewer
            </p>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-semibold text-white">
                  Client archives
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Grouped by Discord categories so you can scan channels fast.
                </p>
              </div>
              <div className="text-xs text-zinc-500">
                {isFetching && !isLoading ? (
                  <span className="inline-flex items-center gap-2 text-white">
                    <Loader2 className="size-4 animate-spin" /> Syncing latest
                    data
                  </span>
                ) : (
                  <span>
                    Page {page + 1} • {ARCHIVE_PAGE_SIZE} per page
                  </span>
                )}
              </div>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Channel Transcripts"
              value={formatCount(archives.length)}
              hint={`${formatCount(total)} files total`}
            />
            <StatCard
              label="Messages Archived"
              value={formatCount(messageTotal)}
            />
            <StatCard
              label="Attachments Archived"
              value={formatCount(attachmentTotal)}
            />
          </section>
        </header>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <FilterField
              icon={<Search className="size-4" />}
              label="Guild"
              placeholder="Name or ID"
              value={formState.guild}
              onChange={(event) =>
                handleInputChange('guild', event.currentTarget.value)
              }
            />
            <FilterField
              icon={<Search className="size-4" />}
              label="Channel"
              placeholder="Name or ID"
              value={formState.channel}
              onChange={(event) =>
                handleInputChange('channel', event.currentTarget.value)
              }
            />
            <FilterField
              icon={<Search className="size-4" />}
              label="Category"
              placeholder="Client bucket"
              value={formState.category}
              onChange={(event) =>
                handleInputChange('category', event.currentTarget.value)
              }
            />
            {/* <FilterField
              icon={<Search className="size-4" />}
              label="Batch"
              placeholder="Batch ID"
              value={formState.batchId}
              onChange={(event) =>
                handleInputChange('batchId', event.currentTarget.value)
              }
            /> */}
            <FilterField
              icon={<CalendarRange className="size-4" />}
              label="Start"
              type="date"
              value={formState.startDate}
              onChange={(event) =>
                handleInputChange('startDate', event.currentTarget.value)
              }
            />
            <FilterField
              icon={<CalendarRange className="size-4" />}
              label="End"
              type="date"
              value={formState.endDate}
              onChange={(event) =>
                handleInputChange('endDate', event.currentTarget.value)
              }
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
            <span>Filters update automatically as you type.</span>
            <Button
              type="button"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={clearFilters}
            >
              <RefreshCw className="size-4" /> Reset filters
            </Button>
          </div>
        </section>

        {selectedCount > 0 ? (
          <section className="fixed bottom-12 right-12 z-50 rounded-2xl border border-white/15 bg-black/25 p-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-white">
                {selectedCount} archive{selectedCount > 1 ? 's' : ''} selected
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-white text-black hover:bg-zinc-200"
                  onClick={handleTranscriptDownload}
                >
                  <Download className="size-4" /> Download
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="text-white hover:bg-white/10"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection{' '}
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {showDeleteConfirm ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white">
                Delete {selectedCount} archive{selectedCount > 1 ? 's' : ''}?
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                This will permanently delete the selected archives and all their
                attachments. This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="text-white hover:bg-white/10"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" /> Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {content()}

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-zinc-500">
          <span>
            {formatCount(page * ARCHIVE_PAGE_SIZE + 1)}-
            {formatCount(Math.min((page + 1) * ARCHIVE_PAGE_SIZE, total))} of{' '}
            {formatCount(total)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-white disabled:opacity-40"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-white disabled:opacity-40"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </footer>
      </div>
    </main>
  )
}

interface FilterFieldProps {
  icon: ReactNode
  label: string
  placeholder?: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  type?: string
}

function FilterField({
  icon,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: FilterFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
      {label}
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-3">
        <span className="text-zinc-600">{icon}</span>
        <Input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className="border-none bg-transparent text-sm text-white placeholder:text-zinc-600 focus-visible:ring-0"
        />
      </div>
    </label>
  )
}

interface ServerPanelProps {
  server: ServerGroup
  expanded: boolean
  onToggle: () => void
  selectedIds: Set<string>
  onToggleArchive: (id: string) => void
  onToggleServerSelection: () => void
  onCopyLink: (id: string) => void
}

function ServerPanel({
  server,
  expanded,
  onToggle,
  selectedIds,
  onToggleArchive,
  onToggleServerSelection,
  onCopyLink,
}: ServerPanelProps) {
  const totalArchives = server.categories.reduce(
    (sum, cat) => sum + cat.archives.length,
    0,
  )
  const selectedInServer = server.categories.reduce((sum, cat) => {
    return (
      sum + cat.archives.filter((archive) => selectedIds.has(archive.id)).length
    )
  }, 0)

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  )

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleCategorySelection = (cat: CategoryGroup) => {
    const ids = cat.archives.map((a) => a.id)
    const allSelected = ids.every((id) => selectedIds.has(id))
    ids.forEach((id) => {
      if (allSelected) {
        if (selectedIds.has(id)) onToggleArchive(id)
      } else {
        if (!selectedIds.has(id)) onToggleArchive(id)
      }
    })
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-5 shadow-[0_25px_80px_-40px_rgba(0,0,0,0.8)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/10">
            <Server className="size-6 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-600">
              Server
            </p>
            <h2 className="text-2xl font-semibold text-white">
              {server.guildName}
            </h2>
            <p className="text-xs text-zinc-500">
              {server.categories.length} categor
              {server.categories.length === 1 ? 'y' : 'ies'} • {totalArchives}{' '}
              channel{totalArchives === 1 ? '' : 's'} •{' '}
              {formatCount(server.messageCount)} messages •{' '}
              {formatCount(server.attachmentCount)} attachments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="text-xs text-white hover:bg-white/10"
            onClick={onToggleServerSelection}
          >
            {selectedInServer === totalArchives && totalArchives
              ? 'Clear selection'
              : 'Select all'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={onToggle}
          >
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </div>
      {expanded ? (
        <div className="mt-5 space-y-4 pl-2">
          {server.categories.map((cat) => (
            <CategoryPanel
              key={cat.key}
              group={cat}
              expanded={expandedCategories.has(cat.key)}
              onToggle={() => toggleCategory(cat.key)}
              selectedIds={selectedIds}
              onToggleArchive={onToggleArchive}
              onToggleCategorySelection={() => toggleCategorySelection(cat)}
              onCopyLink={onCopyLink}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface CategoryPanelProps {
  group: CategoryGroup
  expanded: boolean
  onToggle: () => void
  selectedIds: Set<string>
  onToggleArchive: (id: string) => void
  onToggleCategorySelection: () => void
  onCopyLink: (id: string) => void
}

function CategoryPanel({
  group,
  expanded,
  onToggle,
  selectedIds,
  onToggleArchive,
  onToggleCategorySelection,
  onCopyLink,
}: CategoryPanelProps) {
  const selectedInGroup = group.archives.filter((archive) =>
    selectedIds.has(archive.id),
  ).length

  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-5 shadow-[0_25px_80px_-40px_rgba(0,0,0,0.8)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-600">
            Discord Category
          </p>
          <h2 className="text-2xl font-semibold text-white">{group.label}</h2>
          <p className="text-xs text-zinc-500">
            {group.archives.length} channel
            {group.archives.length === 1 ? '' : 's'} •{' '}
            {formatCount(group.messageCount)} messages •{' '}
            {formatCount(group.attachmentCount)} attachments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="text-xs text-white hover:bg-white/10"
            onClick={onToggleCategorySelection}
          >
            {selectedInGroup === group.archives.length && group.archives.length
              ? 'Clear selection'
              : 'Select all'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={onToggle}
          >
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </div>
      {expanded ? (
        <div className="mt-4 space-y-3">
          {group.archives.map((archive) => (
            <div
              key={archive.id}
              className="rounded-2xl border border-white/10 bg-black/60 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 rounded border-white/30 bg-transparent"
                    checked={selectedIds.has(archive.id)}
                    onChange={() => onToggleArchive(archive.id)}
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      #{archive.channel_name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {archive.guild_name} •{' '}
                      {formatArchiveDate(archive.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                  <span>
                    {formatCount(archive.message_count ?? 0)} messages
                  </span>
                  <span>
                    {formatCount(archive.attachment_count ?? 0)} attachments
                  </span>
                  {archive.duration_seconds ? (
                    <span>{formatDuration(archive.duration_seconds)}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="secondary"
                    className="bg-white text-black hover:bg-zinc-200"
                  >
                    <Link href={`/dashboard/archives/${archive.id}`}>Open</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={() => onCopyLink(archive.id)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  hint?: string
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4">
      <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  )
}

const ArchiveSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="h-32 animate-pulse rounded-3xl bg-white/5" />
    ))}
  </div>
)

const EmptyState = () => (
  <div className="rounded-3xl border border-dashed border-white/20 px-6 py-16 text-center text-zinc-500">
    <p className="text-base text-white">No archives match these filters.</p>
    <p className="text-sm text-zinc-500">
      Adjust the filters above or trigger a new archive from the IXM bot.
    </p>
  </div>
)

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="rounded-3xl border border-red-500/30 bg-red-500/5 px-6 py-12 text-center text-red-200">
    <p className="text-base font-semibold">
      We couldn’t load the archive feed.
    </p>
    <Button className="mt-4" variant="secondary" onClick={onRetry}>
      <RefreshCw className="size-4" /> Retry
    </Button>
  </div>
)
