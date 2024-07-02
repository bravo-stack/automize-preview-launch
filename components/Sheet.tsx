'use client'

import {
  useState,
  useEffect,
  useCallback,
  MouseEvent,
  ChangeEvent,
  DragEvent,
} from 'react'

const generateColumnLabel = (index: number): string => {
  let label = ''
  while (index >= 0) {
    label = String.fromCharCode((index % 26) + 65) + label
    index = Math.floor(index / 26) - 1
  }
  return label
}

interface Selection {
  start: { row: number; col: number } | null
  end: { row: number; col: number } | null
  active: boolean
}

const Sheet = () => {
  const [custom, setCustom] = useState(false)
  const [rows, setRows] = useState<number>(4)
  const [cols, setCols] = useState<number>(6)
  const [data, setData] = useState<string[][]>(
    Array(10)
      .fill(0)
      .map(() => Array(10).fill('')),
  )
  const [selection, setSelection] = useState<Selection>({
    start: null,
    end: null,
    active: false,
  })

  useEffect(() => {
    const savedData = localStorage.getItem('sheetData')
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      setData(parsedData.data)
      setRows(parsedData.rows)
      setCols(parsedData.cols)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sheetData', JSON.stringify({ data, rows, cols }))
  }, [data, rows, cols])

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    row: number,
    col: number,
  ) => {
    const newData = data.map((r, rowIndex) =>
      r.map((cell, colIndex) =>
        rowIndex === row && colIndex === col ? e.target.value : cell,
      ),
    )
    setData(newData)
  }

  const handleAddRow = () => {
    setRows(rows + 1)
    setData([...data, Array(cols).fill('')])
  }

  const handleAddCol = () => {
    setCols(cols + 1)
    setData(data.map((row) => [...row, '']))
  }

  const handleDragStart = (e: DragEvent<HTMLDivElement>, label: string) => {
    e.dataTransfer.setData('text/plain', label)
  }

  const handleDrop = (
    e: DragEvent<HTMLTableCellElement>,
    row: number,
    col: number,
  ) => {
    const label = e.dataTransfer.getData('text/plain')
    const newData = [...data]
    newData[row][col] = label
    setData(newData)
    e.preventDefault()
  }

  const allowDrop = (e: DragEvent<HTMLTableCellElement>) => {
    e.preventDefault()
  }

  const handleMouseDown = (row: number, col: number) => {
    setSelection({ start: { row, col }, end: { row, col }, active: true })
  }

  const handleMouseOver = (row: number, col: number) => {
    if (selection.active) {
      setSelection({ ...selection, end: { row, col } })
    }
  }

  const handleMouseUp = () => {
    if (!selection.start || !selection.end) return

    if (
      selection.start.row === selection.end.row &&
      selection.start.col === selection.end.col
    ) {
      setSelection({ start: null, end: null, active: false })
    } else {
      setSelection({ ...selection, active: false })
    }
  }

  const handleTableClick = (e: MouseEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).tagName === 'TABLE' ||
      (e.target as HTMLElement).tagName === 'DIV'
    ) {
      setSelection({ start: null, end: null, active: false })
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && selection.start && selection.end) {
        const newData = data.map((r, rowIndex) =>
          r.map((cell, colIndex) => {
            const withinSelection =
              selection.start &&
              selection.end &&
              rowIndex >= Math.min(selection.start.row, selection.end.row) &&
              rowIndex <= Math.max(selection.start.row, selection.end.row) &&
              colIndex >= Math.min(selection.start.col, selection.end.col) &&
              colIndex <= Math.max(selection.start.col, selection.end.col)

            return withinSelection ? '' : cell
          }),
        )
        setData(newData)
      }
    },
    [selection, data],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const isSelected = (row: number, col: number) => {
    if (!selection.start || !selection.end) return false
    if (
      selection.start.row === selection.end.row &&
      selection.start.col === selection.end.col
    )
      return false
    return (
      row >= Math.min(selection.start.row, selection.end.row) &&
      row <= Math.max(selection.start.row, selection.end.row) &&
      col >= Math.min(selection.start.col, selection.end.col) &&
      col <= Math.max(selection.start.col, selection.end.col)
    )
  }

  const initialHeaders = ['CTR', 'ROAS', 'Page Likes', 'Clicks', 'Ad Spend']

  const handlePushData = async () => {
    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      alert(result.ok)
    } catch (error: any) {
      alert('Failed to push data: ' + error.message)
    }
  }

  const handleQuickStart = () => {
    const newData = data.map((row, rowIndex) => {
      if (rowIndex === 0) {
        return initialHeaders.concat(
          Array(cols - initialHeaders.length).fill(''),
        )
      }
      return row
    })
    setData(newData)
  }

  const handlePreview = () => {
    const newData = data.map((row, rowIndex) => {
      if (rowIndex === 0) return row // Skip the headers row
      return row.map((cell, colIndex) => {
        const header = data[0][colIndex]
        switch (header) {
          case 'CTR':
            return `${(Math.random() * 100).toFixed(2)}%`
          case 'ROAS':
            return `${(Math.random() * 5).toFixed(2)}`
          case 'Page Likes':
            return Math.floor(Math.random() * 1000).toString()
          case 'Clicks':
            return Math.floor(Math.random() * 10000).toString()
          case 'Ad Spend':
            return `$${(Math.random() * 1000).toFixed(2)}`
          default:
            return cell
        }
      })
    })
    setData(newData)
  }

  const getCellStyle = (header: string, value: string) => {
    const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ''))

    switch (header) {
      case 'CTR':
        return numericValue > 50
          ? 'bg-green-400'
          : numericValue < 20
            ? 'bg-red-400'
            : ''
      case 'ROAS':
        return numericValue > 2
          ? 'bg-green-400'
          : numericValue < 1
            ? 'bg-red-400'
            : ''
      case 'Page Likes':
        return numericValue > 500
          ? 'bg-green-400'
          : numericValue < 200
            ? 'bg-red-400'
            : ''
      case 'Clicks':
        return numericValue > 5000
          ? 'bg-green-400'
          : numericValue < 2000
            ? 'bg-red-400'
            : ''
      case 'Ad Spend':
        return numericValue < 500
          ? 'bg-green-400'
          : numericValue > 800
            ? 'bg-red-400'
            : ''
      default:
        return ''
    }
  }

  return (
    <div className="p-4" onMouseUp={handleMouseUp} onClick={handleTableClick}>
      <div className="mb-3 grid grid-cols-4 gap-3">
        <button
          onClick={handleQuickStart}
          className="bg-starlit rounded-md border border-zinc-800 px-3 py-1.5 hover:border-zinc-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="inline-block size-4"
          >
            <path
              fillRule="evenodd"
              d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
              clipRule="evenodd"
            />
          </svg>{' '}
          Quickstart
        </button>

        <button
          onClick={() => setCustom(!custom)}
          className="bg-starlit rounded-md border border-zinc-800 px-3 py-1.5 hover:border-zinc-700"
        >
          Custom
        </button>

        <button
          onClick={handlePreview}
          className="bg-starlit rounded-md border border-zinc-800 px-3 py-1.5 hover:border-zinc-700"
        >
          Preview Result
        </button>

        <button
          onClick={handlePushData}
          className="bg-starlit rounded-md border border-zinc-800 px-3 py-1.5 hover:border-zinc-700"
        >
          Create Sheet
        </button>
      </div>

      <div className="mb-4 flex space-x-4 overflow-auto">
        {custom &&
          initialHeaders.map((label, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, label)}
              className="flex-grow cursor-move rounded-md border bg-black px-2 py-1 text-center font-semibold tracking-wide"
            >
              {label}
            </div>
          ))}
      </div>

      <div className="overflow-x-auto rounded-md">
        <table className="border-collapse text-black">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-white text-center"></th>
              {Array(cols)
                .fill(0)
                .map((_, colIndex) => (
                  <th
                    key={colIndex}
                    className="min-h-[22px] min-w-[100px] select-none border border-gray-300 bg-white p-1 text-sm font-normal text-gray-700"
                  >
                    {generateColumnLabel(colIndex)}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="h-full w-full">
            {Array(rows)
              .fill(0)
              .map((_, rowIndex) => (
                <tr key={rowIndex} className="h-fit w-fit">
                  <td className="select-none border border-gray-300 bg-white px-3 text-center text-xs text-gray-700">
                    {rowIndex + 1}
                  </td>
                  {Array(cols)
                    .fill(0)
                    .map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className={`relative m-0 box-border border border-gray-300 p-0 ${
                          isSelected(rowIndex, colIndex) ? 'bg-blue-100' : ''
                        }`}
                        onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                        onDragOver={allowDrop}
                        onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                        onMouseOver={() => handleMouseOver(rowIndex, colIndex)}
                        onClick={() => {
                          const input = document.getElementById(
                            `input-${rowIndex}-${colIndex}`,
                          ) as HTMLInputElement
                          if (input) {
                            input.focus()
                          }
                        }}
                      >
                        <input
                          type="text"
                          autoComplete="off"
                          id={`input-${rowIndex}-${colIndex}`}
                          value={data[rowIndex][colIndex]}
                          onChange={(e) => handleChange(e, rowIndex, colIndex)}
                          className={`b m-0 box-border h-full w-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                            isSelected(rowIndex, colIndex)
                              ? 'bg-blue-100'
                              : `${getCellStyle(data[0][colIndex], data[rowIndex][colIndex])}`
                          }`}
                        />
                      </td>
                    ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex justify-between">
        <button
          onClick={handleAddRow}
          className="rounded-md border border-zinc-800 px-1.5 py-0.5 text-center text-sm font-semibold text-white/80 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
        >
          + Row
        </button>

        <button
          onClick={() =>
            setData(
              Array(rows)
                .fill(0)
                .map(() => Array(cols).fill('')),
            )
          }
          className="rounded-md border border-zinc-800 px-1.5 py-0.5 text-center text-sm font-semibold text-white/80 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
        >
          Clear
        </button>

        <button
          onClick={handleAddCol}
          className="rounded-md border border-zinc-700 px-1.5 py-0.5 text-center text-sm font-semibold text-white/80 transition-all hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
        >
          + Column
        </button>
      </div>
    </div>
  )
}

export default Sheet
