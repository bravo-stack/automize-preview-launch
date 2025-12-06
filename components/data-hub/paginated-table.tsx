'use client'

import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

interface PaginationInfo {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface PaginatedTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    render?: (value: unknown, row: T) => React.ReactNode
    className?: string
  }[]
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  isLoading?: boolean
  emptyMessage?: string
}

export default function PaginatedTable<T extends Record<string, unknown>>({
  data,
  columns,
  pagination,
  onPageChange,
  isLoading = false,
  emptyMessage = 'No data available',
}: PaginatedTableProps<T>) {
  const { page, totalPages, totalCount, hasNextPage, hasPrevPage } = pagination

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
          <span className="text-sm text-white/60">Loading...</span>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <p className="text-white/60">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-medium text-white/90 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition-colors hover:bg-white/5">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-white/80 ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-white/60">
          Showing {data.length} of {totalCount} results
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={!hasPrevPage}
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-3 text-sm text-white/80">
            Page {page} of {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNextPage}
            className="h-8 w-8"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
