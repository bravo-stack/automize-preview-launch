'use server'

import type {
  CVRAggregates,
  CVRMetricsComparison,
  CVRSheetConfig,
  DateRange,
  SaveCVRResponse,
} from '@/types/cvr-hub'
import { google } from 'googleapis'
import { authorizeSheets } from '../google'

// Default CVR Hub Sheet Configuration
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
    'Brand / Store',
    'Pod',
    'Log Date',
    'CVR %',
    'Prev CVR %',
    'Change %',
    'Status'
  ]

  const startDate = new Date(dateRange.startDate).toLocaleDateString()
  const endDate = new Date(dateRange.endDate).toLocaleDateString()
  const dateRangeStr = `${startDate} - ${endDate}`

  const rows = metrics.map((metric) => [
    dateRangeStr,
    metric.brand || 'Unknown',
    metric.pod || 'N/A',
    new Date(metric.createdAt).toLocaleDateString(),
    metric.cvrValue !== null ? metric.cvrValue.toFixed(4) : 'N/A',
    metric.previous?.cvrValue !== null && metric.previous?.cvrValue !== undefined 
      ? metric.previous.cvrValue.toFixed(4) 
      : 'N/A',
    metric.change !== null ? metric.change.toFixed(2) : 'N/A',
    metric.status || 'active'
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
    ['Total Logs', aggregates.totalLogs.toString()],
    ['Average CVR', `${aggregates.avgCVR.toFixed(4)}%`],
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
      range: `${sheetConfig.sheetName}!A${sheetConfig.headerRow}:H`,
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
 * Exports CVR metrics (Logs) to Google Sheets
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

    if (!hasGoogleSheets) {
       return {
        success: false,
        error: 'Google Sheets credentials not configured'
       }
    }

    const sheetsResult = await saveCVRToGoogleSheets(metrics, aggregates, dateRange, sheetConfig)

    if (!sheetsResult.success) {
      return {
        success: false,
        error: `Sheets save failed: ${sheetsResult.error}`,
      }
    }

    return {
      success: true,
      data: {
        savedToDatabase: false,
        savedToSheets: true,
        recordCount: metrics.length,
        sheetUrl: sheetsResult.sheetUrl,
      },
    }
  } catch (error) {
    console.error('Error exporting CVR metrics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}