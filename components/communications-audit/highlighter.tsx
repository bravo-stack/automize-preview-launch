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
            data-highlight="true"
            className="inline-flex items-center justify-center bg-pink-500 px-0 py-0.5 text-white data-[highlight=true]:bg-cyan-500 data-[highlight=true]:text-white"
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
