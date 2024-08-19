'use client'

import { financialize } from '@/lib/actions'

export default function FinancialX({ stores }: { stores: any[] }) {
  const handleRefresh = async () => {
    const data = await financialize(stores)
    console.log(data)
  }

  return (
    <button onClick={handleRefresh} className="rounded border px-2 py-1.5">
      Refresh Data
    </button>
  )
}
