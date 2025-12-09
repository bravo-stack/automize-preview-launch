'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ============================================================================
// Watchtower Polling Hook
// ============================================================================
// Expert-level implementation using visibility-aware polling pattern.
// This hook:
// 1. Polls for stats AND evaluates rules at regular intervals
// 2. Pauses when tab is hidden (saves resources)
// 3. Resumes immediately when tab becomes visible
// 4. Handles cleanup on unmount
// 5. Provides manual refresh capability
// 6. Notifies when new alerts are created
// ============================================================================

interface WatchtowerStats {
  totalRules: number
  activeRules: number
  inactiveRules: number
  totalAlerts: number
  unacknowledgedAlerts: number
  criticalAlerts: number
  warningAlerts: number
  infoAlerts: number
  alertsToday: number
  alertsThisWeek: number
}

interface EvaluationSummary {
  rulesEvaluated: number
  rulesTriggered: number
  alertsCreated: number
  alertsSkippedDuplicate: number
}

interface UseWatchtowerPollingOptions {
  /** Polling interval in milliseconds (default: 30 seconds) */
  interval?: number
  /** Whether polling is enabled (default: true) */
  enabled?: boolean
  /** Callback when stats are updated */
  onStatsUpdate?: (stats: WatchtowerStats) => void
  /** Callback when new alerts are created */
  onNewAlerts?: (count: number) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

interface UseWatchtowerPollingResult {
  stats: WatchtowerStats | null
  isPolling: boolean
  isInitialLoading: boolean
  lastUpdated: Date | null
  lastEvaluation: EvaluationSummary | null
  error: string | null
  refresh: () => Promise<void>
}

const DEFAULT_INTERVAL = 30_000 // 30 seconds

export function useWatchtowerPolling(
  options: UseWatchtowerPollingOptions = {},
): UseWatchtowerPollingResult {
  const {
    interval = DEFAULT_INTERVAL,
    enabled = true,
    onStatsUpdate,
    onNewAlerts,
    onError,
  } = options

  const [stats, setStats] = useState<WatchtowerStats | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [lastEvaluation, setLastEvaluation] =
    useState<EvaluationSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Use refs to avoid stale closures in setInterval
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)
  const isMountedRef = useRef(true)
  const onStatsUpdateRef = useRef(onStatsUpdate)
  const onNewAlertsRef = useRef(onNewAlerts)
  const onErrorRef = useRef(onError)

  // Keep callbacks refs updated
  useEffect(() => {
    onStatsUpdateRef.current = onStatsUpdate
    onNewAlertsRef.current = onNewAlerts
    onErrorRef.current = onError
  }, [onStatsUpdate, onNewAlerts, onError])

  // Fetch stats and evaluate rules from API with cache busting
  const fetchAndEvaluate = useCallback(async () => {
    if (!isMountedRef.current) return

    try {
      setIsPolling(true)
      // Use the evaluate endpoint which combines stats + rule evaluation
      const response = await fetch(
        `/api/watchtower/evaluate?_t=${Date.now()}`,
        {
          cache: 'no-store',
        },
      )
      const json = await response.json()

      if (!isMountedRef.current) return

      if (json.success) {
        setStats(json.data.stats)
        setLastUpdated(new Date())
        setError(null)
        setIsInitialLoading(false)

        // Track evaluation summary
        const evalSummary: EvaluationSummary = {
          rulesEvaluated: json.data.rulesEvaluated,
          rulesTriggered: json.data.rulesTriggered,
          alertsCreated: json.data.alertsCreated,
          alertsSkippedDuplicate: json.data.alertsSkippedDuplicate,
        }
        setLastEvaluation(evalSummary)

        onStatsUpdateRef.current?.(json.data.stats)

        // Notify if new alerts were created
        if (evalSummary.alertsCreated > 0) {
          onNewAlertsRef.current?.(evalSummary.alertsCreated)
        }
      } else {
        const err = new Error(json.error || 'Failed to fetch stats')
        setError(err.message)
        setIsInitialLoading(false)
        onErrorRef.current?.(err)
      }
    } catch (err) {
      if (!isMountedRef.current) return

      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error.message)
      setIsInitialLoading(false)
      onErrorRef.current?.(error)
    } finally {
      if (isMountedRef.current) {
        setIsPolling(false)
      }
    }
  }, [])

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) return // Already polling

    // Fetch immediately on start
    fetchAndEvaluate()

    // Then poll at interval
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current && isMountedRef.current) {
        fetchAndEvaluate()
      }
    }, interval)
  }, [fetchAndEvaluate, interval])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Handle visibility change - pause polling when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible'

      // Fetch immediately when becoming visible (if enabled)
      if (isVisibleRef.current && enabled && isMountedRef.current) {
        fetchAndEvaluate()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, fetchAndEvaluate])

  // Start/stop polling based on enabled state
  useEffect(() => {
    isMountedRef.current = true

    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      isMountedRef.current = false
      stopPolling()
    }
  }, [enabled, startPolling, stopPolling])

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchAndEvaluate()
  }, [fetchAndEvaluate])

  return {
    stats,
    isPolling,
    isInitialLoading,
    lastUpdated,
    lastEvaluation,
    error,
    refresh,
  }
}
