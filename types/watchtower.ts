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

export type RuleCondition = (typeof RULE_CONDITIONS)[number]

export const SEVERITY_LEVELS = ['info', 'warning', 'critical'] as const

/**
 * Target tables mapped to Hub data domains:
 * - facebook_metrics: Autometric sheet data (refresh_snapshot_metrics where refresh_type='autometric')
 * - finance_metrics: FinancialX sheet data (refresh_snapshot_metrics where refresh_type='financialx')
 * - api_records: API-fetched data (Omnisend, Shopify, etc.)
 * - form_submissions: Day Drop & Website Revamp submissions
 * - api_snapshots: API snapshot status and health
 * - sheet_snapshots: Sheet refresh snapshot status
 * - communication_reports: Discord communication audit reports (indexed on report_date)
 */
export const TARGET_TABLES = [
  'facebook_metrics',
  'finance_metrics',
  'api_records',
  'form_submissions',
  'api_snapshots',
  'sheet_snapshots',
  'communication_reports',
] as const

export type TargetTable = (typeof TARGET_TABLES)[number]

/**
 * Conditions allowed for each field type.
 * Prevents invalid comparisons like 'greater_than' on string fields.
 */
export const CONDITIONS_BY_FIELD_TYPE: Record<
  'number' | 'string' | 'boolean' | 'date',
  readonly RuleCondition[]
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
  // Booleans are always true/false - no null checks needed
  boolean: ['equals', 'not_equals', 'changed'],
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

// ============================================================================
// Domain-Specific Conditions - Optimized O(1) Lookup
// ============================================================================

/**
 * Conditions relevant to each data domain (target_table).
 * Pre-computed as arrays for efficient iteration, with Set lookup for O(1) membership.
 *
 * Domain-specific logic:
 * - facebook_metrics: KPI-focused conditions (thresholds, % changes for ROAS, CPA, etc.)
 * - finance_metrics: Financial thresholds & rebill tracking (% changes for rebill metrics)
 * - api_records: Status/category matching, quantity checks (no % change - point-in-time data)
 * - form_submissions: Status matching & date filtering only
 * - api_snapshots: Status & health monitoring
 * - sheet_snapshots: Sync status monitoring
 */
const DOMAIN_CONDITIONS_MAP: Record<TargetTable, readonly RuleCondition[]> = {
  // Facebook/Autometric: Heavy on numeric comparisons & percentage changes
  facebook_metrics: [
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

  // Finance/FinancialX: Numeric thresholds + status tracking + % change for rebill comparisons
  finance_metrics: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'changed',
    'changed_by_percent',
    'contains',
    'is_null',
    'is_not_null',
  ],

  // API Records: Status/category matching, no percentage change tracking (point-in-time)
  api_records: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'contains',
    'not_contains',
    'is_null',
    'is_not_null',
  ],

  // Form Submissions: Status matching & date filtering only
  form_submissions: [
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'greater_than',
    'less_than',
    'is_null',
    'is_not_null',
  ],

  // API Snapshots: Health/status monitoring
  api_snapshots: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'contains',
    'is_null',
    'is_not_null',
  ],

  // Sheet Snapshots: Sync status checks
  sheet_snapshots: [
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'is_null',
    'is_not_null',
  ],

  // Communication Reports: Days tracking, status matching, boolean checks
  communication_reports: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'contains',
    'not_contains',
    'is_null',
    'is_not_null',
  ],
} as const

// Pre-computed Sets for O(1) membership checking (created once at module load)
const DOMAIN_CONDITIONS_SETS: Record<
  TargetTable,
  ReadonlySet<RuleCondition>
> = {
  facebook_metrics: new Set(DOMAIN_CONDITIONS_MAP.facebook_metrics),
  finance_metrics: new Set(DOMAIN_CONDITIONS_MAP.finance_metrics),
  api_records: new Set(DOMAIN_CONDITIONS_MAP.api_records),
  form_submissions: new Set(DOMAIN_CONDITIONS_MAP.form_submissions),
  api_snapshots: new Set(DOMAIN_CONDITIONS_MAP.api_snapshots),
  sheet_snapshots: new Set(DOMAIN_CONDITIONS_MAP.sheet_snapshots),
  communication_reports: new Set(DOMAIN_CONDITIONS_MAP.communication_reports),
}

/**
 * Get valid conditions for a field, constrained by both domain AND field type.
 * Uses Set intersection for O(n) where n = number of field type conditions (small constant).
 *
 * @param domain - The target table/data domain
 * @param fieldType - The field's data type
 * @returns Array of valid conditions for this domain + field type combination
 */
export function getConditionsForDomainAndFieldType(
  domain: TargetTable | undefined,
  fieldType: 'number' | 'string' | 'boolean' | 'date' | undefined,
): RuleCondition[] {
  // No domain selected: use field type conditions only
  if (!domain) {
    return fieldType
      ? [...CONDITIONS_BY_FIELD_TYPE[fieldType]]
      : [...RULE_CONDITIONS]
  }

  const domainConditionsSet = DOMAIN_CONDITIONS_SETS[domain]

  // No field type: use domain conditions only
  if (!fieldType) {
    return [...DOMAIN_CONDITIONS_MAP[domain]]
  }

  // Intersection: conditions valid for BOTH domain AND field type
  const fieldConditions = CONDITIONS_BY_FIELD_TYPE[fieldType]
  return fieldConditions.filter((c) => domainConditionsSet.has(c))
}

/**
 * Human-readable labels for conditions
 */
export const CONDITION_LABELS: Record<RuleCondition, string> = {
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

export type Severity = (typeof SEVERITY_LEVELS)[number]
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
  notify_whatsapp: boolean
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
  notify_whatsapp?: boolean
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
  notify_whatsapp?: boolean
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
 *
 * Facebook Sheet columns: Name, Pod, Monitored, CPA, CPC, CPM, CTR, Quality Ranking,
 *   ERR (engagement_rate_ranking), CRR (conversion_rate_ranking), Ad Spend, ROAS,
 *   FB REV, Hook Rate, Bounce Rate, LC/ATC%, ATC/IC%, IC/PUR%
 *   Note: Most numeric fields come as strings from FB API and need parseFloat
 *   Rankings are enum strings: ABOVE_AVERAGE, AVERAGE, BELOW_AVERAGE
 *
 * Finance Sheet columns: Monitored, Name, Pod, Ad Spend {Timeframe}, ROAS TD, FB Rev {Timeframe},
 *   Shopify Rev {Timeframe}, Ad spend since rebill, ROAS since rebill, FB Rev Rebill,
 *   Shopify Rev Rebill, Is Rebillable, Last Rebill Date, Orders {Timeframe}, Orders since rebill
 *   Note: Is Rebillable values: "rebillable next date", "soon to be", "overdue", "N/A", "not rebillable"
 */
export const TABLE_FIELDS: TableFieldConfig[] = [
  {
    table: 'facebook_metrics',
    fields: [
      // Identity & Status
      {
        name: 'name',
        label: 'Account Name',
        type: 'string',
        description: 'Account/client name',
      },
      {
        name: 'pod',
        label: 'Pod',
        type: 'string',
        description: 'Assigned pod name',
      },
      {
        name: 'is_monitored',
        label: 'Monitored',
        type: 'boolean',
        description: 'Account is being monitored',
      },
      // Cost Metrics (parsed from FB API string values)
      {
        name: 'cpa',
        label: 'CPA',
        type: 'number',
        description: 'Cost per acquisition (purchase)',
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
      // Rankings (FB API enum: ABOVE_AVERAGE, AVERAGE, BELOW_AVERAGE)
      {
        name: 'quality_ranking',
        label: 'Quality Ranking',
        type: 'string',
        description:
          'Ad quality ranking (ABOVE_AVERAGE, AVERAGE, BELOW_AVERAGE)',
      },
      {
        name: 'engagement_rate_ranking',
        label: 'ERR (Engagement Rate Ranking)',
        type: 'string',
        description:
          'Engagement rate ranking (ABOVE_AVERAGE, AVERAGE, BELOW_AVERAGE)',
      },
      {
        name: 'conversion_rate_ranking',
        label: 'CRR (Conversion Rate Ranking)',
        type: 'string',
        description:
          'Conversion rate ranking (ABOVE_AVERAGE, AVERAGE, BELOW_AVERAGE)',
      },
      // Revenue Metrics
      {
        name: 'ad_spend',
        label: 'Ad Spend',
        type: 'number',
        description: 'Total ad spend',
      },
      {
        name: 'roas',
        label: 'ROAS',
        type: 'number',
        description: 'Return on ad spend (purchase_roas)',
      },
      {
        name: 'fb_revenue',
        label: 'FB REV',
        type: 'number',
        description: 'Facebook-attributed revenue',
      },
      // Video & Site Metrics
      {
        name: 'hook_rate',
        label: 'Hook Rate',
        type: 'number',
        description: 'Video hook rate percentage',
      },
      {
        name: 'bounce_rate',
        label: 'Bounce Rate',
        type: 'number',
        description: 'Site bounce rate percentage',
      },
      // Funnel Metrics
      {
        name: 'lc_atc_percent',
        label: 'LC/ATC%',
        type: 'number',
        description: 'Landing to Add-to-Cart conversion rate',
      },
      {
        name: 'atc_ic_percent',
        label: 'ATC/IC%',
        type: 'number',
        description: 'Add-to-Cart to Initiate Checkout rate',
      },
      {
        name: 'ic_pur_percent',
        label: 'IC/PUR%',
        type: 'number',
        description: 'Initiate Checkout to Purchase rate',
      },
    ],
  },
  {
    table: 'finance_metrics',
    fields: [
      // Identity & Status
      {
        name: 'name',
        label: 'Account Name',
        type: 'string',
        description: 'Account/client name',
      },
      {
        name: 'pod',
        label: 'Pod',
        type: 'string',
        description: 'Assigned pod name',
      },
      {
        name: 'is_monitored',
        label: 'Monitored',
        type: 'boolean',
        description: 'Account is being monitored',
      },
      // Timeframe Metrics (current period)
      {
        name: 'ad_spend_timeframe',
        label: 'Ad Spend (Timeframe)',
        type: 'number',
        description: 'Ad spend for selected timeframe',
      },
      {
        name: 'roas_td',
        label: 'ROAS TD',
        type: 'number',
        description: 'Return on ad spend to-date',
      },
      {
        name: 'fb_revenue_timeframe',
        label: 'FB Rev (Timeframe)',
        type: 'number',
        description: 'Facebook revenue for timeframe',
      },
      {
        name: 'shopify_revenue_timeframe',
        label: 'Shopify Rev (Timeframe)',
        type: 'number',
        description: 'Shopify revenue for timeframe',
      },
      {
        name: 'orders_timeframe',
        label: 'Orders (Timeframe)',
        type: 'number',
        description: 'Order count for selected timeframe',
      },
      // Rebill Metrics (since last rebill)
      {
        name: 'ad_spend_rebill',
        label: 'Ad Spend Since Rebill',
        type: 'number',
        description: 'Ad spend since last rebill date',
      },
      {
        name: 'roas_rebill',
        label: 'ROAS Since Rebill',
        type: 'number',
        description: 'Return on ad spend since rebill',
      },
      {
        name: 'fb_revenue_rebill',
        label: 'FB Rev Rebill',
        type: 'number',
        description: 'Facebook revenue since rebill',
      },
      {
        name: 'shopify_revenue_rebill',
        label: 'Shopify Rev Rebill',
        type: 'number',
        description: 'Shopify revenue since rebill',
      },
      {
        name: 'orders_rebill',
        label: 'Orders Since Rebill',
        type: 'number',
        description: 'Order count since last rebill',
      },
      // Rebill Status
      {
        name: 'rebillable_status',
        label: 'Is Rebillable',
        type: 'string',
        description:
          'Rebill status: "rebillable next date", "soon to be", "overdue", "N/A", "not rebillable"',
      },
      {
        name: 'last_rebill_date',
        label: 'Last Rebill Date',
        type: 'date',
        description: 'Date of last rebill',
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
  {
    table: 'communication_reports',
    fields: [
      // Identity & Context (indexed for efficient lookups)
      {
        name: 'channel_name',
        label: 'Channel Name',
        type: 'string',
        description: 'Discord channel name',
      },
      {
        name: 'guild_name',
        label: 'Server Name',
        type: 'string',
        description: 'Discord server/guild name',
      },
      {
        name: 'pod',
        label: 'Pod',
        type: 'string',
        description: 'Assigned pod name',
      },
      {
        name: 'category_name',
        label: 'Category',
        type: 'string',
        description: 'Discord channel category',
      },
      {
        name: 'status',
        label: 'Communication Status',
        type: 'string',
        description: 'Current communication status',
      },
      // Days Tracking (primary alert triggers - indexed for queries)
      {
        name: 'days_since_client_message',
        label: 'Days Since Client Message',
        type: 'number',
        description: 'Days since last client message (alerts on > 5)',
      },
      {
        name: 'days_since_team_message',
        label: 'Days Since Team Message',
        type: 'number',
        description: 'Days since last team/IXM message (alerts on > 2)',
      },
      {
        name: 'days_since_ixm_message',
        label: 'Days Since IXM Message',
        type: 'number',
        description: 'Days since last IXM team member message',
      },
      // Date Fields (indexed for time-range queries)
      {
        name: 'report_date',
        label: 'Report Date',
        type: 'date',
        description: 'Date of the communication report',
      },
      {
        name: 'last_client_message_at',
        label: 'Last Client Message',
        type: 'date',
        description: 'Timestamp of last client message',
      },
      {
        name: 'last_team_message_at',
        label: 'Last Team Message',
        type: 'date',
        description: 'Timestamp of last team message',
      },
      // Boolean Flags (partial indexes exist for efficient filtering)
      {
        name: 'last_client_is_former_member',
        label: 'Client Is Former Member',
        type: 'boolean',
        description: 'Last client message was from a former member',
      },
      {
        name: 'last_team_is_former_member',
        label: 'Team Is Former Member',
        type: 'boolean',
        description: 'Last team message was from a former member',
      },
      // User Context
      {
        name: 'last_client_username',
        label: 'Last Client Username',
        type: 'string',
        description: 'Username of last client who messaged',
      },
      {
        name: 'last_team_username',
        label: 'Last Team Username',
        type: 'string',
        description: 'Username of last team member who messaged',
      },
      {
        name: 'status_notes',
        label: 'Status Notes',
        type: 'string',
        description: 'Additional status notes',
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
