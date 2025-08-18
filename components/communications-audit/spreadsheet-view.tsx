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

type AuditStatus =
  | 'ixm_no_reach_48h'
  | 'client_silent_5d'
  | 'client_awaiting_team'
  | 'unknown'
const RAW_TO_CANONICAL: Record<string, AuditStatus> = {
  "ixm didn't reach out for 48 hours": 'ixm_no_reach_48h',
  "ixm didn't reach out for 2 minutes (test mode)": 'ixm_no_reach_48h',
  'client silent for 5+ days': 'client_silent_5d',
  'client silent for 5+ minutes (test mode)': 'client_silent_5d',
  'client responded - awaiting team reply': 'client_awaiting_team',
}
const STATUS_LABEL: Record<AuditStatus, string> = {
  ixm_no_reach_48h: "Didn't reach out for 48 hours",
  client_silent_5d: 'Client Silent 5+ Days',
  client_awaiting_team: 'Client Responded - Awaiting Team Reply',
  unknown: 'Unknown',
}
const STATUS_STYLE: Record<AuditStatus, string> = {
  ixm_no_reach_48h: 'bg-red-500 text-white',
  client_silent_5d: 'bg-amber-400 text-black',
  client_awaiting_team: 'bg-white text-black',
  unknown: 'bg-gray-400 text-white',
}
const VISIBLE_CANONICAL = new Set<AuditStatus>([
  'ixm_no_reach_48h',
  'client_silent_5d',
  'client_awaiting_team',
])
interface Props {
  initialData: CommunicationsAuditData
}
interface SpreadsheetCell {
  categoryName: string
  podName: string
  status: AuditStatus
  channelName?: string
  report?: CommunicationReport
}
interface SelectedCell {
  podIndex: number
  rowIndex: number
  pod: string
  category: string
}

export default function SpreadsheetView({ initialData }: Props) {
  // STATES
  const [selectedDate, setSelectedDate] = useState(initialData.latestDate || '')
  const [reports, setReports] = useState<CommunicationReport[]>(
    initialData.reports,
  )
  const [loading, setLoading] = useState(false)
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<AuditStatus | null>(null)
  const [selectionStart, setSelectionStart] = useState<SelectedCell | null>(
    null,
  )
  const [selectionEnd, setSelectionEnd] = useState<SelectedCell | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const tableRef = useRef<HTMLTableElement | null>(null)

  const dates = initialData.availableDates
  const hasData = dates.length > 0

  //   HOOKS
  const fetchData = useCallback(async () => {
    if (!selectedDate) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ report_date: selectedDate })
      const res = await fetch(`/api/communications-audit?${params}`)
      if (!res.ok) throw new Error('fetch_failed')
      const json = await res.json()
      setReports(json.data || [])
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate])
  const normalizeStatus = useCallback((raw?: string | null): AuditStatus => {
    if (!raw) return 'unknown'
    const key = raw.trim().toLowerCase()
    return (
      RAW_TO_CANONICAL[key] ||
      (key.includes("didn't reach out")
        ? 'ixm_no_reach_48h'
        : key.includes('client silent')
          ? 'client_silent_5d'
          : key.includes('awaiting team')
            ? 'client_awaiting_team'
            : 'unknown')
    )
  }, [])
  const spreadsheet = useMemo(() => {
    const podOrderUnsorted = Array.from(
      new Set(
        reports.map((r) => r.guild_name).filter((g): g is string => Boolean(g)),
      ),
    ).sort()
    const PREFERRED_ORDER = [
      'SHALIN & RAY // IXM',
      'RAY & AUN POD // IXM',
      'ZUHAIR & RAY // IXM',
      'YOUSUF & RAY // IXM',
      'ANDREW & RAY // IXM',
      'SAAD & RAY // IXM',
      'BRIXTON & RAY // IXM',
      'RAY & BRIXTON // IXM',
      'INTI & RAY // IXM',
    ]
    const preferredMapped: string[] = []
    for (const pref of PREFERRED_ORDER) {
      const match = podOrderUnsorted.find(
        (x) => x && x.toLowerCase() === pref.toLowerCase(),
      )
      if (match) preferredMapped.push(match)
    }
    const podOrder = [
      ...preferredMapped,
      ...podOrderUnsorted.filter((p) => !preferredMapped.includes(p)),
    ]
    const podCategories = new Map<string, string[]>()
    const cells = new Map<string, SpreadsheetCell>()
    for (const r of reports) {
      if (!r.category_name || !r.guild_name) continue
      const status = normalizeStatus(r.status)
      if (!VISIBLE_CANONICAL.has(status)) continue
      if (!podCategories.has(r.guild_name)) podCategories.set(r.guild_name, [])
      const cats = podCategories.get(r.guild_name)!
      if (!cats.includes(r.category_name)) {
        cats.push(r.category_name)
        cats.sort()
      }
      const key = `${r.guild_name}-${r.category_name}`
      cells.set(key, {
        categoryName: r.category_name,
        podName: r.guild_name,
        status,
        channelName: r.channel_name || undefined,
        report: r,
      })
    }
    const filteredPods = podOrder.filter(
      (p) => (podCategories.get(p) || []).length > 0,
    )
    return { pods: filteredPods, podCategories, cells }
  }, [reports, normalizeStatus])
  const uniqueCategoryCells = useMemo(
    () => Array.from(spreadsheet.cells.values()),
    [spreadsheet],
  )
  const displaySpreadsheet = useMemo(() => {
    if (!selectedStatusFilter) return spreadsheet
    const podCategories = new Map<string, string[]>()
    const pods: string[] = []
    for (const pod of spreadsheet.pods) {
      const cats = (spreadsheet.podCategories.get(pod) || []).filter((cat) => {
        const cell = spreadsheet.cells.get(`${pod}-${cat}`)
        return cell?.status === selectedStatusFilter
      })
      if (cats.length > 0) {
        pods.push(pod)
        podCategories.set(pod, cats)
      }
    }
    return { pods, podCategories, cells: spreadsheet.cells }
  }, [spreadsheet, selectedStatusFilter])
  const displayUniqueCategoryCells = useMemo(() => {
    const arr: SpreadsheetCell[] = []
    for (const pod of displaySpreadsheet.pods) {
      const cats = displaySpreadsheet.podCategories.get(pod) || []
      for (const cat of cats) {
        const cell = displaySpreadsheet.cells.get(`${pod}-${cat}`)
        if (cell) arr.push(cell)
      }
    }
    return arr
  }, [displaySpreadsheet])
  const startSelection = useCallback(
    (podIndex: number, rowIndex: number, pod: string, category: string) => {
      setIsSelecting(true)
      const cell = { podIndex, rowIndex, pod, category }
      setSelectionStart(cell)
      setSelectionEnd(cell)
    },
    [],
  )
  const extendSelection = useCallback(
    (podIndex: number, rowIndex: number, pod: string, category: string) => {
      if (!isSelecting || !selectionStart) return
      setSelectionEnd({ podIndex, rowIndex, pod, category })
    },
    [isSelecting, selectionStart],
  )
  const endSelection = useCallback(() => setIsSelecting(false), [])
  const isCellSelected = useCallback(
    (podIndex: number, rowIndex: number) => {
      if (!selectionStart || !selectionEnd) return false
      const minPod = Math.min(selectionStart.podIndex, selectionEnd.podIndex)
      const maxPod = Math.max(selectionStart.podIndex, selectionEnd.podIndex)
      const minRow = Math.min(selectionStart.rowIndex, selectionEnd.rowIndex)
      const maxRow = Math.max(selectionStart.rowIndex, selectionEnd.rowIndex)
      return (
        podIndex >= minPod &&
        podIndex <= maxPod &&
        rowIndex >= minRow &&
        rowIndex <= maxRow
      )
    },
    [selectionStart, selectionEnd],
  )
  const copySelection = useCallback(() => {
    if (!selectionStart || !selectionEnd) return
    const minPod = Math.min(selectionStart.podIndex, selectionEnd.podIndex)
    const maxPod = Math.max(selectionStart.podIndex, selectionEnd.podIndex)
    const minRow = Math.min(selectionStart.rowIndex, selectionEnd.rowIndex)
    const maxRow = Math.max(selectionStart.rowIndex, selectionEnd.rowIndex)
    const rows: string[][] = []
    for (let r = minRow; r <= maxRow; r++) {
      const cols: string[] = []
      for (let p = minPod; p <= maxPod; p++) {
        const pod = spreadsheet.pods[p]
        if (!pod) {
          cols.push('')
          continue
        }
        const cats = spreadsheet.podCategories.get(pod) || []
        const cat = cats[r]
        cols.push(cat ? cat.replace('-IXM', '') : '')
      }
      rows.push(cols)
    }
    const text = rows.map((row) => row.join('\t')).join('\n')
    if (navigator.clipboard && window.isSecureContext)
      navigator.clipboard.writeText(text)
    else {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }, [selectionStart, selectionEnd, spreadsheet])

  //   SIDE EFFECTS
  useEffect(() => {
    if (selectedDate) fetchData()
  }, [selectedDate, fetchData])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectionStart) {
        e.preventDefault()
        copySelection()
      }
      if (e.key === 'Escape') {
        setSelectionStart(null)
        setSelectionEnd(null)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mouseup', endSelection)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mouseup', endSelection)
    }
  }, [copySelection, endSelection, selectionStart])

  if (!hasData) {
    return <EmptyData />
  }

  return (
    <div className="space-y-6">
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

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-400">Legend:</span>
          {Array.from(VISIBLE_CANONICAL).map((status) => (
            <Badge
              key={status}
              className={`${STATUS_STYLE[status]} cursor-pointer ${selectedStatusFilter === status ? 'ring-2 ring-white ring-offset-2' : ''}`}
              onClick={() =>
                setSelectedStatusFilter(
                  selectedStatusFilter === status ? null : status,
                )
              }
            >
              {STATUS_LABEL[status]}
            </Badge>
          ))}
        </div>
      </div>

      <div className="text-right text-xs text-zinc-400">
        Drag to select cells, Ctrl+C to copy
      </div>

      {uniqueCategoryCells.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from(VISIBLE_CANONICAL).map((status) => {
            const count = uniqueCategoryCells.filter(
              (c) => c.status === status,
            ).length
            const total = uniqueCategoryCells.length
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <Card
                key={status}
                className="border-zinc-800/50 bg-zinc-900/30 p-4 text-center"
              >
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[status]} mb-2`}
                >
                  {STATUS_LABEL[status]}
                </div>
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-xs text-zinc-400">{pct}%</div>
              </Card>
            )
          })}
        </div>
      )}

      {uniqueCategoryCells.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-white">
            Clients: {displayUniqueCategoryCells.length}
          </div>
        </div>
      )}

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
                  {displaySpreadsheet.pods.map((pod) => (
                    <th
                      key={pod}
                      className="min-w-[200px] border-r border-zinc-700 bg-zinc-800/90 px-4 py-3 text-center text-sm font-medium text-zinc-300 backdrop-blur-sm"
                    >
                      <div
                        className="truncate font-bold text-white"
                        title={pod || ''}
                      >
                        {pod}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const maxCategories = Math.max(
                    ...displaySpreadsheet.pods.map(
                      (pod) =>
                        displaySpreadsheet.podCategories.get(pod)?.length || 0,
                    ),
                    0,
                  )
                  return Array.from(
                    { length: maxCategories },
                    (_, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={`border-b border-zinc-800/50 ${rowIndex % 2 === 0 ? 'bg-zinc-900/30' : 'bg-zinc-900/10'}`}
                      >
                        {displaySpreadsheet.pods.map((pod, podIndex) => {
                          const categories =
                            displaySpreadsheet.podCategories.get(pod) || []
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
                          const cell = displaySpreadsheet.cells.get(cellKey)
                          const isSelected = isCellSelected(podIndex, rowIndex)
                          const style = cell
                            ? STATUS_STYLE[cell.status]
                            : 'bg-zinc-900/50'
                          return (
                            <td
                              key={`${pod}-${category}`}
                              className={`cursor-pointer border-r border-zinc-800/50 px-2 py-2 ${style} ${isSelected ? 'ring-2 ring-inset ring-blue-400' : ''}`}
                              onMouseDown={() =>
                                startSelection(
                                  podIndex,
                                  rowIndex,
                                  pod,
                                  category,
                                )
                              }
                              onMouseEnter={() =>
                                extendSelection(
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
