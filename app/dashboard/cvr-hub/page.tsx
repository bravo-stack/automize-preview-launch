'use client'

import AggregateSummary from '@/components/cvr-hub/aggregate-summary'
import CVRMetricsTable from '@/components/cvr-hub/metrics-table'
import PeriodSelector from '@/components/cvr-hub/period-selector'
import SaveCVRButton from '@/components/cvr-hub/save-cvr-button'
import { Alert } from '@/components/ui/alert'
import type {
  ComparisonMode,
  CVRAggregates,
  CVRHubResponse,
  CVRMetricsComparison,
  DateRange,
  PeriodPreset,
} from '@/types/cvr-hub'
import { useCallback, useState } from 'react'

export default function CVRHubPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<CVRMetricsComparison[]>([])
  const [aggregates, setAggregates] = useState<CVRAggregates | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<{
    preset: PeriodPreset
    comparisonMode: ComparisonMode
  }>({
    preset: 'last_7_days',
    comparisonMode: 'previous_period',
  })

  const fetchMetrics = useCallback(
    async (preset: PeriodPreset, comparisonMode: ComparisonMode) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/cvr-hub/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            period: {
              preset,
              comparisonMode,
            },
          }),
        })

        const result: CVRHubResponse = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch metrics')
        }

        setMetrics(result.data.metrics)
        setAggregates(result.data.aggregates)
        setDateRange(result.data.dateRanges.current)
        setCurrentPeriod({ preset, comparisonMode })
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)
        console.error('Error fetching CVR metrics:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const handlePeriodChange = useCallback(
    (preset: PeriodPreset, comparisonMode: ComparisonMode) => {
      fetchMetrics(preset, comparisonMode)
    },
    [fetchMetrics],
  )

  const showComparison = currentPeriod.comparisonMode !== 'none'

  return (
    <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
      <div className="mx-auto max-w-[1800px] space-y-8">
        {/* Header */}
        <header>
          <h1 className="bg-gradient-to-b from-white via-zinc-300/90 to-white/70 bg-clip-text text-4xl font-bold tracking-wide text-transparent">
            CVR Hub
          </h1>
          <p className="mt-2 text-lg text-white/60">
            Track and analyze conversion rates with period-over-period
            comparison
          </p>
        </header>

        {/* Period Selector */}
        <PeriodSelector
          onPeriodChange={handlePeriodChange}
          isLoading={isLoading}
        />

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="border-red-500/30">
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-white/60" />
              <p className="text-white/60">Loading metrics...</p>
            </div>
          </div>
        )}

        {/* Data Display */}
        {!isLoading && metrics.length > 0 && aggregates && dateRange && (
          <>
            {/* Date Range Display */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-sm text-white/60">Viewing Data For</p>
                <p className="text-lg font-medium text-white/90">
                  {new Date(dateRange.startDate).toLocaleDateString()} -{' '}
                  {new Date(dateRange.endDate).toLocaleDateString()}
                </p>
              </div>
              <SaveCVRButton
                metrics={metrics}
                aggregates={aggregates}
                dateRange={dateRange}
                disabled={isLoading}
              />
            </div>

            {/* Aggregate Summary */}
            <AggregateSummary aggregates={aggregates} />

            {/* Metrics Table */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white/90">
                Account Metrics
              </h2>
              <CVRMetricsTable
                metrics={metrics}
                showComparison={showComparison}
              />
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && metrics.length === 0 && (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-white/10 bg-white/5 p-8">
            <div className="text-center">
              <p className="text-lg text-white/60">
                Select a time period to view CVR metrics
              </p>
              <p className="mt-2 text-sm text-white/40">
                Data will be fetched from your refresh snapshots
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
