'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type {
  CommunicationReport,
  CommunicationsAuditData,
} from '@/types/communications-audit'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import EmptyData from './empty-data'
import LoadingView from './loading-view'

type NormalizedStatus =
  | 'unknown'
  | 'inactive'
  | 'transferred'
  | 'churned'
  | 'ixm_no_reach_48h'
  | 'client_silent_5d'
  | 'client_awaiting_team'
  | 'active_communication'
  | 'no_messages'
  | 'team_only'
  | 'client_only_no_team'
type StatusColorMap = Record<NormalizedStatus | 'default', string>
interface Props {
  initialData: CommunicationsAuditData
}
interface SpreadsheetCell {
  categoryName: string
  podName: string
  status: string
  channelName?: string
  report?: CommunicationReport
}
interface SelectedCell {
  podIndex: number
  rowIndex: number
  pod: string
  category: string
}
interface SelectionRange {
  start: SelectedCell | null
  end: SelectedCell | null
}

const STATUS_PATTERNS: Array<[NormalizedStatus, RegExp[]]> = [
  ['inactive', [/^inactive$/i]],
  ['transferred', [/^transferred$/i]],
  ['churned', [/^churned$/i]],

  [
    'ixm_no_reach_48h',
    [/didn'?t reach out for 48 hours/i, /ixm didn'?t reach out/i],
  ],
  ['client_silent_5d', [/client silent for 5\+ days/i, /client silent/i]],
  [
    'client_awaiting_team',
    [/client responded - awaiting team reply/i, /awaiting team reply/i],
  ],
  ['active_communication', [/active communication/i]],
  ['no_messages', [/no messages found/i]],
  ['team_only', [/team only - no client messages/i, /team only/i]],
  ['client_only_no_team', [/client only - no team response/i, /client only/i]],
]
const STATUS_COLORS: StatusColorMap = {
  ixm_no_reach_48h: 'bg-amber-500 text-black',
  client_only_no_team: 'bg-amber-500 text-black', // optional alias if needed

  client_silent_5d: 'bg-red-500 text-black',

  client_awaiting_team: 'bg-white text-black',
  active_communication: 'bg-white text-black',
  no_messages: 'bg-white text-black',
  team_only: 'bg-white text-black',

  inactive: 'bg-orange-500 text-white',
  transferred: 'bg-green-500 text-white',
  churned: 'bg-purple-500 text-white',

  unknown: 'bg-gray-400 text-white', // from getStatus fallback
  default: 'bg-gray-400 text-white',
}
function resolveStatus(rawStatus: string | null | undefined): NormalizedStatus {
  const normalized = rawStatus?.trim().toLowerCase()
  if (!normalized) return 'unknown'

  for (const [mappedStatus, patterns] of STATUS_PATTERNS) {
    if (patterns.some((p) => p.test(normalized))) {
      return mappedStatus
    }
  }

  return 'active_communication' // default fallback
}
function getStatusColor(status: NormalizedStatus): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS.default
}
const POD_PRIORITY_LIST = [
  'SHALIN & RAY // IXM',
  'SHALIN // IXM',
  'RAY & AUN POD // IXM',
  'ZUHAIR & RAY // IXM',
  'ZUHAIR // IXM',
  'YOUSUF & RAY // IXM',
  'YOUSUF',
  'ANDREW & RAY // IXM',
  'ANDREW // IXM',
  'SAAD & RAY // IXM',
  'SAAD // IXM',
  'BRIXTON & RAY // IXM',
  'RAY & BRIXTON // IXM',
  'BRIXTON // IXM',
  'INTI & RAY // IXM',
  'INTI // IXM',
]
function customPodSort(a: string, b: string): number {
  const indexA = POD_PRIORITY_LIST.indexOf(a)
  const indexB = POD_PRIORITY_LIST.indexOf(b)

  const aInList = indexA !== -1
  const bInList = indexB !== -1

  if (aInList && bInList) {
    return indexA - indexB // Both in the list, sort by index
  }
  if (aInList) {
    return -1 // a is in the list, b is not. a comes first.
  }
  if (bInList) {
    return 1 // b is in the list, a is not. b comes first.
  }

  return a.localeCompare(b) // Neither is in the list, sort alphabetically
}

export default function CommunicationsAuditSpreadsheet({ initialData }: Props) {
  // STATES
  const [selectedDate, setSelectedDate] = useState(initialData.latestDate || '')
  const [data, setData] = useState<CommunicationReport[]>(initialData.reports)
  const [loading, setLoading] = useState(false)
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    string | null
  >(null)
  const [selectionRange, setSelectionRange] = useState<SelectionRange>({
    start: null,
    end: null,
  })
  const [isSelecting, setIsSelecting] = useState(false)

  // DATA INIT
  const dates = initialData.availableDates
  const hasData = initialData.availableDates.length > 0

  // HOOKS
  const fetchData = useCallback(async () => {
    if (!selectedDate) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        report_date: selectedDate,
      })

      const response = await fetch(`/api/communications-audit?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const result = await response.json()
      setData(result.data || [])
    } catch (error) {
      console.error('Error:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate])
  const tableRef = useRef<HTMLTableElement>(null)

  const baseSpreadsheetData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        pods: [],
        podCategories: new Map<string, string[]>(),
        cells: new Map<string, SpreadsheetCell>(),
      }
    }

    const podSet = new Set<string>()
    const podCategories = new Map<string, Set<string>>()
    const cells = new Map<string, SpreadsheetCell>()

    for (const report of data) {
      const { guild_name, category_name, status, channel_name } = report

      if (!guild_name || !category_name) {
        continue
      }

      // 1. Collect unique pods and their categories
      podSet.add(guild_name)
      if (!podCategories.has(guild_name)) {
        podCategories.set(guild_name, new Set())
      }
      podCategories.get(guild_name)!.add(category_name)

      // 2. Create the cell data
      const key = `${guild_name}-${category_name}`
      cells.set(key, {
        podName: guild_name,
        categoryName: category_name,
        status: resolveStatus(status),
        channelName: channel_name || undefined,
        report,
      })
    }

    // 3. Convert Sets to sorted arrays *after* the loop for efficiency
    const sortedPods = Array.from(podSet).sort(customPodSort)
    const sortedPodCategories = new Map<string, string[]>()
    podCategories.forEach((categories, pod) => {
      sortedPodCategories.set(pod, Array.from(categories).sort())
    })

    return {
      pods: sortedPods,
      podCategories: sortedPodCategories,
      cells,
    }
  }, [data])
  const spreadsheetData = useMemo(() => {
    if (!selectedStatusFilter) {
      return baseSpreadsheetData
    }

    const filteredCells = new Map<string, SpreadsheetCell>()
    const filteredPodCategories = new Map<string, Set<string>>()
    const filteredPodSet = new Set<string>()

    baseSpreadsheetData.cells.forEach((cell, key) => {
      if (cell.status === selectedStatusFilter) {
        filteredCells.set(key, cell)

        // Rebuild the list of pods and categories that are still visible
        filteredPodSet.add(cell.podName)
        if (!filteredPodCategories.has(cell.podName)) {
          filteredPodCategories.set(cell.podName, new Set())
        }
        filteredPodCategories.get(cell.podName)!.add(cell.categoryName)
      }
    })

    // Convert the filtered sets to sorted arrays
    const sortedFilteredPods = Array.from(filteredPodSet).sort(customPodSort)
    const sortedFilteredPodCategories = new Map<string, string[]>()
    filteredPodCategories.forEach((categories, pod) => {
      sortedFilteredPodCategories.set(pod, Array.from(categories).sort())
    })

    return {
      pods: sortedFilteredPods,
      podCategories: sortedFilteredPodCategories,
      cells: filteredCells,
    }
  }, [baseSpreadsheetData, selectedStatusFilter])
  const uniqueCategoryCells = useMemo(
    () => Array.from(baseSpreadsheetData.cells.values()),
    [baseSpreadsheetData],
  )
  const handleCellMouseDown = useCallback(
    (podIndex: number, rowIndex: number, pod: string, category: string) => {
      setIsSelecting(true)
      const selectedCell = { podIndex, rowIndex, pod, category }
      setSelectionRange({ start: selectedCell, end: selectedCell })
    },
    [],
  )
  const handleCellMouseEnter = useCallback(
    (podIndex: number, rowIndex: number, pod: string, category: string) => {
      if (isSelecting && selectionRange.start) {
        const selectedCell = { podIndex, rowIndex, pod, category }
        setSelectionRange((prev) => ({ ...prev, end: selectedCell }))
      }
    },
    [isSelecting, selectionRange.start],
  )
  const handleMouseUp = useCallback(() => {
    setIsSelecting(false)
  }, [])
  const isCellSelected = useCallback(
    (podIndex: number, rowIndex: number): boolean => {
      if (!selectionRange.start || !selectionRange.end) return false

      const minPodIndex = Math.min(
        selectionRange.start.podIndex,
        selectionRange.end.podIndex,
      )
      const maxPodIndex = Math.max(
        selectionRange.start.podIndex,
        selectionRange.end.podIndex,
      )
      const minRowIndex = Math.min(
        selectionRange.start.rowIndex,
        selectionRange.end.rowIndex,
      )
      const maxRowIndex = Math.max(
        selectionRange.start.rowIndex,
        selectionRange.end.rowIndex,
      )

      return (
        podIndex >= minPodIndex &&
        podIndex <= maxPodIndex &&
        rowIndex >= minRowIndex &&
        rowIndex <= maxRowIndex
      )
    },
    [selectionRange],
  )
  const copySelectedCells = useCallback(() => {
    if (!selectionRange.start || !selectionRange.end) return

    const minPodIndex = Math.min(
      selectionRange.start.podIndex,
      selectionRange.end.podIndex,
    )
    const maxPodIndex = Math.max(
      selectionRange.start.podIndex,
      selectionRange.end.podIndex,
    )
    const minRowIndex = Math.min(
      selectionRange.start.rowIndex,
      selectionRange.end.rowIndex,
    )
    const maxRowIndex = Math.max(
      selectionRange.start.rowIndex,
      selectionRange.end.rowIndex,
    )

    const copyData: string[][] = []

    for (let rowIndex = minRowIndex; rowIndex <= maxRowIndex; rowIndex++) {
      const row: string[] = []
      for (let podIndex = minPodIndex; podIndex <= maxPodIndex; podIndex++) {
        const pod = spreadsheetData.pods[podIndex]
        if (pod) {
          const categories = spreadsheetData.podCategories.get(pod) || []
          const category = categories[rowIndex]

          if (category) {
            row.push(category.replace('-IXM', ''))
          } else {
            row.push('')
          }
        }
      }
      copyData.push(row)
    }

    const textToCopy = copyData.map((row) => row.join('\t')).join('\n')

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = textToCopy
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }, [selectionRange, spreadsheetData])

  // SIDE EFFECTS
  useEffect(() => {
    if (selectedDate) {
      fetchData()
    }
  }, [selectedDate, fetchData])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectionRange.start) {
        e.preventDefault()
        copySelectedCells()
      }
      if (e.key === 'Escape') {
        setSelectionRange({ start: null, end: null })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [copySelectedCells, handleMouseUp, selectionRange.start])

  if (!hasData) {
    return <EmptyData />
  }

  return (
    <div className="space-y-6">
      {/* Date Selector & Legend */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <label
            htmlFor="date-select"
            className="text-sm font-medium text-zinc-300"
          >
            Report Date:
          </label>
          <select
            id="date-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-6 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-400">Legend:</span>
            {[
              {
                status: 'ixm_no_reach_48h',
                raw: `IXM didn't reach out for 48 hours`,
                label: "Didn't reach out for 48 hours",
                color: 'bg-amber-500 text-black',
              },
              {
                status: 'client_silent_5d',
                raw: 'Client silent for 5+ days',
                label: 'Client Silent 5+ Days',
                color: 'bg-red-500 text-black',
              },
              {
                status: 'active_communication',
                raw: 'Active communication',
                label: 'Clients responded',
                color: 'bg-white text-black',
              },
            ].map(({ status, raw, label, color }) => (
              <Badge
                key={status}
                className={`${color} cursor-pointer ${selectedStatusFilter === status ? 'ring-2 ring-white ring-offset-2' : ''}`}
                onClick={() =>
                  setSelectedStatusFilter(
                    selectedStatusFilter === resolveStatus(raw)
                      ? null
                      : resolveStatus(raw),
                  )
                }
              >
                {label}
              </Badge>
            ))}
          </div>
          <div className="text-xs text-zinc-400">
            Drag to select cells, Ctrl+C to copy
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {uniqueCategoryCells.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            {
              status: 'ixm_no_reach_48h',
              label: `Didn't reach out`,
              color: 'bg-amber-500 text-black',
            },
            {
              status: 'client_silent_5d',
              label: 'Client Silent 5+ Days',
              color: 'bg-red-500 text-black',
            },
            {
              status: 'active_communication',
              label: 'Clients responded',
              color: 'bg-white text-black',
            },
          ].map(({ status, label, color }) => {
            let count = 0

            if (status === 'active_communication') {
              // white bucket by unique category
              count = uniqueCategoryCells.filter((cell) =>
                [
                  'client_awaiting_team',
                  'active_communication',
                  'no_messages',
                  'team_only',
                ].includes(cell.status),
              ).length
            } else if (status === 'ixm_no_reach_48h') {
              // red bucket by unique category
              count = uniqueCategoryCells.filter((cell) =>
                ['ixm_no_reach_48h', 'client_only_no_team'].includes(
                  cell.status,
                ),
              ).length
            } else {
              // exact-match statuses by unique category
              count = uniqueCategoryCells.filter(
                (cell) => cell.status === status,
              ).length
            }

            const total = uniqueCategoryCells.length
            const pct = total > 0 ? Math.round((count / total) * 100) : 0

            return (
              <Card
                key={status}
                className="border-zinc-800/50 bg-zinc-900/30 p-4 text-center"
              >
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${color} mb-2`}
                >
                  {label}
                </div>
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-xs text-zinc-400">{pct}%</div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Total Clients Count */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-white">
          Clients: {spreadsheetData.cells.size}
        </div>
      </div>

      {loading ? (
        <LoadingView />
      ) : (
        <Card className="overflow-hidden border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
          <div className="max-h-[80vh] overflow-auto">
            <table
              ref={tableRef}
              className="w-full min-w-max"
              style={{ userSelect: 'none' }}
            >
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-zinc-700">
                  {spreadsheetData.pods.map((pod) => (
                    <th
                      key={pod}
                      className="min-w-[200px] border-r border-zinc-700 bg-zinc-800/90 px-4 py-3 text-center text-sm font-medium text-zinc-300 backdrop-blur-sm"
                    >
                      <div
                        className="truncate font-bold text-white"
                        title={pod || ''}
                      >
                        {`${pod?.replace(' // IXM', '')} (${spreadsheetData.podCategories.get(pod)?.length || 0})`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Calculate the maximum number of categories across all pods */}
                {(() => {
                  const maxCategories = Math.max(
                    ...spreadsheetData.pods.map(
                      (pod) =>
                        spreadsheetData.podCategories.get(pod)?.length || 0,
                    ),
                  )

                  return Array.from(
                    { length: maxCategories },
                    (_, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={`border-b border-zinc-800/50 ${
                          rowIndex % 2 === 0
                            ? 'bg-zinc-900/30'
                            : 'bg-zinc-900/10'
                        }`}
                      >
                        {spreadsheetData.pods.map((pod, podIndex) => {
                          const categories =
                            spreadsheetData.podCategories.get(pod) || []
                          const category = categories[rowIndex]

                          if (!category) {
                            return (
                              <td
                                key={`${pod}-empty-${rowIndex}`}
                                className="border-r border-zinc-800/50 bg-zinc-900/30 px-2 py-2 text-center"
                              >
                                <div className="flex h-8 items-center justify-center opacity-0">
                                  <span className="text-xs text-zinc-500">
                                    {' '}
                                  </span>
                                </div>
                              </td>
                            )
                          }

                          const cellKey = `${pod}-${category}`
                          const cell = spreadsheetData.cells.get(cellKey)
                          const isSelected = isCellSelected(podIndex, rowIndex)

                          return (
                            <td
                              key={`${pod}-${category}`}
                              className={`cursor-pointer border-r border-zinc-800/50 px-2 py-2 ${cell ? getStatusColor(cell.status as NormalizedStatus) : 'bg-zinc-900/50'} ${isSelected ? 'ring-2 ring-inset ring-blue-400' : ''}`}
                              onMouseDown={() =>
                                handleCellMouseDown(
                                  podIndex,
                                  rowIndex,
                                  pod,
                                  category,
                                )
                              }
                              onMouseEnter={() =>
                                handleCellMouseEnter(
                                  podIndex,
                                  rowIndex,
                                  pod,
                                  category,
                                )
                              }
                            >
                              <div className="py-1">
                                <div
                                  className="truncate text-center text-xs font-medium"
                                  title={category}
                                >
                                  {category.replace('-IXM', '')}
                                </div>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ),
                  )
                })()}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
