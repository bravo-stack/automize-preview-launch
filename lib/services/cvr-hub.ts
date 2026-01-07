import type {
  CVRAggregates,
  CVRMetricsComparison,
  CVRQueryParams,
  DateRange,
  PeriodSelection,
} from '@/types/cvr-hub'
import { createAdminClient } from '../db/admin'

// ============================================================================
// Period Calculation Utilities
// ============================================================================

export function calculateDateRange(
  preset: PeriodSelection['preset'],
  customRange?: DateRange,
): DateRange {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  switch (preset) {
    case 'today': {
      const today = new Date(now)
      return {
        startDate: today.toISOString(),
        endDate: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59,
        ).toISOString(),
      }
    }

    case 'yesterday': {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        startDate: yesterday.toISOString(),
        endDate: new Date(
          yesterday.getFullYear(),
          yesterday.getMonth(),
          yesterday.getDate(),
          23,
          59,
          59,
        ).toISOString(),
      }
    }

    case 'last_7_days': {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      return {
        startDate: start.toISOString(),
        endDate: now.toISOString(),
      }
    }

    case 'last_14_days': {
      const start = new Date(now)
      start.setDate(start.getDate() - 14)
      return {
        startDate: start.toISOString(),
        endDate: now.toISOString(),
      }
    }

    case 'last_30_days': {
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      return {
        startDate: start.toISOString(),
        endDate: now.toISOString(),
      }
    }

    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        startDate: start.toISOString(),
        endDate: now.toISOString(),
      }
    }

    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      }
    }

    case 'custom':
      if (!customRange) {
        throw new Error('Custom range requires startDate and endDate')
      }
      return customRange

    default:
      return {
        startDate: now.toISOString(),
        endDate: now.toISOString(),
      }
  }
}

export function calculateComparisonRange(
  currentRange: DateRange,
  mode: PeriodSelection['comparisonMode'],
): DateRange | null {
  if (mode === 'none') return null

  const start = new Date(currentRange.startDate)
  const end = new Date(currentRange.endDate)
  const durationMs = end.getTime() - start.getTime()

  if (mode === 'previous_period') {
    const comparisonEnd = new Date(start.getTime() - 1)
    const comparisonStart = new Date(comparisonEnd.getTime() - durationMs)
    return {
      startDate: comparisonStart.toISOString(),
      endDate: comparisonEnd.toISOString(),
    }
  }

  if (mode === 'same_period_last_year') {
    const comparisonStart = new Date(start)
    comparisonStart.setFullYear(comparisonStart.getFullYear() - 1)
    const comparisonEnd = new Date(end)
    comparisonEnd.setFullYear(comparisonEnd.getFullYear() - 1)
    return {
      startDate: comparisonStart.toISOString(),
      endDate: comparisonEnd.toISOString(),
    }
  }

  return null
}

function calculateChange(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null
  return Number((((current - previous) / previous) * 100).toFixed(2))
}

// ============================================================================
// Database Query Functions
// ============================================================================

/**
 * Fetches the LATEST CVR log for each client within the given period
 */
async function fetchLatestCVRLogs(
  dateRange: DateRange,
  filters?: Pick<CVRQueryParams, 'clientId' | 'pod' | 'brand'>,
) {
  const db = createAdminClient()

  // We want the latest log for each client in the period.
  // Strategy: Fetch all logs in period, then group by client in JS (or use DISTINCT ON in SQL if supported via supabase-js helper, but JS is safer for now)
  
  let query = db
    .from('client_cvr_logs')
    .select(`
      id,
      client_id,
      store_id,
      cvr_value,
      status,
      created_at,
      clients (
        id,
        brand,
        pod
      )
    `)
    .gte('created_at', dateRange.startDate)
    .lte('created_at', dateRange.endDate)
    .order('created_at', { ascending: false })

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId)
  }

  // Filter by Pod/Brand requires joining clients, Supabase filter on joined table:
  if (filters?.pod) {
    query = query.eq('clients.pod', filters.pod)
  }
  if (filters?.brand) {
    query = query.ilike('clients.brand', `%${filters.brand}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching CVR logs:', error)
    return []
  }

  // Group by client_id (or store_id) and take the first (latest) one
  const latestLogs = new Map<string, any>()
  
  for (const log of data || []) {
    // If we have client_id use it, otherwise use store_id
    const key = log.client_id ? `client_${log.client_id}` : `store_${log.store_id}`
    
    if (!latestLogs.has(key)) {
      // Apply Client Filters (Supabase nested filter doesn't always work as expected with left joins if not inner, but let's do safe check)
      const client = log.clients as any
      
      if (filters?.pod && client?.pod !== filters.pod) continue
      
      latestLogs.set(key, {
        id: log.id,
        clientId: log.client_id,
        storeId: log.store_id,
        brand: client?.brand || log.store_id || 'Unknown',
        pod: client?.pod || null,
        cvrValue: log.cvr_value,
        status: log.status,
        createdAt: log.created_at
      })
    }
  }

  return Array.from(latestLogs.values())
}

export async function fetchCVRMetricsWithComparison(
  params: CVRQueryParams,
): Promise<CVRMetricsComparison[]> {
  const currentRange = calculateDateRange(
    params.period.preset,
    params.period.customRange,
  )
  const comparisonRange = calculateComparisonRange(
    currentRange,
    params.period.comparisonMode,
  )

  const currentLogs = await fetchLatestCVRLogs(currentRange, {
    clientId: params.clientId,
    pod: params.pod,
    brand: params.brand,
  })

  if (!comparisonRange || params.period.comparisonMode === 'none') {
    return currentLogs.map((log) => ({
      ...log,
      previous: null,
      change: null,
    }))
  }

  const previousLogs = await fetchLatestCVRLogs(comparisonRange, {
    clientId: params.clientId,
    pod: params.pod,
    brand: params.brand,
  })

  // Create lookup for previous logs
  const previousLookup = new Map<string, any>()
  previousLogs.forEach(log => {
    const key = log.clientId ? `client_${log.clientId}` : `store_${log.storeId}`
    previousLookup.set(key, log)
  })

  return currentLogs.map((current) => {
    const key = current.clientId ? `client_${current.clientId}` : `store_${current.storeId}`
    const previous = previousLookup.get(key)

    if (!previous || previous.cvrValue === null || current.cvrValue === null) {
      return {
        ...current,
        previous: previous ? {
          cvrValue: previous.cvrValue,
          createdAt: previous.createdAt
        } : null,
        change: null
      }
    }

    return {
      ...current,
      previous: {
        cvrValue: previous.cvrValue,
        createdAt: previous.createdAt
      },
      change: calculateChange(current.cvrValue, previous.cvrValue)
    }
  })
}

export function calculateCVRAggregates(metrics: CVRMetricsComparison[]): CVRAggregates {
  if (metrics.length === 0) {
    return {
      avgCVR: 0,
      totalLogs: 0,
    }
  }

  const totalCVR = metrics.reduce((sum, m) => sum + (m.cvrValue || 0), 0)
  const validCount = metrics.filter(m => m.cvrValue !== null).length

  return {
    avgCVR: validCount > 0 ? Number((totalCVR / validCount).toFixed(4)) : 0,
    totalLogs: metrics.length,
  }
}