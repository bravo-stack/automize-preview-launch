'use client'

import type { CVRMetricsComparison } from '@/types/cvr-hub'

interface MetricChangeProps {
  value: number | null
}

function MetricChange({ value }: MetricChangeProps) {
  if (value === null) return <span className="text-white/40">N/A</span>

  const isPositive = value > 0
  const isNegative = value < 0

  return (
    <span
      className={`font-medium ${
        isPositive
          ? 'text-green-400'
          : isNegative
            ? 'text-red-400'
            : 'text-white/60'
      }`}
    >
      {isPositive ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  )
}

interface CVRMetricsTableProps {
  metrics: CVRMetricsComparison[]
  showComparison: boolean
}

export default function CVRMetricsTable({
  metrics,
  showComparison,
}: CVRMetricsTableProps) {
  if (metrics.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-white/10 bg-white/5 p-8">
        <p className="text-white/60">
          No data available for the selected period
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 bg-white/5">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-white/90">
              Account
            </th>
            <th className="px-4 py-3 text-left font-medium text-white/90">
              Pod
            </th>
            <th className="px-4 py-3 text-right font-medium text-white/90">
              Impressions
            </th>
            <th className="px-4 py-3 text-right font-medium text-white/90">
              Clicks
            </th>
            <th className="px-4 py-3 text-right font-medium text-white/90">
              Purchases
            </th>
            <th className="px-4 py-3 text-right font-medium text-white/90">
              CVR %
            </th>
            {showComparison && (
              <th className="px-4 py-3 text-right font-medium text-white/90">
                Change
              </th>
            )}
            <th className="px-4 py-3 text-right font-medium text-white/90">
              ATC Rate %
            </th>
            {showComparison && (
              <th className="px-4 py-3 text-right font-medium text-white/90">
                Change
              </th>
            )}
            <th className="px-4 py-3 text-right font-medium text-white/90">
              IC Rate %
            </th>
            {showComparison && (
              <th className="px-4 py-3 text-right font-medium text-white/90">
                Change
              </th>
            )}
            <th className="px-4 py-3 text-right font-medium text-white/90">
              ROAS
            </th>
            {showComparison && (
              <th className="px-4 py-3 text-right font-medium text-white/90">
                Change
              </th>
            )}
            <th className="px-4 py-3 text-right font-medium text-white/90">
              Ad Spend
            </th>
            <th className="px-4 py-3 text-right font-medium text-white/90">
              Revenue
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {metrics.map((metric, index) => (
            <tr
              key={`${metric.accountName}-${index}`}
              className="transition-colors hover:bg-white/5"
            >
              <td className="px-4 py-3 text-white/90">
                {metric.accountName}
                {metric.isMonitored && (
                  <span className="ml-2 rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-400">
                    Monitored
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-white/70">{metric.pod || 'N/A'}</td>
              <td className="px-4 py-3 text-right text-white/90">
                {metric.impressions.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-white/90">
                {Math.round(metric.clicks).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-white/90">
                {metric.purchases.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-medium text-white/90">
                {metric.overallCVR.toFixed(4)}%
              </td>
              {showComparison && (
                <td className="px-4 py-3 text-right">
                  <MetricChange value={metric.changes.overallCVR} />
                </td>
              )}
              <td className="px-4 py-3 text-right text-white/90">
                {metric.atcRate.toFixed(4)}%
              </td>
              {showComparison && (
                <td className="px-4 py-3 text-right">
                  <MetricChange value={metric.changes.atcRate} />
                </td>
              )}
              <td className="px-4 py-3 text-right text-white/90">
                {metric.icRate.toFixed(4)}%
              </td>
              {showComparison && (
                <td className="px-4 py-3 text-right">
                  <MetricChange value={metric.changes.icRate} />
                </td>
              )}
              <td className="px-4 py-3 text-right font-medium text-white/90">
                {metric.roas.toFixed(2)}
              </td>
              {showComparison && (
                <td className="px-4 py-3 text-right">
                  <MetricChange value={metric.changes.roas} />
                </td>
              )}
              <td className="px-4 py-3 text-right text-white/90">
                $
                {metric.adSpend.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="px-4 py-3 text-right text-white/90">
                $
                {metric.revenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
