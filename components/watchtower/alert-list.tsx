'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { WatchtowerAlertWithRelations } from '@/types/watchtower'
import {
  AlertTriangle,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Info,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'

interface AlertListProps {
  alerts: WatchtowerAlertWithRelations[]
  onAcknowledge: (alertId: string) => void
  onBulkAcknowledge: (alertIds: string[]) => void
  onDelete: (alert: WatchtowerAlertWithRelations) => void
  isLoading?: boolean
}

export default function AlertList({
  alerts,
  onAcknowledge,
  onBulkAcknowledge,
  onDelete,
  isLoading = false,
}: AlertListProps) {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set())
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set())

  const toggleExpand = (alertId: string) => {
    setExpandedAlerts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(alertId)) {
        newSet.delete(alertId)
      } else {
        newSet.add(alertId)
      }
      return newSet
    })
  }

  const toggleSelect = (alertId: string) => {
    setSelectedAlerts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(alertId)) {
        newSet.delete(alertId)
      } else {
        newSet.add(alertId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    const unacknowledged = alerts
      .filter((a) => !a.is_acknowledged)
      .map((a) => a.id)
    setSelectedAlerts(new Set(unacknowledged))
  }

  const clearSelection = () => {
    setSelectedAlerts(new Set())
  }

  const handleBulkAcknowledge = () => {
    const ids = Array.from(selectedAlerts)
    if (ids.length > 0) {
      onBulkAcknowledge(ids)
      setSelectedAlerts(new Set())
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge className="border-red-500/30 bg-red-500/20 text-red-400">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Critical
          </Badge>
        )
      case 'warning':
        return (
          <Badge className="border-yellow-500/30 bg-yellow-500/20 text-yellow-400">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Warning
          </Badge>
        )
      default:
        return (
          <Badge className="border-blue-500/30 bg-blue-500/20 text-blue-400">
            <Info className="mr-1 h-3 w-3" />
            Info
          </Badge>
        )
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const unacknowledgedCount = alerts.filter((a) => !a.is_acknowledged).length

  if (alerts.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <div className="text-center">
          <Check className="mx-auto h-12 w-12 text-green-400" />
          <p className="mt-4 text-white/60">No alerts</p>
          <p className="text-sm text-white/40">
            Everything is running smoothly
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {unacknowledgedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70">
              {selectedAlerts.size > 0
                ? `${selectedAlerts.size} selected`
                : `${unacknowledgedCount} unacknowledged`}
            </span>
            {selectedAlerts.size === 0 ? (
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
            )}
          </div>

          {selectedAlerts.size > 0 && (
            <Button
              size="sm"
              onClick={handleBulkAcknowledge}
              disabled={isLoading}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Acknowledge Selected
            </Button>
          )}
        </div>
      )}

      {/* Alert List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-lg border transition-all ${
              alert.is_acknowledged
                ? 'border-white/5 bg-white/[0.02] opacity-60'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Checkbox for unacknowledged */}
              {!alert.is_acknowledged && (
                <input
                  type="checkbox"
                  checked={selectedAlerts.has(alert.id)}
                  onChange={() => toggleSelect(alert.id)}
                  className="mt-1 rounded border-white/20 bg-zinc-900"
                />
              )}

              {/* Expand Button */}
              <button
                onClick={() => toggleExpand(alert.id)}
                className="mt-1 text-white/60 hover:text-white"
              >
                {expandedAlerts.has(alert.id) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {/* Alert Content */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {getSeverityBadge(alert.severity)}
                  {alert.is_acknowledged && (
                    <Badge
                      variant="outline"
                      className="border-green-500/30 text-green-400"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Acknowledged
                    </Badge>
                  )}
                  <span className="text-xs text-white/50">
                    {formatTimeAgo(alert.created_at)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/90">{alert.message}</p>

                {alert.rule && (
                  <p className="mt-1 text-xs text-white/50">
                    Rule: {alert.rule.name}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!alert.is_acknowledged && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAcknowledge(alert.id)}
                    disabled={isLoading}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Ack
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(alert)}
                  disabled={isLoading}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedAlerts.has(alert.id) && (
              <div className="border-t border-white/10 px-4 py-3">
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <span className="text-white/50">Current Value</span>
                    <p className="font-mono text-white/80">
                      {alert.current_value || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50">Previous Value</span>
                    <p className="font-mono text-white/80">
                      {alert.previous_value || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50">Rule Condition</span>
                    <p className="text-white/80">
                      {alert.rule?.field_name} {alert.rule?.condition}{' '}
                      {alert.rule?.threshold_value}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50">Source</span>
                    <p className="text-white/80">
                      {alert.rule?.source?.display_name || 'N/A'}
                    </p>
                  </div>
                </div>

                {alert.is_acknowledged && (
                  <div className="mt-3 text-sm">
                    <span className="text-white/50">Acknowledged: </span>
                    <span className="text-white/80">
                      {alert.acknowledged_by || 'Unknown'} on{' '}
                      {alert.acknowledged_at
                        ? new Date(alert.acknowledged_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                )}

                <div className="mt-3 text-xs text-white/40">
                  Alert ID: {alert.id}
                  {alert.record_id && ` • Record: ${alert.record_id}`}
                  {alert.snapshot_id && ` • Snapshot: ${alert.snapshot_id}`}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
