// ============================================================================
// CVR Hub Types - Enterprise Grade
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
// CVR Metrics - Conversion Rate Tracking
// ============================================================================

export interface CVRMetrics {
  accountName: string
  pod: string | null
  isMonitored: boolean
  // Funnel Metrics
  impressions: number
  clicks: number
  atc: number // Add to Cart
  initCheckout: number // Initiated Checkout
  purchases: number
  // Rate Metrics (percentages)
  ctr: number // Click-through Rate
  hookRate: number // Impression to Click
  atcRate: number // Click to ATC
  icRate: number // ATC to Initiated Checkout
  purchaseRate: number // Initiated Checkout to Purchase
  bounceRate: number
  // Overall CVR (Click to Purchase)
  overallCVR: number
  // Financial Metrics
  adSpend: number
  revenue: number
  roas: number
  cpa: number
  cpc: number
  cpm: number
  // Timestamp
  recordDate: string
}

export interface CVRMetricsComparison extends CVRMetrics {
  // Previous Period Data
  previous: {
    overallCVR: number
    atcRate: number
    icRate: number
    purchaseRate: number
    hookRate: number
    bounceRate: number
    roas: number
    cpa: number
    impressions: number
    clicks: number
    purchases: number
  } | null
  // Percentage Changes
  changes: {
    overallCVR: number | null
    atcRate: number | null
    icRate: number | null
    purchaseRate: number | null
    hookRate: number | null
    bounceRate: number | null
    roas: number | null
    cpa: number | null
    impressions: number | null
    clicks: number | null
    purchases: number | null
  }
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface CVRQueryParams {
  period: PeriodSelection
  clientId?: number
  pod?: string
  accountName?: string
  isMonitored?: boolean
}

// ============================================================================
// Aggregated Data
// ============================================================================

export interface CVRAggregates {
  totalImpressions: number
  totalClicks: number
  totalATC: number
  totalInitCheckout: number
  totalPurchases: number
  totalAdSpend: number
  totalRevenue: number
  avgCVR: number
  avgROAS: number
  avgCPA: number
  avgCTR: number
  avgHookRate: number
  avgATCRate: number
  avgICRate: number
  avgPurchaseRate: number
  avgBounceRate: number
}

// ============================================================================
// Google Sheets Export
// ============================================================================

export interface CVRSheetExport {
  sheetId: string
  sheetName: string
  dateRange: DateRange
  metrics: CVRMetricsComparison[]
  aggregates: CVRAggregates
  exportedAt: string
  exportedBy: string
}

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
