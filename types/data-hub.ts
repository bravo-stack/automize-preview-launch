// ============================================================================
// Data Hub Types - Enterprise Grade Hub for All Data Visualization
// ============================================================================

// ============================================================================
// Hub Category Types - Organized by Data Domain
// ============================================================================

/**
 * Hub Categories:
 * - overview: Dashboard overview with stats from all domains
 * - facebook: Autometric sheet data (refresh_snapshot_metrics where refresh_type='autometric')
 * - finance: FinancialX sheet data (refresh_snapshot_metrics where refresh_type='financialx')
 * - api-data: All API-fetched data (Omnisend, Shopify, Themes, etc.)
 * - forms: Form submissions (Day Drop, Website Revamp)
 * - cvr: CVR metrics (Coming Soon - real data not yet stored)
 */
export type HubCategory =
  | 'overview'
  | 'facebook'
  | 'finance'
  | 'api-data'
  | 'forms'
  | 'cvr'

/**
 * Sub-tabs within API Data category
 */
export type ApiDataSubTab = 'sources' | 'snapshots' | 'records' | 'alerts'

/**
 * Sub-tabs within Forms category
 */
export type FormsSubTab = 'all' | 'day-drop' | 'website-revamp'

/**
 * Sheet types corresponding to database refresh_type enum
 */
export type SheetRefreshType = 'autometric' | 'financialx'

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
// API Sources (api_sources table)
// Where API data is coming from - Omnisend, Shopify, Themes, etc.
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
// API Snapshots (api_snapshots table)
// Each fetch/sync operation from an API source
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
// API Records (api_records table)
// Individual records from each API fetch
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
  // Joined data
  snapshot?: ApiSnapshot
  metrics?: ApiRecordMetric[]
  attributes?: ApiRecordAttribute[]
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
// Sheet Refresh Snapshots (sheet_refresh_snapshots table)
// Snapshots of Google Sheet data refreshes
// - autometric = Facebook Ads data
// - financialx = Finance/Accounting data
// ============================================================================

export interface Sheet {
  id: number
  user_id: string | null
  sheet_id: string | null
  refresh: string | null
  title: string | null
  last_refresh: string | null
  pod: string | null
  is_finance: boolean
}

export interface SheetRefreshSnapshot {
  id: string
  sheet_id: number
  refresh_type: SheetRefreshType
  refresh_status: 'pending' | 'in_progress' | 'completed' | 'failed'
  date_preset: string | null
  snapshot_date: string
  created_at: string
  updated_at: string
  metadata: Record<string, unknown> | null
  // Joined data
  sheet?: Sheet
}

// ============================================================================
// Refresh Snapshot Metrics (refresh_snapshot_metrics table)
// Individual account/row data from each sheet refresh
// This is the primary data table for Facebook and Finance views
// ============================================================================

export interface RefreshSnapshotMetric {
  id: string
  snapshot_id: string
  account_name: string
  pod: string | null
  is_monitored: boolean
  // Timeframe metrics (current period)
  ad_spend_timeframe: number | null
  roas_timeframe: number | null
  fb_revenue_timeframe: number | null
  shopify_revenue_timeframe: number | null
  orders_timeframe: number | null
  // Rebill metrics (rebill period)
  ad_spend_rebill: number | null
  roas_rebill: number | null
  fb_revenue_rebill: number | null
  shopify_revenue_rebill: number | null
  orders_rebill: number | null
  rebill_status: string | null
  last_rebill_date: string | null
  // Performance metrics
  cpa_purchase: number | null
  cpc: number | null
  cpm: number | null
  ctr: number | null
  // Ranking metrics
  quality_ranking: string | null
  engagement_rate_ranking: string | null
  conversion_rate_ranking: string | null
  // Engagement metrics
  impressions: number | null
  hook_rate: number | null
  atc_rate: number | null
  ic_rate: number | null
  purchase_rate: number | null
  bounce_rate: number | null
  // Metadata
  created_at: string
  is_error: boolean
  error_detail: Record<string, unknown> | null
  // Joined data
  snapshot?: SheetRefreshSnapshot
}

// ============================================================================
// Facebook (Autometric) specific aggregates
// ============================================================================

export interface FacebookMetricsAggregates {
  totalAccounts: number
  totalAdSpend: number
  avgRoas: number
  totalOrders: number
  totalFbRevenue: number
  totalShopifyRevenue: number
  accountsWithErrors: number
}

// ============================================================================
// Finance (FinancialX) specific aggregates
// ============================================================================

export interface FinanceMetricsAggregates {
  totalAccounts: number
  totalRebillSpend: number
  avgRebillRoas: number
  totalRebillOrders: number
  accountsInRebill: number
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
  notify_whatsapp: boolean
  notify_email: boolean
  discord_channel_id: string | null
  email_recipients: string[] | null
  last_notified_at: string | null
  // Soft delete fields
  deleted_at: string | null
  deleted_by: string | null
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
// Form Submission with Details (joined views)
// ============================================================================

export interface DayDropRequest extends FormSubmission {
  discord_username: string
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

export interface WebsiteRevampRequest extends FormSubmission {
  email: string
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
// Dashboard Overview Stats - Enhanced with category breakdown
// ============================================================================

export interface DataHubOverview {
  // API Data Stats
  totalSources: number
  activeSources: number
  totalApiSnapshots: number
  completedApiSnapshots: number
  failedApiSnapshots: number
  totalApiRecords: number
  // Sheet Data Stats (Facebook + Finance)
  totalSheetSnapshots: number
  completedSheetSnapshots: number
  totalSheetMetrics: number
  // Facebook (Autometric) Stats
  facebookSnapshots: number
  facebookMetrics: number
  // Finance (FinancialX) Stats
  financeSnapshots: number
  financeMetrics: number
  // Watchtower Stats
  totalAlerts: number
  unacknowledgedAlerts: number
  criticalAlerts: number
  // Form Stats
  totalFormSubmissions: number
  pendingSubmissions: number
  dayDropRequests: number
  websiteRevampRequests: number
}

// ============================================================================
// Category-specific Stats
// ============================================================================

export interface FacebookCategoryStats {
  totalSnapshots: number
  completedSnapshots: number
  totalMetrics: number
  latestSnapshotDate: string | null
  uniquePods: string[]
  accountsWithErrors: number
}

export interface FinanceCategoryStats {
  totalSnapshots: number
  completedSnapshots: number
  totalMetrics: number
  latestSnapshotDate: string | null
  accountsInRebill: number
}

export interface ApiDataCategoryStats {
  totalSources: number
  activeSources: number
  sourcesByProvider: Record<string, number>
  totalSnapshots: number
  totalRecords: number
  latestSnapshotDate: string | null
}

export interface FormsCategoryStats {
  total: number
  pending: number
  processing: number
  completed: number
  cancelled: number
  dayDropCount: number
  websiteRevampCount: number
}

// ============================================================================
// Legacy Tab Configuration (kept for backwards compatibility)
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
