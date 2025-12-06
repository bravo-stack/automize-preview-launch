import type {
  CVRAggregates,
  CVRMetrics,
  CVRMetricsComparison,
  CVRQueryParams,
  DateRange,
  PeriodSelection,
} from '@/types/cvr-hub'
import { createAdminClient } from '../db/admin'

// ============================================================================
// Period Calculation Utilities (Pure Functions - No Server Action)
// ============================================================================

/**
 * Converts period preset to concrete date range
 */
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

/**
 * Calculates comparison period based on current range and comparison mode
 */
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

// ============================================================================
// CVR Calculation Utilities
// ============================================================================

/**
 * Safely calculates percentage rate, handles division by zero
 */
function calculateRate(numerator: number, denominator: number): number {
  if (denominator === 0 || !denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(4))
}

/**
 * Calculates percentage change between current and previous values
 */
function calculateChange(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null
  return Number((((current - previous) / previous) * 100).toFixed(2))
}

/**
 * Transforms raw snapshot metrics to CVR metrics with calculated rates
 */
function transformToCVRMetrics(rawMetric: any): CVRMetrics {
  const impressions = rawMetric.impressions || 0
  const clicks = impressions * ((rawMetric.ctr || 0) / 100) // Reverse calculate from CTR
  const atc = clicks * ((rawMetric.atc_rate || 0) / 100)
  const initCheckout = atc * ((rawMetric.ic_rate || 0) / 100)
  const purchases = rawMetric.orders_timeframe || 0

  return {
    accountName: rawMetric.account_name,
    pod: rawMetric.pod || null,
    isMonitored: rawMetric.is_monitored || false,
    impressions,
    clicks,
    atc,
    initCheckout,
    purchases,
    ctr: rawMetric.ctr || 0,
    hookRate: rawMetric.hook_rate || 0,
    atcRate: rawMetric.atc_rate || 0,
    icRate: rawMetric.ic_rate || 0,
    purchaseRate: rawMetric.purchase_rate || 0,
    bounceRate: rawMetric.bounce_rate || 0,
    overallCVR: calculateRate(purchases, clicks),
    adSpend: rawMetric.ad_spend_timeframe || 0,
    revenue: rawMetric.shopify_revenue_timeframe || 0,
    roas: rawMetric.roas_timeframe || 0,
    cpa: rawMetric.cpa_purchase || 0,
    cpc: rawMetric.cpc || 0,
    cpm: rawMetric.cpm || 0,
    recordDate: rawMetric.created_at,
  }
}

// ============================================================================
// Database Query Functions
// ============================================================================

/**
 * Fetches CVR metrics from refresh_snapshot_metrics for given date range
 */
export async function fetchCVRMetricsForPeriod(
  dateRange: DateRange,
  filters?: Pick<
    CVRQueryParams,
    'clientId' | 'pod' | 'accountName' | 'isMonitored'
  >,
): Promise<CVRMetrics[]> {
  const db = createAdminClient()

  let query = db
    .from('refresh_snapshot_metrics')
    .select(
      `
      *,
      snapshot:sheet_refresh_snapshots!inner(
        snapshot_date,
        refresh_status
      )
    `,
    )
    .gte('snapshot.snapshot_date', dateRange.startDate.split('T')[0])
    .lte('snapshot.snapshot_date', dateRange.endDate.split('T')[0])
    .eq('snapshot.refresh_status', 'completed')
    .eq('is_error', false)

  if (filters?.pod) {
    query = query.eq('pod', filters.pod)
  }

  if (filters?.accountName) {
    query = query.ilike('account_name', `%${filters.accountName}%`)
  }

  if (filters?.isMonitored !== undefined) {
    query = query.eq('is_monitored', filters.isMonitored)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching CVR metrics:', error)
    return []
  }

  return (data || []).map(transformToCVRMetrics)
}

/**
 * Fetches CVR metrics with period comparison
 */
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

  const currentMetrics = await fetchCVRMetricsForPeriod(currentRange, {
    clientId: params.clientId,
    pod: params.pod,
    accountName: params.accountName,
    isMonitored: params.isMonitored,
  })

  if (!comparisonRange || params.period.comparisonMode === 'none') {
    return currentMetrics.map((metric) => ({
      ...metric,
      previous: null,
      changes: {
        overallCVR: null,
        atcRate: null,
        icRate: null,
        purchaseRate: null,
        hookRate: null,
        bounceRate: null,
        roas: null,
        cpa: null,
        impressions: null,
        clicks: null,
        purchases: null,
      },
    }))
  }

  const previousMetrics = await fetchCVRMetricsForPeriod(comparisonRange, {
    clientId: params.clientId,
    pod: params.pod,
    accountName: params.accountName,
    isMonitored: params.isMonitored,
  })

  // Create lookup map for previous metrics by account name
  const previousLookup = new Map(previousMetrics.map((m) => [m.accountName, m]))

  return currentMetrics.map((current) => {
    const previous = previousLookup.get(current.accountName)

    if (!previous) {
      return {
        ...current,
        previous: null,
        changes: {
          overallCVR: null,
          atcRate: null,
          icRate: null,
          purchaseRate: null,
          hookRate: null,
          bounceRate: null,
          roas: null,
          cpa: null,
          impressions: null,
          clicks: null,
          purchases: null,
        },
      }
    }

    return {
      ...current,
      previous: {
        overallCVR: previous.overallCVR,
        atcRate: previous.atcRate,
        icRate: previous.icRate,
        purchaseRate: previous.purchaseRate,
        hookRate: previous.hookRate,
        bounceRate: previous.bounceRate,
        roas: previous.roas,
        cpa: previous.cpa,
        impressions: previous.impressions,
        clicks: previous.clicks,
        purchases: previous.purchases,
      },
      changes: {
        overallCVR: calculateChange(current.overallCVR, previous.overallCVR),
        atcRate: calculateChange(current.atcRate, previous.atcRate),
        icRate: calculateChange(current.icRate, previous.icRate),
        purchaseRate: calculateChange(
          current.purchaseRate,
          previous.purchaseRate,
        ),
        hookRate: calculateChange(current.hookRate, previous.hookRate),
        bounceRate: calculateChange(current.bounceRate, previous.bounceRate),
        roas: calculateChange(current.roas, previous.roas),
        cpa: calculateChange(current.cpa, previous.cpa),
        impressions: calculateChange(current.impressions, previous.impressions),
        clicks: calculateChange(current.clicks, previous.clicks),
        purchases: calculateChange(current.purchases, previous.purchases),
      },
    }
  })
}

/**
 * Calculates aggregate metrics for CVR data
 */
export function calculateCVRAggregates(metrics: CVRMetrics[]): CVRAggregates {
  if (metrics.length === 0) {
    return {
      totalImpressions: 0,
      totalClicks: 0,
      totalATC: 0,
      totalInitCheckout: 0,
      totalPurchases: 0,
      totalAdSpend: 0,
      totalRevenue: 0,
      avgCVR: 0,
      avgROAS: 0,
      avgCPA: 0,
      avgCTR: 0,
      avgHookRate: 0,
      avgATCRate: 0,
      avgICRate: 0,
      avgPurchaseRate: 0,
      avgBounceRate: 0,
    }
  }

  const totals = metrics.reduce(
    (acc, metric) => ({
      impressions: acc.impressions + metric.impressions,
      clicks: acc.clicks + metric.clicks,
      atc: acc.atc + metric.atc,
      initCheckout: acc.initCheckout + metric.initCheckout,
      purchases: acc.purchases + metric.purchases,
      adSpend: acc.adSpend + metric.adSpend,
      revenue: acc.revenue + metric.revenue,
      cvr: acc.cvr + metric.overallCVR,
      roas: acc.roas + metric.roas,
      cpa: acc.cpa + metric.cpa,
      ctr: acc.ctr + metric.ctr,
      hookRate: acc.hookRate + metric.hookRate,
      atcRate: acc.atcRate + metric.atcRate,
      icRate: acc.icRate + metric.icRate,
      purchaseRate: acc.purchaseRate + metric.purchaseRate,
      bounceRate: acc.bounceRate + metric.bounceRate,
    }),
    {
      impressions: 0,
      clicks: 0,
      atc: 0,
      initCheckout: 0,
      purchases: 0,
      adSpend: 0,
      revenue: 0,
      cvr: 0,
      roas: 0,
      cpa: 0,
      ctr: 0,
      hookRate: 0,
      atcRate: 0,
      icRate: 0,
      purchaseRate: 0,
      bounceRate: 0,
    },
  )

  const count = metrics.length

  return {
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalATC: totals.atc,
    totalInitCheckout: totals.initCheckout,
    totalPurchases: totals.purchases,
    totalAdSpend: Number(totals.adSpend.toFixed(2)),
    totalRevenue: Number(totals.revenue.toFixed(2)),
    avgCVR: Number((totals.cvr / count).toFixed(4)),
    avgROAS: Number((totals.roas / count).toFixed(4)),
    avgCPA: Number((totals.cpa / count).toFixed(2)),
    avgCTR: Number((totals.ctr / count).toFixed(4)),
    avgHookRate: Number((totals.hookRate / count).toFixed(4)),
    avgATCRate: Number((totals.atcRate / count).toFixed(4)),
    avgICRate: Number((totals.icRate / count).toFixed(4)),
    avgPurchaseRate: Number((totals.purchaseRate / count).toFixed(4)),
    avgBounceRate: Number((totals.bounceRate / count).toFixed(4)),
  }
}

/**
 * Gets list of unique pods from metrics
 */
export async function getUniquePods(): Promise<string[]> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('refresh_snapshot_metrics')
    .select('pod')
    .not('pod', 'is', null)
    .order('pod')

  if (error) return []

  const uniquePods = Array.from(
    new Set((data || []).map((d) => d.pod).filter(Boolean)),
  )
  return uniquePods as string[]
}

/**
 * Gets list of unique account names from metrics
 */
export async function getUniqueAccountNames(): Promise<string[]> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('refresh_snapshot_metrics')
    .select('account_name')
    .order('account_name')

  if (error) return []

  const uniqueAccounts = Array.from(
    new Set((data || []).map((d) => d.account_name).filter(Boolean)),
  )
  return uniqueAccounts as string[]
}
