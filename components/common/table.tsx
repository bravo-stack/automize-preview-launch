'use client'

import { useState, useMemo, ReactElement } from 'react'
import { parseColumn, textFromSQL } from '@/lib/utils'

interface TableProps {
  data: any
  noSearch?: boolean
  action?: ReactElement
}

export default function Table({ data, action, noSearch = false }: TableProps) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const keys = data.length > 0 ? Object.keys(data[0]) : []

  if (keys.includes('id')) {
    keys.splice(keys.indexOf('id'), 1)
  }

  const filteredData = useMemo(() => {
    let filtered = data

    if (!noSearch && search) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase()),
        ),
      )
    }

    return filtered
  }, [search, data, noSearch])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  return (
    <div className="mt-2">
      <div className="flex gap-2.5 ">
        {!noSearch && ( // Only render the search input if noSearch is false
          <div className="flex-1">
            <label
              htmlFor="autocomplete"
              className="mb-1 block text-sm font-medium text-neutral-500"
            >
              Search records
            </label>
            <input
              type="text"
              placeholder="Enter text to search..."
              className="mb-4 w-full rounded-md border border-zinc-800 bg-night-starlit p-2 placeholder:text-neutral-700"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-zinc-800">
        <table className="w-full">
          <thead className="border-zinc-800 text-left">
            <tr>
              {keys.map((key, index) => (
                <th key={index} className="border-b border-zinc-800 px-4 py-2">
                  {textFromSQL(key)}
                </th>
              ))}
              {action && (
                <th className="border-b border-zinc-800 px-2 py-2 text-center">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-night-starlit">
                  {keys.map((key, colIndex) => (
                    <td
                      key={colIndex}
                      className="border-b border-zinc-800 px-4 py-2"
                    >
                      {parseColumn(row, key)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={keys.length + (action ? 1 : 0)}
                  className="border-b border-zinc-800 px-4 py-2 text-center text-neutral-500"
                >
                  EMPTY
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-neutral-600">
          {`Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(
            currentPage * itemsPerPage,
            filteredData.length,
          )} of ${filteredData.length} rows.`}
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-zinc-800 px-3 py-1 text-neutral-600 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="rounded-md border border-zinc-800 px-3 py-1 text-neutral-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
