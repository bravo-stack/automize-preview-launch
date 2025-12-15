'use client'

import { Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'

interface ClientsListControlsProps {
  searchQuery: string
  pageSize: number
  pageSizeOptions: number[]
  defaultPageSize?: number
}

const SEARCH_DEBOUNCE_MS = 300

export default function ClientsListControls({
  searchQuery,
  pageSize,
  pageSizeOptions,
  defaultPageSize = 20,
}: ClientsListControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync local state when URL changes externally (e.g., back/forward nav)
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      // Reset page when search or pageSize changes
      if ('search' in updates || 'pageSize' in updates) {
        params.delete('page')
      }

      return params.toString()
    },
    [searchParams],
  )

  const executeSearch = useCallback(
    (value: string) => {
      startTransition(() => {
        const queryString = createQueryString({ search: value || null })
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
      })
    },
    [createQueryString, pathname, router],
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value)

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new debounced timer
      debounceTimerRef.current = setTimeout(() => {
        executeSearch(value)
      }, SEARCH_DEBOUNCE_MS)
    },
    [executeSearch],
  )

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      startTransition(() => {
        // Only add pageSize to URL if different from default
        const pageSizeValue =
          newSize === defaultPageSize ? null : String(newSize)
        const queryString = createQueryString({ pageSize: pageSizeValue })
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
      })
    },
    [createQueryString, pathname, router, defaultPageSize],
  )

  const handleClearSearch = useCallback(() => {
    // Clear debounce timer immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    setLocalSearch('')
    executeSearch('')
  }, [executeSearch])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 sm:max-w-md">
        <Search
          className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
            isPending ? 'animate-pulse text-blue-400' : 'text-white/40'
          }`}
        />
        <input
          type="text"
          placeholder="Search by name or website..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/40 transition-colors focus:border-white/20 focus:bg-white/[0.07] focus:outline-none"
        />
        {isPending && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
          </div>
        )}
        {localSearch && !isPending && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Page Size Selector */}
      <div className="flex items-center gap-3">
        <label htmlFor="pageSize" className="text-sm text-white/50">
          Show
        </label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          disabled={isPending}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors focus:border-white/20 focus:outline-none disabled:opacity-50 [&>option]:bg-zinc-900 [&>option]:text-white"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="text-sm text-white/50">per page</span>
      </div>
    </div>
  )
}
