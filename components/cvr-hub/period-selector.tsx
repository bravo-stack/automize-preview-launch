'use client'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { ComparisonMode, PeriodPreset } from '@/types/cvr-hub'
import { useEffect, useState } from 'react'

interface PeriodSelectorProps {
  onPeriodChange: (preset: PeriodPreset, comparisonMode: ComparisonMode) => void
  isLoading?: boolean
}

export default function PeriodSelector({
  onPeriodChange,
  isLoading = false,
}: PeriodSelectorProps) {
  const [selectedPreset, setSelectedPreset] =
    useState<PeriodPreset>('last_7_days')
  const [selectedComparison, setSelectedComparison] =
    useState<ComparisonMode>('previous_period')

  useEffect(() => {
    onPeriodChange(selectedPreset, selectedComparison)
  }, [selectedPreset, selectedComparison, onPeriodChange])

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value as PeriodPreset
    setSelectedPreset(preset)
  }

  const handleComparisonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as ComparisonMode
    setSelectedComparison(mode)
  }

  const handleRefresh = () => {
    onPeriodChange(selectedPreset, selectedComparison)
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
      <Select
        label="Time Period"
        value={selectedPreset}
        onChange={handlePresetChange}
        disabled={isLoading}
        className="w-48"
      >
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="last_7_days">Last 7 Days</option>
        <option value="last_14_days">Last 14 Days</option>
        <option value="last_30_days">Last 30 Days</option>
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
      </Select>

      <Select
        label="Compare To"
        value={selectedComparison}
        onChange={handleComparisonChange}
        disabled={isLoading}
        className="w-56"
      >
        <option value="previous_period">Previous Period</option>
        <option value="same_period_last_year">Same Period Last Year</option>
        <option value="none">No Comparison</option>
      </Select>

      <Button
        onClick={handleRefresh}
        disabled={isLoading}
        className="h-10"
        variant="outline"
      >
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  )
}
