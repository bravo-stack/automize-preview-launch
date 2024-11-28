'use client'

import { useState } from 'react'
import { refresh } from '@/lib/actions'

export default function RefreshButton({ path }) {
  const [isSpinning, setIsSpinning] = useState(false)

  const handleClick = async () => {
    setIsSpinning(true)
    await refresh(path)
    setTimeout(() => {
      setIsSpinning(false)
    }, 1650)
  }

  return (
    <button
      className="rounded-full border border-zinc-800 p-1.5 text-neutral-600 transition-colors hover:bg-night-dusk hover:text-neutral-400"
      onClick={handleClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`size-6 ${isSpinning ? 'animate-spin' : ''}`}
      >
        <path
          fillRule="evenodd"
          d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}
