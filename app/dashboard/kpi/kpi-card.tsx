'use client'

import { IndividualRefreshButton } from './single-refresh-btn'

type KpiValue = {
  key: string
  value: string | null
}

type KPICardProps = {
  title: string
  kpi: KpiValue[]
  refreshedAt: string | null
  sheet_id: string
}

function KpiCell({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex flex-col">
      <span className="truncate text-sm text-zinc-400" title={label}>
        {label}
      </span>
      <span className="text-2xl font-bold text-white">{value || '-'}</span>
    </div>
  )
}

function normalizeKey(key: string): string {
  const lowerKey = key.toLowerCase()

  if (lowerKey.includes('since rebill')) {
    if (lowerKey.startsWith('ad spend')) return 'ad spend since rebill'
    if (lowerKey.startsWith('roas')) return 'roas since rebill'
    if (lowerKey.startsWith('revenue')) return 'revenue since rebill'

    if (lowerKey.includes('order')) return 'orders since rebill'
  }

  if (lowerKey.startsWith('ad spend')) return 'ad spend'
  if (lowerKey.startsWith('roas')) return 'roas'
  if (lowerKey.startsWith('revenue')) return 'revenue'

  if (lowerKey.includes('order')) return 'order'

  return lowerKey
}

export function KPICard({ title, kpi, refreshedAt, sheet_id }: KPICardProps) {
  const formattedRefreshTime = refreshedAt
    ? new Date(refreshedAt).toDateString()
    : 'N/A'

  const layout = [
    ['ad spend', 'ad spend since rebill', 'order'],
    ['roas', 'roas since rebill', 'orders since rebill'],
    ['revenue', 'revenue since rebill'],
  ]

  const kpiMap = new Map(
    kpi.map((item) => {
      const normalized = normalizeKey(item.key)
      return [normalized, item]
    }),
  )

  return (
    <div className="relative flex flex-col gap-6 rounded-lg border border-zinc-700 bg-zinc-900 p-6">
      <div className="flex w-full items-center justify-between gap-1">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-xs text-zinc-500">
          Last Refreshed: {formattedRefreshTime}
        </p>
        <IndividualRefreshButton sheet_id={sheet_id} />
      </div>

      <div className="space-y-5">
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 gap-x-4 gap-y-2">
            {row.map((normalizedKey) => {
              const dataItem = kpiMap.get(normalizedKey)
              const dataItemKey = dataItem?.key
              const dataItemValue = dataItem?.value

              return dataItemKey && dataItemValue ? (
                <KpiCell
                  key={normalizedKey}
                  label={dataItemKey}
                  value={dataItemValue}
                />
              ) : (
                <KpiCell
                  key={normalizedKey}
                  label={dataItemKey ?? 'N/A'}
                  value={dataItemValue}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
