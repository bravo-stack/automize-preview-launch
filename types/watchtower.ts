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

export const SEVERITY_LEVELS = ['info', 'warning', 'critical'] as const

export const TARGET_TABLES = [
  'api_records',
  'communication_reports',
  'clients',
  'refresh_snapshot_metrics',
] as const

export const LOGIC_OPERATORS = ['AND', 'OR'] as const

export const DEPENDENCY_CONDITIONS = [
  'triggered',
  'not_triggered',
  'acknowledged',
] as const

export const NOTIFY_SCHEDULES = ['daily', 'weekly'] as const

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
  notify_email: boolean
  discord_channel_id: string | null
  email_recipients: string[] | null
  last_notified_at: string | null
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
  notify_email?: boolean
  discord_channel_id?: string | null
  email_recipients?: string[] | null
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
  notify_email?: boolean
  discord_channel_id?: string | null
  email_recipients?: string[] | null
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

// Pre-defined fields for each target table
export const TABLE_FIELDS: TableFieldConfig[] = [
  {
    table: 'api_records',
    fields: [
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'category', label: 'Category', type: 'string' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'quantity', label: 'Quantity', type: 'number' },
    ],
  },
  {
    table: 'refresh_snapshot_metrics',
    fields: [
      { name: 'ad_spend_timeframe', label: 'Ad Spend', type: 'number' },
      { name: 'roas_timeframe', label: 'ROAS', type: 'number' },
      { name: 'fb_revenue_timeframe', label: 'FB Revenue', type: 'number' },
      {
        name: 'shopify_revenue_timeframe',
        label: 'Shopify Revenue',
        type: 'number',
      },
      { name: 'orders_timeframe', label: 'Orders', type: 'number' },
      { name: 'cpa_purchase', label: 'CPA Purchase', type: 'number' },
      { name: 'cpc', label: 'CPC', type: 'number' },
      { name: 'cpm', label: 'CPM', type: 'number' },
      { name: 'ctr', label: 'CTR', type: 'number' },
      { name: 'hook_rate', label: 'Hook Rate', type: 'number' },
      { name: 'bounce_rate', label: 'Bounce Rate', type: 'number' },
    ],
  },
  {
    table: 'communication_reports',
    fields: [
      { name: 'open_rate', label: 'Open Rate', type: 'number' },
      { name: 'click_rate', label: 'Click Rate', type: 'number' },
      { name: 'bounce_rate', label: 'Bounce Rate', type: 'number' },
      { name: 'unsubscribe_rate', label: 'Unsubscribe Rate', type: 'number' },
    ],
  },
  {
    table: 'clients',
    fields: [
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'pod', label: 'Pod', type: 'string' },
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
