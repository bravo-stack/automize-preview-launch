// ============================================================================
// API Response Storage Types - Enterprise Grade
// ============================================================================

export type SnapshotStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type SnapshotType = 'scheduled' | 'manual' | 'triggered'
export type RuleCondition =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'changed'
  | 'changed_by_percent'
  | 'contains'
  | 'not_contains'
  | 'is_null'
  | 'is_not_null'
export type Severity = 'info' | 'warning' | 'critical'
export type MetricUnit = 'percent' | 'currency' | 'count'

// ============================================================================
// Core Tables
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

export interface ApiSnapshot {
  id: string
  source_id: string
  client_id: number | null // NEW: Per-client snapshots
  snapshot_type: SnapshotType
  total_records: number
  status: SnapshotStatus
  error_message: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface ApiRecord {
  id: string
  snapshot_id: string
  client_id: number | null // NEW: Per-client records
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

// ============================================================================
// M2M Metrics Table - Enterprise Grade Named Metrics
// ============================================================================

export interface ApiRecordMetric {
  id: string
  record_id: string
  metric_name: string
  metric_value: number
  metric_unit: MetricUnit | null
  created_at: string
}

// ============================================================================
// M2M Attributes Table - For Non-Numeric Data
// ============================================================================

export interface ApiRecordAttribute {
  id: string
  record_id: string
  attribute_name: string
  attribute_value: unknown // JSONB - can be string, array, object
  created_at: string
}

export interface MetricDefinition {
  metric_name: string
  display_name: string
  description: string | null
  metric_unit: MetricUnit | null
  min_value: number | null
  max_value: number | null
  provider: string | null
  created_at: string
}

// ============================================================================
// Watch Tower Tables
// ============================================================================

export type LogicOperator = 'AND' | 'OR'
export type DependencyCondition = 'triggered' | 'not_triggered' | 'acknowledged'
export type NotifySchedule = 'daily' | 'weekly'

// Time range presets for UI convenience (days to look back)
// These are just common presets - users can enter any positive integer
export const TIME_RANGE_PRESETS = [
  { label: 'Today', value: 0 },
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'All time', value: null },
] as const

/**
 * Target tables mapped to Hub data domains:
 * - facebook_metrics: Autometric sheet data (maps to refresh_snapshot_metrics where refresh_type='autometric')
 * - finance_metrics: FinancialX sheet data (maps to refresh_snapshot_metrics where refresh_type='financialx')
 * - api_records: API-fetched data (Omnisend, Shopify, etc.)
 * - form_submissions: Day Drop & Website Revamp submissions
 * - api_snapshots: API snapshot status and health
 * - sheet_snapshots: Sheet refresh snapshot status (maps to sheet_refresh_snapshots)
 */
export type TargetTable =
  | 'facebook_metrics'
  | 'finance_metrics'
  | 'api_records'
  | 'form_submissions'
  | 'api_snapshots'
  | 'sheet_snapshots'

export interface WatchtowerRule {
  id: string
  source_id: string | null
  client_id: number | null
  target_table: TargetTable | null
  name: string
  description: string | null
  field_name: string
  condition: RuleCondition
  threshold_value: string | null
  // Time range for data filtering (number of days to look back, null = all time)
  time_range_days: number | null
  severity: Severity
  is_active: boolean
  // Rule dependencies (self-referential)
  parent_rule_id: string | null
  dependency_condition: DependencyCondition | null
  // Compound rules
  logic_operator: LogicOperator
  group_id: string | null
  // Notification settings (embedded, no separate table)
  notify_immediately: boolean
  notify_schedule: NotifySchedule | null
  notify_time: string | null
  notify_day_of_week: number | null
  notify_discord: boolean
  discord_channel_id: string | null
  pod_id: string | null
  last_notified_at: string | null
  // Trigger tracking
  last_triggered_at: string | null
  trigger_count: number
  // Timestamps
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
  severity: Severity
  current_value: string | null
  previous_value: string | null
  is_acknowledged: boolean
  acknowledged_at: string | null
  acknowledged_by: string | null
  created_at: string
}

// ============================================================================
// Extended Types with Relationships
// ============================================================================

export interface ApiSnapshotWithSource extends ApiSnapshot {
  source: ApiSource
}

export interface ApiRecordWithMetrics extends ApiRecord {
  metrics: ApiRecordMetric[]
  attributes?: ApiRecordAttribute[]
}

export interface WatchtowerAlertWithRule extends WatchtowerAlert {
  rule: WatchtowerRule
}

// Rule with child rules (for compound rules)
export interface WatchtowerRuleWithChildren extends WatchtowerRule {
  child_rules: WatchtowerRule[]
  parent_rule: WatchtowerRule | null
}

// ============================================================================
// Input Types for Creating Records
// ============================================================================

export interface RecordInput {
  external_id: string
  name?: string
  email?: string
  status?: string
  category?: string
  tags?: string[]
  amount?: number
  quantity?: number
  record_date?: string
  extra?: Record<string, unknown>
}

export interface MetricInput {
  metric_name: string
  metric_value: number
  metric_unit?: MetricUnit
}

export interface AttributeInput {
  attribute_name: string
  attribute_value: unknown // string, array, object, etc.
}

export interface RecordWithMetricsInput extends RecordInput {
  metrics?: MetricInput[]
  attributes?: AttributeInput[]
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface SnapshotQueryParams {
  source_id?: string
  client_id?: number
  provider?: string
  start_date?: string
  end_date?: string
  status?: SnapshotStatus
}

export interface RecordQueryParams {
  snapshot_id?: string
  client_id?: number
  source_id?: string
  status?: string
  category?: string
  start_date?: string
  end_date?: string
  min_amount?: number
  max_amount?: number
}

export interface MetricQueryParams {
  record_id?: string
  metric_name?: string
  min_value?: number
  max_value?: number
}

// ============================================================================
// Comparison & Analysis Types
// ============================================================================

export interface ComparisonResult {
  field: string
  base_value: number
  compare_value: number
  change_absolute: number
  change_percent: number
}

export interface MetricComparison {
  metric_name: string
  base_value: number
  compare_value: number
  change_absolute: number
  change_percent: number
}

export interface SnapshotComparison {
  base_snapshot_id: string
  compare_snapshot_id: string
  record_comparisons: ComparisonResult[]
  metric_comparisons: MetricComparison[]
}

// ============================================================================
// Aggregation Types
// ============================================================================

export interface MetricAggregation {
  metric_name: string
  count: number
  sum: number
  avg: number
  min: number
  max: number
}

export interface SnapshotAggregation {
  snapshot_id: string
  snapshot_date: string
  total_records: number
  metrics: MetricAggregation[]
}
