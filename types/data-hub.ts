// ============================================================================
// Data Hub Types - Enterprise Grade Hub for All Data Visualization
// ============================================================================

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// ============================================================================
// API Sources
// ============================================================================

export interface ApiSource {
  id: string
  provider: string
  endpoint: string
  display_name: string
  description: string | null
  refresh_interval_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// API Snapshots
// ============================================================================

export interface ApiSnapshot {
  id: string
  source_id: string
  client_id: number | null
  snapshot_type: 'scheduled' | 'manual' | 'triggered'
  total_records: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
  started_at: string
  completed_at: string | null
  created_at: string
  // Joined data
  source?: ApiSource
}

// ============================================================================
// API Records
// ============================================================================

export interface ApiRecord {
  id: string
  snapshot_id: string
  client_id: number | null
  external_id: string
  name: string | null
  email: string | null
  status: string | null
  category: string | null
  tags: string[] | null
  amount: number | null
  quantity: number | null
  record_date: string | null
  extra: Record<string, unknown> | null
  created_at: string
}

export interface ApiRecordMetric {
  id: string
  record_id: string
  metric_name: string
  metric_value: number
  metric_unit: string | null
  created_at: string
}

export interface ApiRecordAttribute {
  id: string
  record_id: string
  attribute_name: string
  attribute_value: unknown
  created_at: string
}

// ============================================================================
// Sheet Refresh Snapshots
// ============================================================================

export interface SheetRefreshSnapshot {
  id: string
  sheet_id: number
  refresh_type: 'financialx' | 'autometric'
  refresh_status: 'pending' | 'in_progress' | 'completed' | 'failed'
  date_preset: string | null
  snapshot_date: string
  created_at: string
  updated_at: string
  metadata: Record<string, unknown> | null
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
  error_detail: Record<string, unknown> | null
}

// ============================================================================
// Watchtower
// ============================================================================

export interface WatchtowerRule {
  id: string
  source_id: string | null
  client_id: number | null
  target_table: string | null
  name: string
  description: string | null
  field_name: string
  condition: 'equals' | 'greater_than' | 'less_than' | 'changed' | 'contains'
  threshold_value: string | null
  parent_rule_id: string | null
  dependency_condition: string | null
  logic_operator: 'AND' | 'OR'
  group_id: string | null
  severity: 'info' | 'warning' | 'critical'
  is_active: boolean
  notify_immediately: boolean
  notify_schedule: string | null
  notify_time: string | null
  notify_day_of_week: number | null
  notify_discord: boolean
  notify_email: boolean
  discord_channel_id: string | null
  email_recipients: string[] | null
  last_notified_at: string | null
  created_at: string
  updated_at: string
}

export interface WatchtowerAlert {
  id: string
  rule_id: string
  snapshot_id: string
  record_id: string | null
  client_id: number | null
  message: string
  severity: 'info' | 'warning' | 'critical'
  current_value: string | null
  previous_value: string | null
  is_acknowledged: boolean
  acknowledged_at: string | null
  acknowledged_by: string | null
  created_at: string
  // Joined data
  rule?: WatchtowerRule
}

// ============================================================================
// Form Submissions
// ============================================================================

export type SubmissionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'

export interface FormSubmission {
  id: string
  created_at: string
  updated_at: string
  form_type: string
  brand_name: string
  submitter_identifier: string
  status: SubmissionStatus
  client_id: number | null
  processed_at: string | null
  processed_by: string | null
  internal_notes: string | null
}

export interface DayDropRequestDetail {
  id: string
  submission_id: string
  drop_name: string
  collection_name: string
  drop_date: string
  timezone_and_time: string
  offers: string
  link_to_products: string
  sms_required: boolean
  sms_images: string | null
  sms_style: string | null
  sms_personalisation: string | null
  site_locked: string | null
  additional_notes: string | null
}

export interface WebsiteRevampRequestDetail {
  id: string
  submission_id: string
  media_buyer_name: string
  home_page: string | null
  collection_page: string | null
  product_pages: string | null
  size_chart: string | null
  bundles: string | null
  description: string | null
  reviews: string | null
  policies: string | null
  backend: string | null
  track_order: string | null
  about_us: string | null
  additional_notes: string | null
}

// ============================================================================
// Dashboard Overview Stats
// ============================================================================

export interface DataHubOverview {
  totalSources: number
  activeSources: number
  totalSnapshots: number
  completedSnapshots: number
  failedSnapshots: number
  totalRecords: number
  totalAlerts: number
  unacknowledgedAlerts: number
  criticalAlerts: number
  totalFormSubmissions: number
  pendingSubmissions: number
  totalSheetSnapshots: number
  totalSheetMetrics: number
}

// ============================================================================
// Tab Configuration
// ============================================================================

export type DataHubTab =
  | 'overview'
  | 'cvr'
  | 'sources'
  | 'snapshots'
  | 'records'
  | 'sheet-metrics'
  | 'alerts'
  | 'forms'
