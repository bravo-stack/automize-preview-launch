export type RefreshType = 'financialx' | 'autometric'
export type RefreshStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface SheetRefreshSnapshot {
  id: string
  sheet_id: number
  refresh_type: RefreshType
  refresh_status: RefreshStatus
  date_preset: string | null
  snapshot_date: string
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export interface RefreshSnapshotMetricError {
  field: string
  message: string
  raw_value?: string | number | null
}

export interface RefreshSnapshotMetric {
  id: string
  snapshot_id: string
  account_name: string
  pod: string | null
  is_monitored: boolean
  ad_spend_timeframe: number | null
  roas_timeframe: number | null
  fb_revenue_timeframe: number | null
  shopify_revenue_timeframe: number | null
  orders_timeframe: number | null
  ad_spend_rebill: number | null
  roas_rebill: number | null
  fb_revenue_rebill: number | null
  shopify_revenue_rebill: number | null
  orders_rebill: number | null
  rebill_status: string | null
  last_rebill_date: string | null
  cpa_purchase: number | null
  cpc: number | null
  cpm: number | null
  ctr: number | null
  quality_ranking: string | null
  engagement_rate_ranking: string | null
  conversion_rate_ranking: string | null
  impressions: number | null
  hook_rate: number | null
  atc_rate: number | null
  ic_rate: number | null
  purchase_rate: number | null
  bounce_rate: number | null
  created_at: string
  is_error: boolean
  error_detail: {
    errors: RefreshSnapshotMetricError[]
    error_count: number
  } | null
}

export interface SnapshotWithMetrics extends SheetRefreshSnapshot {
  refresh_snapshot_metrics: RefreshSnapshotMetric[]
}

export interface MetricComparison {
  account_name: string
  pod: string | null
  shopify_revenue_change: number | null
  roas_change: number | null
  spend_change: number | null
}
