'use client'

import { memo, useMemo } from 'react'

type Props = { text: string; query: string }

const Highlighter = ({ text, query }: Props) => {
  // HOOKS
  const highlightedParts = useMemo(() => {
    if (!query) return [text]

    const regex = new RegExp(`(${query})`, 'gi')
    return text.split(regex)
  }, [text, query])

  return (
    <>
      {highlightedParts.map((part, i) =>
        query && new RegExp(query, 'gi').test(part) ? (
          <span
            key={i}
            data-highlight="false"
            className="inline-flex items-center justify-center px-0 py-0 data-[highlight=false]:bg-cyan-300 data-[highlight=true]:bg-black data-[highlight=false]:text-gray-800 data-[highlight=true]:text-gray-100"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

export default memo(Highlighter)
