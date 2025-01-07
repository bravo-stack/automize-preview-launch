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
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [currentNote, setCurrentNote] = useState<string | null>(null)

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

  const handleOpenNote = (note: string) => {
    setCurrentNote(note)
    setIsPopupOpen(true)
  }

  const handleClosePopup = () => {
    setCurrentNote(null)
    setIsPopupOpen(false)
  }

  const isUrl = (value: string) => {
    try {
      const url = new URL(value)
      const shortenedUrl = `${url.hostname}/...`
      return shortenedUrl
    } catch {
      return null
    }
  }

  return (
    <div className="">
      <div className="flex gap-2.5">
        {!noSearch && (
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
              }}
            />
          </div>
        )}
      </div>

      <div className="max-h-[70vh] overflow-y-auto overflow-x-scroll rounded-md border border-zinc-800">
        <table className="relative w-full">
          <thead className="sticky top-0 border-b border-zinc-800 bg-night-dusk text-left">
            <tr>
              {keys.map((key, index) => (
                <th
                  key={index}
                  className="whitespace-nowrap border-b border-zinc-800 px-4 py-2"
                >
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
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-night-starlit">
                  {keys.map((key, colIndex) => (
                    <td
                      key={colIndex}
                      className="whitespace-nowrap border-b border-zinc-800 px-4 py-2"
                    >
                      {key.toLowerCase() === 'notes' && row[key] ? (
                        <button
                          onClick={() => handleOpenNote(row[key])}
                          className="rounded-md border border-zinc-800 bg-night-dusk px-1.5 py-0.5 text-neutral-400 transition-colors hover:border-zinc-700"
                        >
                          View Note
                        </button>
                      ) : typeof row[key] === 'string' ? (
                        (() => {
                          const shortenedUrl = isUrl(row[key])
                          return shortenedUrl ? (
                            <div className="flex items-center space-x-2">
                              <span
                                className="cursor-pointer underline hover:text-neutral-500"
                                onClick={() => window.open(row[key], '_blank')}
                              >
                                View
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`${!parseColumn(row, key) && 'text-neutral-600'}`}
                            >
                              {parseColumn(row, key) || 'N/A'}
                            </span>
                          )
                        })()
                      ) : (
                        <span
                          className={`${!parseColumn(row, key) && 'text-neutral-600'}`}
                        >
                          {parseColumn(row, key) || 'N/A'}
                        </span>
                      )}
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

      {isPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-11/12 max-w-2xl rounded-lg bg-white text-black shadow-lg">
            <div className="flex flex-col space-y-4 p-6">
              <h2 className="text-lg font-bold">Note Details</h2>
              <div className="max-h-96 overflow-y-auto">
                <p className="text-sm">{currentNote}</p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  className="rounded-md bg-black px-3 py-1.5 text-white"
                  onClick={handleClosePopup}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
