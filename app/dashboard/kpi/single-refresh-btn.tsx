'use client'

import { refreshSheet } from '@/lib/actions'
import { RefreshCw } from 'lucide-react'
import { useTransition } from 'react'

export function IndividualRefreshButton({ sheet_id }: { sheet_id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await refreshSheet(sheet_id)
      if (result?.error) {
        alert(`Error: ${result.error}`)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="p-1 text-zinc-500 transition-colors hover:text-white disabled:animate-spin disabled:cursor-not-allowed disabled:text-zinc-600"
      aria-label="Refresh data"
    >
      <RefreshCw className="h-4 w-4" />
    </button>
  )
}
