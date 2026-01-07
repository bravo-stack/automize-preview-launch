'use client'

import type { CVRAggregates } from '@/types/cvr-hub'
import { Activity, Database, TrendingUp } from 'lucide-react'

interface AggregateSummaryProps {
  aggregates: CVRAggregates
  showComparison: boolean
}

export default function AggregateSummary({
  aggregates,
  showComparison,
}: AggregateSummaryProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Logs */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Database className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-white/90">Total Logs</h3>
            <p className="text-xs text-white/50">In Selected Period</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-white/90">
            {aggregates.totalLogs.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Average CVR */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-500/10 p-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-medium text-white/90">Average CVR</h3>
            <p className="text-xs text-white/50">Across All Logs</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-white/90">
            {aggregates.avgCVR.toFixed(4)}%
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2">
            <Activity className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-white/90">Log Status</h3>
            <p className="text-xs text-white/50">Data Health</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-sm text-white/70">System Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}