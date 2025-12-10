// ============================================================================
// Watchtower Types - Enterprise Grade Rule Engine
// ============================================================================

// ============================================================================
// Core Enums & Constants
// ============================================================================

export const RULE_CONDITIONS = [
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'changed',
  'changed_by_percent',
  'contains',
  'not_contains',
  'is_null',
  'is_not_null',
] as const

/**
 * Conditions allowed for each field type.
 * Prevents invalid comparisons like 'greater_than' on string fields.
 */
export const CONDITIONS_BY_FIELD_TYPE: Record<
  'number' | 'string' | 'boolean' | 'date',
  readonly (typeof RULE_CONDITIONS)[number][]
> = {
  number: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'changed',
    'changed_by_percent',
    'is_null',
    'is_not_null',
  ],
  string: [
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'changed',
    'is_null',
    'is_not_null',
  ],
  boolean: ['equals', 'not_equals', 'changed', 'is_null', 'is_not_null'],
  date: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'changed',
    'is_null',
    'is_not_null',
  ],
} as const

/**
 * Human-readable labels for conditions
 */
export const CONDITION_LABELS: Record<
  (typeof RULE_CONDITIONS)[number],
  string
> = {
  equals: 'Equals',
  not_equals: 'Not Equals',
  greater_than: 'Greater Than',
  less_than: 'Less Than',
  greater_than_or_equal: 'At Least (≥)',
  less_than_or_equal: 'At Most (≤)',
  changed: 'Has Changed',
  changed_by_percent: 'Changed By %',
  contains: 'Contains',
  not_contains: 'Does Not Contain',
  is_null: 'Is Empty',
  is_not_null: 'Is Not Empty',
}

export const SEVERITY_LEVELS = ['info', 'warning', 'critical'] as const

/**
 * Target tables mapped to Hub data domains:
 * - facebook_metrics: Autometric sheet data (refresh_snapshot_metrics where refresh_type='autometric')
 * - finance_metrics: FinancialX sheet data (refresh_snapshot_metrics where refresh_type='financialx')
 * - api_records: API-fetched data (Omnisend, Shopify, etc.)
 * - form_submissions: Day Drop & Website Revamp submissions
 * - api_snapshots: API snapshot status and health
 * - sheet_snapshots: Sheet refresh snapshot status
 */
export const TARGET_TABLES = [
  'facebook_metrics',
  'finance_metrics',
  'api_records',
  'form_submissions',
  'api_snapshots',
  'sheet_snapshots',
] as const

export const LOGIC_OPERATORS = ['AND', 'OR'] as const

export const DEPENDENCY_CONDITIONS = [
  'triggered',
  'not_triggered',
  'acknowledged',
] as const

export const NOTIFY_SCHEDULES = ['daily', 'weekly'] as const

/**
 * Common time range presets for quick selection in the UI
 * The value represents the number of days to look back
 * null = all time (no filter)
 * 0 = today only
 */
export const TIME_RANGE_PRESETS = [
  { label: 'Today', value: 0 },
  { label: 'Last 3 Days', value: 3 },
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 14 Days', value: 14 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 60 Days', value: 60 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'Last 6 Months', value: 180 },
  { label: 'Last Year', value: 365 },
  { label: 'All Time', value: null },
] as const

/**
 * Get a human-readable label for a time range in days
 */
export function getTimeRangeDaysLabel(days: number | null): string {
  if (days === null) return 'All Time'
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `Last ${days} Days`
  if (days === 7) return 'Last Week'
  if (days === 14) return 'Last 2 Weeks'
  if (days === 30) return 'Last Month'
  if (days === 60) return 'Last 2 Months'
  if (days === 90) return 'Last 3 Months'
  if (days === 180) return 'Last 6 Months'
  if (days === 365) return 'Last Year'
  return `Last ${days} Days`
}

export type RuleCondition = (typeof RULE_CONDITIONS)[number]
export type Severity = (typeof SEVERITY_LEVELS)[number]
export type TargetTable = (typeof TARGET_TABLES)[number]
export type LogicOperator = (typeof LOGIC_OPERATORS)[number]
export type DependencyCondition = (typeof DEPENDENCY_CONDITIONS)[number]
export type NotifySchedule = (typeof NOTIFY_SCHEDULES)[number]

// ============================================================================
// Core Watchtower Rule Interface
// ============================================================================

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
  // Rule dependencies (self-referential)
  parent_rule_id: string | null
  dependency_condition: DependencyCondition | null
  // Compound rules
  logic_operator: LogicOperator
  group_id: string | null
  severity: Severity
  is_active: boolean
  // Notification settings
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

// ============================================================================
// Watchtower Alert Interface
// ============================================================================

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

export interface WatchtowerRuleWithSource extends WatchtowerRule {
  source?: {
    id: string
    provider: string
    display_name: string
  } | null
}

export interface WatchtowerRuleWithRelations extends WatchtowerRule {
  source?: {
    id: string
    provider: string
    display_name: string
  } | null
  parent_rule?: WatchtowerRule | null
  child_rules?: WatchtowerRule[]
  group_rules?: WatchtowerRule[] // Rules in the same group
}

export interface WatchtowerAlertWithRelations extends WatchtowerAlert {
  rule?: WatchtowerRuleWithSource
  snapshot?: {
    id: string
    snapshot_type: string
    status: string
    created_at: string
    source?: {
      id: string
      display_name: string
    }
  }
  record?: {
    id: string
    external_id: string
    name: string | null
    category: string | null
  }
}

// ============================================================================
// Rule Group - For Compound Rules with Multiple Clauses
// ============================================================================

export interface RuleGroup {
  group_id: string
  name: string
  description: string | null
  logic_operator: LogicOperator
  rules: WatchtowerRule[]
}

// ============================================================================
// Input Types for Creating/Updating Rules
// ============================================================================

export interface CreateRuleInput {
  source_id?: string | null
  client_id?: number | null
  target_table?: TargetTable | null
  name: string
  description?: string | null
  field_name: string
  condition: RuleCondition
  threshold_value?: string | null
  // Time range (number of days to look back, null = all time, 0 = today)
  time_range_days?: number | null
  parent_rule_id?: string | null
  dependency_condition?: DependencyCondition | null
  logic_operator?: LogicOperator
  group_id?: string | null
  severity?: Severity
  is_active?: boolean
  notify_immediately?: boolean
  notify_schedule?: NotifySchedule | null
  notify_time?: string | null
  notify_day_of_week?: number | null
  notify_discord?: boolean
  discord_channel_id?: string | null
  pod_id?: string | null
}

export interface UpdateRuleInput extends Partial<CreateRuleInput> {
  id: string
}

// ============================================================================
// Input Types for Creating Alerts
// ============================================================================

export interface CreateAlertInput {
  rule_id: string
  snapshot_id: string
  record_id?: string | null
  client_id?: number | null
  message: string
  severity: Severity
  current_value?: string | null
  previous_value?: string | null
}

// ============================================================================
// Compound Rule Builder Types
// ============================================================================

export interface RuleClause {
  id: string // Temporary ID for UI
  field_name: string
  condition: RuleCondition
  threshold_value: string | null
}

export interface CompoundRuleInput {
  name: string
  description?: string | null
  source_id?: string | null
  client_id?: number | null
  target_table?: TargetTable | null
  // Time range (number of days to look back, null = all time, 0 = today)
  time_range_days?: number | null
  clauses: RuleClause[]
  logic_operator: LogicOperator
  severity?: Severity
  is_active?: boolean
  // Notification settings
  notify_immediately?: boolean
  notify_schedule?: NotifySchedule | null
  notify_time?: string | null
  notify_day_of_week?: number | null
  notify_discord?: boolean
  discord_channel_id?: string | null
  pod_id?: string | null
  // Dependencies
  parent_rule_id?: string | null
  dependency_condition?: DependencyCondition | null
}

// ============================================================================
// Rule Evaluation Types
// ============================================================================

export interface RuleEvaluationContext {
  rule: WatchtowerRule
  currentValue: unknown
  previousValue?: unknown
  record?: Record<string, unknown>
  snapshot_id: string
  client_id?: number | null
}

export interface RuleEvaluationResult {
  rule_id: string
  triggered: boolean
  message: string
  current_value: string
  previous_value?: string
  severity: Severity
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface RuleQueryParams {
  source_id?: string
  client_id?: number
  target_table?: TargetTable
  is_active?: boolean
  severity?: Severity
  group_id?: string
  page?: number
  pageSize?: number
}

export interface AlertQueryParams {
  rule_id?: string
  snapshot_id?: string
  client_id?: number
  severity?: Severity
  is_acknowledged?: boolean
  start_date?: string
  end_date?: string
  page?: number
  pageSize?: number
}

// ============================================================================
// Available Fields Configuration
// ============================================================================

export interface FieldDefinition {
  name: string
  label: string
  type: 'number' | 'string' | 'boolean' | 'date'
  description?: string
}

export interface TableFieldConfig {
  table: TargetTable
  fields: FieldDefinition[]
}

/**
 * Pre-defined fields for each target table, organized by Hub data domain
 * These map directly to the actual database columns used in each domain
 */
export const TABLE_FIELDS: TableFieldConfig[] = [
  {
    table: 'facebook_metrics',
    fields: [
      {
        name: 'ad_spend_timeframe',
        label: 'Ad Spend (Timeframe)',
        type: 'number',
        description: 'Current period ad spend',
      },
      {
        name: 'roas_timeframe',
        label: 'ROAS (Timeframe)',
        type: 'number',
        description: 'Return on ad spend for current period',
      },
      {
        name: 'fb_revenue_timeframe',
        label: 'FB Revenue (Timeframe)',
        type: 'number',
        description: 'Facebook-attributed revenue',
      },
      {
        name: 'shopify_revenue_timeframe',
        label: 'Shopify Revenue (Timeframe)',
        type: 'number',
        description: 'Shopify revenue for period',
      },
      {
        name: 'orders_timeframe',
        label: 'Orders (Timeframe)',
        type: 'number',
        description: 'Order count for period',
      },
      {
        name: 'cpa_purchase',
        label: 'CPA Purchase',
        type: 'number',
        description: 'Cost per acquisition',
      },
      {
        name: 'cpc',
        label: 'CPC',
        type: 'number',
        description: 'Cost per click',
      },
      {
        name: 'cpm',
        label: 'CPM',
        type: 'number',
        description: 'Cost per mille (1000 impressions)',
      },
      {
        name: 'ctr',
        label: 'CTR',
        type: 'number',
        description: 'Click-through rate',
      },
      {
        name: 'hook_rate',
        label: 'Hook Rate',
        type: 'number',
        description: 'Video hook rate',
      },
      {
        name: 'bounce_rate',
        label: 'Bounce Rate',
        type: 'number',
        description: 'Site bounce rate',
      },
      {
        name: 'is_error',
        label: 'Has Error',
        type: 'boolean',
        description: 'Account has sync error',
      },
      {
        name: 'is_monitored',
        label: 'Is Monitored',
        type: 'boolean',
        description: 'Account is being monitored',
      },
    ],
  },
  {
    table: 'finance_metrics',
    fields: [
      {
        name: 'ad_spend_rebill',
        label: 'Ad Spend (Rebill)',
        type: 'number',
        description: 'Rebill period ad spend',
      },
      {
        name: 'roas_rebill',
        label: 'ROAS (Rebill)',
        type: 'number',
        description: 'Return on ad spend for rebill period',
      },
      {
        name: 'fb_revenue_rebill',
        label: 'FB Revenue (Rebill)',
        type: 'number',
        description: 'Facebook revenue for rebill',
      },
      {
        name: 'shopify_revenue_rebill',
        label: 'Shopify Revenue (Rebill)',
        type: 'number',
        description: 'Shopify revenue for rebill',
      },
      {
        name: 'orders_rebill',
        label: 'Orders (Rebill)',
        type: 'number',
        description: 'Order count for rebill period',
      },
      {
        name: 'rebill_status',
        label: 'Rebill Status',
        type: 'string',
        description: 'Current rebill status',
      },
      {
        name: 'last_rebill_date',
        label: 'Last Rebill Date',
        type: 'date',
        description: 'Date of last rebill',
      },
      {
        name: 'is_error',
        label: 'Has Error',
        type: 'boolean',
        description: 'Account has sync error',
      },
    ],
  },
  {
    table: 'api_records',
    fields: [
      {
        name: 'status',
        label: 'Status',
        type: 'string',
        description: 'Record status',
      },
      {
        name: 'category',
        label: 'Category',
        type: 'string',
        description: 'Record category',
      },
      {
        name: 'amount',
        label: 'Amount',
        type: 'number',
        description: 'Monetary amount',
      },
      {
        name: 'quantity',
        label: 'Quantity',
        type: 'number',
        description: 'Item quantity',
      },
      {
        name: 'record_date',
        label: 'Record Date',
        type: 'date',
        description: 'Date of the record',
      },
    ],
  },
  {
    table: 'form_submissions',
    fields: [
      {
        name: 'status',
        label: 'Submission Status',
        type: 'string',
        description: 'pending, processing, completed, cancelled',
      },
      {
        name: 'form_type',
        label: 'Form Type',
        type: 'string',
        description: 'day_drop_request or website_revamp',
      },
      {
        name: 'created_at',
        label: 'Submitted At',
        type: 'date',
        description: 'Submission timestamp',
      },
      {
        name: 'processed_at',
        label: 'Processed At',
        type: 'date',
        description: 'Processing timestamp',
      },
    ],
  },
  {
    table: 'api_snapshots',
    fields: [
      {
        name: 'status',
        label: 'Snapshot Status',
        type: 'string',
        description: 'pending, processing, completed, failed',
      },
      {
        name: 'total_records',
        label: 'Total Records',
        type: 'number',
        description: 'Records fetched in snapshot',
      },
      {
        name: 'snapshot_type',
        label: 'Snapshot Type',
        type: 'string',
        description: 'scheduled, manual, triggered',
      },
      {
        name: 'error_message',
        label: 'Error Message',
        type: 'string',
        description: 'Error details if failed',
      },
    ],
  },
  {
    table: 'sheet_snapshots',
    fields: [
      {
        name: 'refresh_status',
        label: 'Refresh Status',
        type: 'string',
        description: 'pending, in_progress, completed, failed',
      },
      {
        name: 'refresh_type',
        label: 'Refresh Type',
        type: 'string',
        description: 'autometric or financialx',
      },
      {
        name: 'date_preset',
        label: 'Date Preset',
        type: 'string',
        description: 'Timeframe preset used',
      },
      {
        name: 'snapshot_date',
        label: 'Snapshot Date',
        type: 'date',
        description: 'Date of the snapshot',
      },
    ],
  },
]

// ============================================================================
// Dashboard Stats
// ============================================================================

export interface WatchtowerStats {
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
