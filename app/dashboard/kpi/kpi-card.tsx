interface KPIMetric {
  key: string
  value: string | number | null
}

interface KPIData {
  label: string
  value: KPIMetric[]
}

interface KPICardProps {
  title: string
  kpi: KPIData
  lastRefresh?: string
}

function isUnavailable(value: string | number | null): boolean {
  return value === 'n/a' || value === null
}

export function KPICard({ title, kpi, lastRefresh }: KPICardProps) {
  // Find the "Last refresh date" metric to display in header
  const lastRefreshMetric = kpi.value.find(
    (metric) => metric.key.toLowerCase() === 'last refresh date',
  )

  // Filter out the "Last refresh date" from body metrics
  const bodyMetrics = kpi.value.filter(
    (metric) => metric.key.toLowerCase() !== 'last refresh date',
  )

  return (
    <div className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-5 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          {lastRefreshMetric && !isUnavailable(lastRefreshMetric.value) && (
            <span className="text-xs text-zinc-500">
              {lastRefreshMetric.value}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bodyMetrics.map((metric, index) => {
            const unavailable = isUnavailable(metric.value)
            return (
              <div key={index} className="space-y-1">
                <p className="text-xs font-medium text-zinc-400">
                  {metric.key}
                </p>
                <p
                  className={`text-sm font-semibold ${unavailable ? 'italic text-zinc-500' : 'text-zinc-100'}`}
                >
                  {unavailable ? 'N/A' : metric.value}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
