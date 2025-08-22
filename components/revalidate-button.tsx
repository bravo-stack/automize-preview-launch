'use client'

import { refresh } from '@/lib/actions'
import { useState } from 'react'
import { Button } from './ui/button'

export default function RevalidateButton() {
  const [loading, setLoading] = useState(false)

  const handleRevalidate = async () => {
    setLoading(true)
    await refresh('/dashboard/communications-audit')
    setLoading(false)
  }

  return (
    <Button
      onClick={handleRevalidate}
      size="sm"
      variant="ghost"
      className="inline-flex items-center gap-1.5 border-slate-200 p-2 text-sm"
      disabled={loading}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`size-4 ${loading && 'animate-spin'}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>

      {loading ? 'Loading...' : 'Refresh Page'}
    </Button>
  )
}
