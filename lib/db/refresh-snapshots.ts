'use server'

import { createAdminClient } from './admin'

export type RefreshType = 'financialx' | 'autometric'
export type RefreshStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface SnapshotMetricError {
  field: string
  message: string
  raw_value?: string | number | null
}

export interface SnapshotMetric {
  account_name: string
  pod?: string
  is_monitored?: boolean
  ad_spend_timeframe?: number
  roas_timeframe?: number
  fb_revenue_timeframe?: number
  shopify_revenue_timeframe?: number
  orders_timeframe?: number
  ad_spend_rebill?: number
  roas_rebill?: number
  fb_revenue_rebill?: number
  shopify_revenue_rebill?: number
  orders_rebill?: number
  rebill_status?: string
  last_rebill_date?: string
  cpa_purchase?: number
  cpc?: number
  cpm?: number
  ctr?: number
  quality_ranking?: string
  engagement_rate_ranking?: string
  conversion_rate_ranking?: string
  impressions?: number
  hook_rate?: number
  atc_rate?: number
  ic_rate?: number
  purchase_rate?: number
  bounce_rate?: number
  is_error?: boolean
  error_detail?: {
    errors: SnapshotMetricError[]
    error_count: number
  }
}

export interface CreateSnapshotParams {
  sheetId: number
  refreshType: RefreshType
  datePreset?: string
  metadata?: Record<string, any>
}

/**
 * Common error patterns from Facebook API and other data sources
 */
const ERROR_PATTERNS = [
  /log in to www\.facebook\.com/i,
  /access token/i,
  /invalid/i,
  /expired/i,
  /error/i,
  /could not retrieve/i,
  /bad request/i,
  /forbidden/i,
  /not found/i,
  /rate limit/i,
  /network/i,
  /no data available/i,
  /missing/i,
]

/**
 * Checks if a value contains an error message
 */
function isErrorValue(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value !== 'string') return false
  return ERROR_PATTERNS.some((pattern) => pattern.test(value))
}

/**
 * Extracts error information from a metric row
 * Note: This is an internal function, not exported as a server action
 */
function extractMetricErrors(metric: SnapshotMetric): {
  is_error: boolean
  error_detail: { errors: SnapshotMetricError[]; error_count: number } | null
} {
  const errors: SnapshotMetricError[] = []

  // Define which fields to check for errors and their expected types
  const numericFields: Array<{ key: keyof SnapshotMetric; label: string }> = [
    { key: 'ad_spend_timeframe', label: 'Ad Spend (Timeframe)' },
    { key: 'roas_timeframe', label: 'ROAS (Timeframe)' },
    { key: 'fb_revenue_timeframe', label: 'FB Revenue (Timeframe)' },
    { key: 'shopify_revenue_timeframe', label: 'Shopify Revenue (Timeframe)' },
    { key: 'orders_timeframe', label: 'Orders (Timeframe)' },
    { key: 'ad_spend_rebill', label: 'Ad Spend (Rebill)' },
    { key: 'roas_rebill', label: 'ROAS (Rebill)' },
    { key: 'fb_revenue_rebill', label: 'FB Revenue (Rebill)' },
    { key: 'shopify_revenue_rebill', label: 'Shopify Revenue (Rebill)' },
    { key: 'orders_rebill', label: 'Orders (Rebill)' },
    { key: 'cpa_purchase', label: 'CPA Purchase' },
    { key: 'cpc', label: 'CPC' },
    { key: 'cpm', label: 'CPM' },
    { key: 'ctr', label: 'CTR' },
    { key: 'impressions', label: 'Impressions' },
    { key: 'hook_rate', label: 'Hook Rate' },
    { key: 'atc_rate', label: 'ATC Rate' },
    { key: 'ic_rate', label: 'IC Rate' },
    { key: 'purchase_rate', label: 'Purchase Rate' },
    { key: 'bounce_rate', label: 'Bounce Rate' },
  ]

  for (const { key, label } of numericFields) {
    const value = metric[key]

    // Check if it's an error string value (typically means the API returned an error)
    if (typeof value === 'string' && isErrorValue(value)) {
      errors.push({
        field: key,
        message: value,
        raw_value: value,
      })
    }
  }

  // Check for string fields that might contain errors
  const stringFields: Array<{ key: keyof SnapshotMetric; label: string }> = [
    { key: 'rebill_status', label: 'Rebill Status' },
    { key: 'quality_ranking', label: 'Quality Ranking' },
    { key: 'engagement_rate_ranking', label: 'Engagement Rate Ranking' },
    { key: 'conversion_rate_ranking', label: 'Conversion Rate Ranking' },
  ]

  for (const { key, label } of stringFields) {
    const value = metric[key]
    if (typeof value === 'string' && isErrorValue(value)) {
      errors.push({
        field: key,
        message: value,
        raw_value: value,
      })
    }
  }

  const hasErrors = errors.length > 0

  return {
    is_error: hasErrors,
    error_detail: hasErrors ? { errors, error_count: errors.length } : null,
  }
}

export interface SaveMetricsParams {
  snapshotId: string
  metrics: SnapshotMetric[]
}

export async function createRefreshSnapshot({
  sheetId,
  refreshType,
  datePreset,
  metadata = {},
}: CreateSnapshotParams) {
  const db = createAdminClient()

  // Build query for existing snapshot
  let query = db
    .from('sheet_refresh_snapshots')
    .select('id, refresh_status, snapshot_date')
    .eq('sheet_id', sheetId)
    .eq('refresh_type', refreshType)
    .gte('snapshot_date', new Date().toISOString().split('T')[0])

  // Handle null/undefined datePreset properly
  if (datePreset) {
    query = query.eq('date_preset', datePreset)
  } else {
    query = query.is('date_preset', null)
  }

  const { data: existingSnapshot } = await query.single()

  if (existingSnapshot) {
    const { error: deleteMetricsError } = await db
      .from('refresh_snapshot_metrics')
      .delete()
      .eq('snapshot_id', existingSnapshot.id)

    if (deleteMetricsError) {
      return { success: false, error: deleteMetricsError.message }
    }

    const { error: updateError } = await db
      .from('sheet_refresh_snapshots')
      .update({
        refresh_status: 'in_progress',
        updated_at: new Date().toISOString(),
        metadata,
      })
      .eq('id', existingSnapshot.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return {
      success: true,
      snapshotId: existingSnapshot.id,
      isUpdate: true,
    }
  }

  const { data, error } = await db
    .from('sheet_refresh_snapshots')
    .insert({
      sheet_id: sheetId,
      refresh_type: refreshType,
      date_preset: datePreset || null,
      refresh_status: 'in_progress',
      metadata,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, snapshotId: data.id }
}

export async function updateSnapshotStatus(
  snapshotId: string,
  status: RefreshStatus,
  errorMessage?: string,
) {
  const db = createAdminClient()

  const updateData: any = {
    refresh_status: status,
    updated_at: new Date().toISOString(),
  }

  if (errorMessage) {
    updateData.metadata = { error: errorMessage }
  }

  const { error } = await db
    .from('sheet_refresh_snapshots')
    .update(updateData)
    .eq('id', snapshotId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function saveSnapshotMetrics({
  snapshotId,
  metrics,
}: SaveMetricsParams) {
  const db = createAdminClient()

  // Delete any existing metrics for this snapshot first (to handle retries/duplicates)
  const { error: deleteError } = await db
    .from('refresh_snapshot_metrics')
    .delete()
    .eq('snapshot_id', snapshotId)

  console.log(
    `[saveSnapshotMetrics] Attempted delete of existing metrics for snapshot ${snapshotId}`,
  )

  if (deleteError) {
    console.error(
      '[saveSnapshotMetrics] Error deleting existing metrics:',
      deleteError.message,
    )
  }

  // Deduplicate metrics by account_name (keep last occurrence)
  const uniqueMetrics = new Map<string, (typeof metrics)[0]>()
  for (const metric of metrics) {
    uniqueMetrics.set(metric.account_name, metric)
  }
  const deduplicatedMetrics = Array.from(uniqueMetrics.values())

  console.log(
    `[saveSnapshotMetrics] Original: ${metrics.length}, Deduplicated: ${deduplicatedMetrics.length}`,
  )

  // Process metrics and extract errors
  const metricsToInsert = deduplicatedMetrics.map((metric) => {
    // If is_error and error_detail are already provided, use them
    // Otherwise, extract errors from the metric data
    const { is_error, error_detail } =
      metric.is_error !== undefined
        ? { is_error: metric.is_error, error_detail: metric.error_detail }
        : extractMetricErrors(metric)

    return {
      snapshot_id: snapshotId,
      ...metric,
      is_error,
      error_detail,
    }
  })

  // Log metrics with errors
  const errorMetrics = metricsToInsert.filter((m) => m.is_error)
  if (errorMetrics.length > 0) {
    console.log(
      `[saveSnapshotMetrics] Found ${errorMetrics.length} metrics with errors:`,
      errorMetrics.map((m) => ({
        account: m.account_name,
        errors: m.error_detail?.errors.map((e) => e.message),
      })),
    )
  }

  const { error } = await db
    .from('refresh_snapshot_metrics')
    .insert(metricsToInsert)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getLatestSnapshot(
  sheetId: number,
  refreshType: RefreshType,
) {
  const db = createAdminClient()

  const { data, error } = await db
    .from('sheet_refresh_snapshots')
    .select(
      `
      *,
      refresh_snapshot_metrics (*)
    `,
    )
    .eq('sheet_id', sheetId)
    .eq('refresh_type', refreshType)
    .eq('refresh_status', 'completed')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getSnapshotHistory(
  sheetId: number,
  refreshType: RefreshType,
  limit = 30,
) {
  const db = createAdminClient()

  const { data, error } = await db
    .from('sheet_refresh_snapshots')
    .select('id, snapshot_date, refresh_status, date_preset, metadata')
    .eq('sheet_id', sheetId)
    .eq('refresh_type', refreshType)
    .order('snapshot_date', { ascending: false })
    .limit(limit)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function compareSnapshots(
  snapshotId1: string,
  snapshotId2: string,
) {
  const db = createAdminClient()

  const { data: snapshot1Metrics } = await db
    .from('refresh_snapshot_metrics')
    .select('*')
    .eq('snapshot_id', snapshotId1)

  const { data: snapshot2Metrics } = await db
    .from('refresh_snapshot_metrics')
    .select('*')
    .eq('snapshot_id', snapshotId2)

  if (!snapshot1Metrics || !snapshot2Metrics) {
    return { success: false, error: 'Failed to fetch snapshot metrics' }
  }

  const comparison = snapshot1Metrics.map((m1) => {
    const m2 = snapshot2Metrics.find((m) => m.account_name === m1.account_name)

    return {
      account_name: m1.account_name,
      pod: m1.pod,
      shopify_revenue_change:
        m2 && m1.shopify_revenue_timeframe && m2.shopify_revenue_timeframe
          ? m1.shopify_revenue_timeframe - m2.shopify_revenue_timeframe
          : null,
      roas_change:
        m2 && m1.roas_timeframe && m2.roas_timeframe
          ? m1.roas_timeframe - m2.roas_timeframe
          : null,
      spend_change:
        m2 && m1.ad_spend_timeframe && m2.ad_spend_timeframe
          ? m1.ad_spend_timeframe - m2.ad_spend_timeframe
          : null,
    }
  })

  return { success: true, data: comparison }
}
