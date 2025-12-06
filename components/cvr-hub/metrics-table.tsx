'use client'

import { Button } from '@/components/ui/button'
import type { CVRMetricsComparison } from '@/types/cvr-hub'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
  pageSize?: number
}

export default function CVRMetricsTable({
  metrics,
  showComparison,
  pageSize = 10,
}: CVRMetricsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate pagination
  const totalCount = metrics.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // Get current page data
  const paginatedMetrics = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return metrics.slice(start, end)
  }, [metrics, currentPage, pageSize])

  // Reset to page 1 when metrics change
  useEffect(() => {
    setCurrentPage(1)
  }, [metrics])

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
    <div className="space-y-4">
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
            {paginatedMetrics.map((metric, index) => (
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
                <td className="px-4 py-3 text-white/70">
                  {metric.pod || 'N/A'}
                </td>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{' '}
            accounts
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={!hasPrevPage}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={!hasPrevPage}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-3 text-sm text-white/70">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!hasNextPage}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={!hasNextPage}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
