'use server'

import type {
  CVRAggregates,
  CVRMetricsComparison,
  CVRSheetConfig,
  DateRange,
  SaveCVRResponse,
} from '@/types/cvr-hub'
import { google } from 'googleapis'
import { createAdminClient } from '../db/admin'
import { authorizeSheets } from '../google'

// Default CVR Hub Sheet Configuration (Optional - only needed for Google Sheets export)
const DEFAULT_CVR_SHEET_CONFIG: CVRSheetConfig = {
  spreadsheetId: process.env.CVR_HUB_SHEET_ID || '',
  sheetName: 'CVR Metrics',
  headerRow: 1,
  dataStartRow: 2,
}

/**
 * Formats CVR metrics data into Google Sheets row format
 */
function formatMetricsForSheets(
  metrics: CVRMetricsComparison[],
  dateRange: DateRange,
): string[][] {
  const header = [
    'Date Range',
    'Account Name',
    'Pod',
    'Monitored',
    'Impressions',
    'Clicks',
    'ATC',
    'Init Checkout',
    'Purchases',
    'CTR %',
    'Hook Rate %',
    'ATC Rate %',
    'IC Rate %',
    'Purchase Rate %',
    'Overall CVR %',
    'Bounce Rate %',
    'Ad Spend',
    'Revenue',
    'ROAS',
    'CPA',
    'CPC',
    'CPM',
    // Comparison Columns
    'Prev CVR %',
    'CVR Change %',
    'Prev ROAS',
    'ROAS Change %',
    'Prev ATC Rate %',
    'ATC Rate Change %',
    'Prev IC Rate %',
    'IC Rate Change %',
    'Prev Purchase Rate %',
    'Purchase Rate Change %',
  ]

  const startDate = new Date(dateRange.startDate).toLocaleDateString()
  const endDate = new Date(dateRange.endDate).toLocaleDateString()
  const dateRangeStr = `${startDate} - ${endDate}`

  const rows = metrics.map((metric) => [
    dateRangeStr,
    metric.accountName,
    metric.pod || 'N/A',
    metric.isMonitored ? 'Yes' : 'No',
    metric.impressions.toString(),
    metric.clicks.toFixed(0),
    metric.atc.toFixed(0),
    metric.initCheckout.toFixed(0),
    metric.purchases.toString(),
    metric.ctr.toFixed(4),
    metric.hookRate.toFixed(4),
    metric.atcRate.toFixed(4),
    metric.icRate.toFixed(4),
    metric.purchaseRate.toFixed(4),
    metric.overallCVR.toFixed(4),
    metric.bounceRate.toFixed(4),
    metric.adSpend.toFixed(2),
    metric.revenue.toFixed(2),
    metric.roas.toFixed(4),
    metric.cpa.toFixed(2),
    metric.cpc.toFixed(4),
    metric.cpm.toFixed(4),
    // Comparison Values
    metric.previous?.overallCVR.toFixed(4) || 'N/A',
    metric.changes.overallCVR?.toFixed(2) || 'N/A',
    metric.previous?.roas.toFixed(4) || 'N/A',
    metric.changes.roas?.toFixed(2) || 'N/A',
    metric.previous?.atcRate.toFixed(4) || 'N/A',
    metric.changes.atcRate?.toFixed(2) || 'N/A',
    metric.previous?.icRate.toFixed(4) || 'N/A',
    metric.changes.icRate?.toFixed(2) || 'N/A',
    metric.previous?.purchaseRate.toFixed(4) || 'N/A',
    metric.changes.purchaseRate?.toFixed(2) || 'N/A',
  ])

  return [header, ...rows]
}

/**
 * Formats aggregate data for Google Sheets
 */
function formatAggregatesForSheets(
  aggregates: CVRAggregates,
  dateRange: DateRange,
): string[][] {
  const startDate = new Date(dateRange.startDate).toLocaleDateString()
  const endDate = new Date(dateRange.endDate).toLocaleDateString()

  return [
    [''],
    ['AGGREGATED METRICS'],
    ['Date Range', `${startDate} - ${endDate}`],
    ['Total Impressions', aggregates.totalImpressions.toString()],
    ['Total Clicks', aggregates.totalClicks.toFixed(0)],
    ['Total ATC', aggregates.totalATC.toFixed(0)],
    ['Total Init Checkout', aggregates.totalInitCheckout.toFixed(0)],
    ['Total Purchases', aggregates.totalPurchases.toString()],
    ['Total Ad Spend', `$${aggregates.totalAdSpend.toFixed(2)}`],
    ['Total Revenue', `$${aggregates.totalRevenue.toFixed(2)}`],
    ['Average CVR', `${aggregates.avgCVR.toFixed(4)}%`],
    ['Average ROAS', aggregates.avgROAS.toFixed(4)],
    ['Average CPA', `$${aggregates.avgCPA.toFixed(2)}`],
    ['Average CTR', `${aggregates.avgCTR.toFixed(4)}%`],
    ['Average Hook Rate', `${aggregates.avgHookRate.toFixed(4)}%`],
    ['Average ATC Rate', `${aggregates.avgATCRate.toFixed(4)}%`],
    ['Average IC Rate', `${aggregates.avgICRate.toFixed(4)}%`],
    ['Average Purchase Rate', `${aggregates.avgPurchaseRate.toFixed(4)}%`],
    ['Average Bounce Rate', `${aggregates.avgBounceRate.toFixed(4)}%`],
  ]
}

/**
 * Saves CVR metrics to Google Sheets
 */
export async function saveCVRToGoogleSheets(
  metrics: CVRMetricsComparison[],
  aggregates: CVRAggregates,
  dateRange: DateRange,
  config: Partial<CVRSheetConfig> = {},
): Promise<{ success: boolean; sheetUrl?: string; error?: string }> {
  try {
    const sheetConfig = { ...DEFAULT_CVR_SHEET_CONFIG, ...config }

    if (!sheetConfig.spreadsheetId) {
      throw new Error('CVR_HUB_SHEET_ID environment variable not configured')
    }

    const auth = await authorizeSheets()
    const sheets = google.sheets({ version: 'v4', auth })

    // Format data
    const metricsData = formatMetricsForSheets(metrics, dateRange)
    const aggregatesData = formatAggregatesForSheets(aggregates, dateRange)

    // Clear existing data (optional - keeps history if removed)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetConfig.spreadsheetId,
      range: `${sheetConfig.sheetName}!A${sheetConfig.headerRow}:AH`,
    })

    // Write metrics data
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetConfig.spreadsheetId,
      range: `${sheetConfig.sheetName}!A${sheetConfig.headerRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: metricsData,
      },
    })

    // Write aggregates below metrics data
    const aggregatesStartRow = sheetConfig.headerRow + metricsData.length + 2
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetConfig.spreadsheetId,
      range: `${sheetConfig.sheetName}!A${aggregatesStartRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: aggregatesData,
      },
    })

    // Format header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetConfig.spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: sheetConfig.headerRow - 1,
                endRowIndex: sheetConfig.headerRow,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      },
    })

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetConfig.spreadsheetId}`

    return {
      success: true,
      sheetUrl,
    }
  } catch (error) {
    console.error('Error saving CVR to Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Saves CVR metrics to database for historical tracking
 * Creates a snapshot record in api_snapshots with CVR data
 */
export async function saveCVRToDatabase(
  metrics: CVRMetricsComparison[],
  dateRange: DateRange,
  clientId?: number,
): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
  try {
    const db = createAdminClient()

    // Get or create CVR Hub source
    const { data: source, error: sourceError } = await db
      .from('api_sources')
      .select('id')
      .eq('provider', 'cvr_hub')
      .eq('endpoint', 'metrics')
      .single()

    let sourceId: string

    if (sourceError || !source) {
      const { data: newSource, error: createError } = await db
        .from('api_sources')
        .insert({
          provider: 'cvr_hub',
          endpoint: 'metrics',
          display_name: 'CVR Hub Metrics',
          description: 'Conversion Rate tracking and analysis hub',
          refresh_interval_minutes: 1440, // Daily
          is_active: true,
        })
        .select('id')
        .single()

      if (createError || !newSource) {
        throw new Error('Failed to create CVR Hub source')
      }
      sourceId = newSource.id
    } else {
      sourceId = source.id
    }

    // Create snapshot
    const { data: snapshot, error: snapshotError } = await db
      .from('api_snapshots')
      .insert({
        source_id: sourceId,
        client_id: clientId || null,
        snapshot_type: 'manual',
        status: 'completed',
        total_records: metrics.length,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (snapshotError || !snapshot) {
      throw new Error('Failed to create snapshot')
    }

    // Save records
    const records = metrics.map((metric) => ({
      snapshot_id: snapshot.id,
      client_id: clientId || null,
      external_id: `${metric.accountName}_${dateRange.startDate}`,
      name: metric.accountName,
      status: 'active',
      category: metric.pod || 'uncategorized',
      record_date: new Date(dateRange.endDate).toISOString(),
      extra: {
        date_range: dateRange,
        is_monitored: metric.isMonitored,
        previous_period: metric.previous,
        changes: metric.changes,
      },
    }))

    const { data: savedRecords, error: recordsError } = await db
      .from('api_records')
      .insert(records)
      .select('id')

    if (recordsError || !savedRecords) {
      throw new Error('Failed to save records')
    }

    // Save metrics for each record
    const allMetrics = savedRecords.flatMap((record, index) => {
      const metric = metrics[index]
      return [
        {
          record_id: record.id,
          metric_name: 'impressions',
          metric_value: metric.impressions,
          metric_unit: 'count',
        },
        {
          record_id: record.id,
          metric_name: 'clicks',
          metric_value: metric.clicks,
          metric_unit: 'count',
        },
        {
          record_id: record.id,
          metric_name: 'atc',
          metric_value: metric.atc,
          metric_unit: 'count',
        },
        {
          record_id: record.id,
          metric_name: 'init_checkout',
          metric_value: metric.initCheckout,
          metric_unit: 'count',
        },
        {
          record_id: record.id,
          metric_name: 'purchases',
          metric_value: metric.purchases,
          metric_unit: 'count',
        },
        {
          record_id: record.id,
          metric_name: 'ctr',
          metric_value: metric.ctr,
          metric_unit: 'percent',
        },
        {
          record_id: record.id,
          metric_name: 'hook_rate',
          metric_value: metric.hookRate,
          metric_unit: 'percent',
        },
        {
          record_id: record.id,
          metric_name: 'atc_rate',
          metric_value: metric.atcRate,
          metric_unit: 'percent',
        },
        {
          record_id: record.id,
          metric_name: 'ic_rate',
          metric_value: metric.icRate,
          metric_unit: 'percent',
        },
        {
          record_id: record.id,
          metric_name: 'purchase_rate',
          metric_value: metric.purchaseRate,
          metric_unit: 'percent',
        },
        {
          record_id: record.id,
          metric_name: 'overall_cvr',
          metric_value: metric.overallCVR,
          metric_unit: 'percent',
        },
        {
          record_id: record.id,
          metric_name: 'bounce_rate',
          metric_value: metric.bounceRate,
          metric_unit: 'percent',
        },
        {
          record_id: record.id,
          metric_name: 'ad_spend',
          metric_value: metric.adSpend,
          metric_unit: 'currency',
        },
        {
          record_id: record.id,
          metric_name: 'revenue',
          metric_value: metric.revenue,
          metric_unit: 'currency',
        },
        {
          record_id: record.id,
          metric_name: 'roas',
          metric_value: metric.roas,
          metric_unit: null,
        },
        {
          record_id: record.id,
          metric_name: 'cpa',
          metric_value: metric.cpa,
          metric_unit: 'currency',
        },
        {
          record_id: record.id,
          metric_name: 'cpc',
          metric_value: metric.cpc,
          metric_unit: 'currency',
        },
        {
          record_id: record.id,
          metric_name: 'cpm',
          metric_value: metric.cpm,
          metric_unit: 'currency',
        },
      ]
    })

    const { error: metricsError } = await db
      .from('api_record_metrics')
      .insert(allMetrics)

    if (metricsError) {
      throw new Error('Failed to save record metrics')
    }

    return {
      success: true,
      snapshotId: snapshot.id,
    }
  } catch (error) {
    console.error('Error saving CVR to database:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Saves CVR data to both Google Sheets and Database
 * Note: Google Sheets is optional - if credentials not configured, only saves to DB
 */
export async function saveCVRMetrics(
  metrics: CVRMetricsComparison[],
  aggregates: CVRAggregates,
  dateRange: DateRange,
  clientId?: number,
  sheetConfig?: Partial<CVRSheetConfig>,
): Promise<SaveCVRResponse> {
  try {
    // Check if Google Sheets is configured
    const hasGoogleSheets = !!(
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
      process.env.GOOGLE_SHEETS_PRIVATE_KEY
    )

    const promises = [saveCVRToDatabase(metrics, dateRange, clientId)]

    // Only attempt Google Sheets save if configured
    if (
      hasGoogleSheets &&
      (sheetConfig?.spreadsheetId || process.env.CVR_HUB_SHEET_ID)
    ) {
      promises.push(
        saveCVRToGoogleSheets(metrics, aggregates, dateRange, sheetConfig),
      )
    }

    const results = await Promise.all(promises)
    const dbResult = results[0] as Awaited<ReturnType<typeof saveCVRToDatabase>>
    const sheetsResult =
      results.length > 1
        ? (results[1] as Awaited<ReturnType<typeof saveCVRToGoogleSheets>>)
        : null

    // Database save is critical, Sheets is optional
    if (!dbResult.success) {
      return {
        success: false,
        error: `Database save failed: ${dbResult.error}`,
      }
    }

    return {
      success: true,
      data: {
        savedToDatabase: dbResult.success,
        savedToSheets: sheetsResult?.success || false,
        recordCount: metrics.length,
        sheetUrl: sheetsResult?.sheetUrl,
      },
    }
  } catch (error) {
    console.error('Error saving CVR metrics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
