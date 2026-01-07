// ============================================================================
// CVR Hub Types - Client CVR Logs
// ============================================================================

export type PeriodPreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_14_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'custom'

export type ComparisonMode =
  | 'previous_period'
  | 'same_period_last_year'
  | 'none'

export interface DateRange {
  startDate: string // ISO date string
  endDate: string // ISO date string
}

export interface PeriodSelection {
  preset: PeriodPreset
  customRange?: DateRange
  comparisonMode: ComparisonMode
}

// ============================================================================
// CVR Metrics - From client_cvr_logs
// ============================================================================

export interface CVRLogMetric {
  id: number
  clientId: number | null
  storeId: string | null
  brand: string | null // Joined from clients table
  pod: string | null   // Joined from clients table
  cvrValue: number | null
  status: string | null
  createdAt: string
}

export interface CVRMetricsComparison extends CVRLogMetric {
  // Previous Period Data
  previous: {
    cvrValue: number | null
    createdAt: string
  } | null
  // Percentage Changes
  change: number | null
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface CVRQueryParams {
  period: PeriodSelection
  clientId?: number
  pod?: string
  brand?: string
}

// ============================================================================
// Aggregated Data
// ============================================================================

export interface CVRAggregates {
  avgCVR: number
  totalLogs: number
}

// ============================================================================
// Google Sheets Export
// ============================================================================

export interface CVRSheetConfig {
  spreadsheetId: string
  sheetName: string
  headerRow: number
  dataStartRow: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CVRHubResponse {
  success: boolean
  data?: {
    metrics: CVRMetricsComparison[]
    aggregates: CVRAggregates
    period: PeriodSelection
    dateRanges: {
      current: DateRange
      comparison: DateRange | null
    }
  }
  error?: string
}

export interface SaveCVRResponse {
  success: boolean
  data?: {
    savedToDatabase: boolean
    savedToSheets: boolean
    recordCount: number
    sheetUrl?: string
  }
  error?: string
}
