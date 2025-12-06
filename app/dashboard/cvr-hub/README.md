# CVR Hub - Conversion Rate Tracking & Analysis

## Overview

The CVR Hub is an enterprise-grade dashboard for viewing, tracking, and analyzing conversion rates across all accounts with period-over-period comparison capabilities. Data is automatically saved to both PostgreSQL database and Google Sheets for comprehensive reporting.

## Features

✅ **Period Selection**

- Predefined periods: Today, Yesterday, Last 7/14/30 days, This/Last Month
- Comparison modes: Previous Period, Same Period Last Year, or No Comparison

✅ **Smart CVR Calculation**

- Overall CVR (Click to Purchase conversion)
- Funnel breakdown: Hook Rate → ATC Rate → IC Rate → Purchase Rate
- Financial metrics: ROAS, CPA, CPC, CPM

✅ **Period-over-Period Comparison**

- Visual percentage change indicators (green for positive, red for negative)
- Comparison data displayed alongside current metrics
- Intelligent date range calculation

✅ **Dual Storage**

- Saves to PostgreSQL via `api_snapshots`, `api_records`, and `api_record_metrics`
- **Optionally** exports to Google Sheets with formatted headers and aggregates
- Works perfectly without Google Sheets - database storage is primary

✅ **Aggregate Analytics**

- Total impressions, clicks, purchases across all accounts
- Average CVR, ROAS, CPA across the period
- Financial totals: Ad Spend and Revenue

## Architecture

### Database Schema

The CVR Hub leverages existing tables:

- **`refresh_snapshot_metrics`**: Source data containing account-level metrics
- **`sheet_refresh_snapshots`**: Snapshot metadata with dates and status
- **`api_sources`**: CVR Hub source definition
- **`api_snapshots`**: Historical CVR snapshot records
- **`api_records`**: Individual account CVR records
- **`api_record_metrics`**: Granular metric storage (CVR, ROAS, etc.)

### File Structure

```
types/
  cvr-hub.ts                        # TypeScript types and interfaces

lib/
  services/
    cvr-hub.ts                      # Core business logic & DB queries
    cvr-sheets.ts                   # Google Sheets integration

app/
  api/
    cvr-hub/
      metrics/route.ts              # Fetch CVR metrics endpoint
      filters/route.ts              # Get filter options endpoint
      save/route.ts                 # Save to DB & Sheets endpoint

  dashboard/
    cvr-hub/
      page.tsx                      # Main dashboard page

components/
  cvr-hub/
    period-selector.tsx             # Time period & comparison selector
    metrics-table.tsx               # Data table with comparison columns
    aggregate-summary.tsx           # Stats cards display
    save-cvr-button.tsx             # Save action with status feedback
  ui/
    select.tsx                      # Reusable select component
```

## API Endpoints

### POST `/api/cvr-hub/metrics`

Fetches CVR metrics with period comparison.

**Request Body:**

```typescript
{
  period: {
    preset: "last_7_days",
    comparisonMode: "previous_period"
  },
  clientId?: number,
  pod?: string,
  accountName?: string,
  isMonitored?: boolean
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    metrics: CVRMetricsComparison[],
    aggregates: CVRAggregates,
    period: PeriodSelection,
    dateRanges: {
      current: DateRange,
      comparison: DateRange | null
    }
  }
}
```

### GET `/api/cvr-hub/filters`

Returns available filter options (pods, account names).

### POST `/api/cvr-hub/save`

Saves CVR data to both database and Google Sheets.

**Request Body:**

```typescript
{
  metrics: CVRMetricsComparison[],
  aggregates: CVRAggregates,
  dateRange: DateRange,
  clientId?: number,
  sheetConfig?: Partial<CVRSheetConfig>
}
```

## Environment Variables

**Optional** - Only needed for Google Sheets export feature:

```env
# Google Sheets Configuration (Optional - skip if you don't need Sheets export)
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CVR Hub Sheet ID (optional - can be passed in API call)
CVR_HUB_SHEET_ID=your_spreadsheet_id_here
```

**The CVR Hub works without these variables** - it will simply skip Google Sheets export and only save to the database.

## Usage

### Navigate to CVR Hub

Visit `/dashboard/cvr-hub` after logging in.

### Select Time Period

1. Choose a period from the dropdown (e.g., "Last 7 Days")
2. Select comparison mode (e.g., "Previous Period")
3. Click "Refresh" or let it auto-fetch

### View Metrics

- **Aggregate Summary**: Cards showing totals and averages
- **Account Metrics Table**: Detailed per-account breakdown
- **Comparison Columns**: Green (+) or red (-) percentage changes

### Save Data

Click "Save to Database & Sheets" to persist:

- Creates snapshot in `api_snapshots`
- Stores records in `api_records` with metrics in `api_record_metrics`
- Exports formatted data to Google Sheets with headers and aggregates

## Key Functions

### `calculateDateRange(preset, customRange?)`

Converts preset strings to concrete date ranges.

### `calculateComparisonRange(currentRange, mode)`

Calculates the comparison period based on mode:

- `previous_period`: Same duration immediately before current range
- `same_period_last_year`: Same dates one year ago

### `fetchCVRMetricsWithComparison(params)`

Main query function that:

1. Fetches current period metrics
2. Fetches comparison period metrics (if applicable)
3. Calculates percentage changes
4. Returns enriched comparison data

### `calculateCVRAggregates(metrics)`

Aggregates all metrics into totals and averages.

### `saveCVRMetrics(metrics, aggregates, dateRange, clientId?, sheetConfig?)`

Orchestrates parallel save to both database and Google Sheets.

## Data Flow

```
User selects period
    ↓
POST /api/cvr-hub/metrics
    ↓
calculateDateRange() + calculateComparisonRange()
    ↓
fetchCVRMetricsFromDatabase() [current & previous periods]
    ↓
calculatePercentageChanges()
    ↓
calculateAggregates()
    ↓
Return to UI → Display in table
    ↓
User clicks "Save"
    ↓
POST /api/cvr-hub/save
    ↓
saveCVRToDatabase() + saveCVRToGoogleSheets() [parallel]
    ↓
Success confirmation
```

## Type Safety

All components use strict TypeScript types:

- `CVRMetrics`: Base metric interface
- `CVRMetricsComparison`: Includes previous period and change calculations
- `CVRAggregates`: Aggregated totals and averages
- `PeriodSelection`: Period preset and comparison mode
- `DateRange`: Start and end ISO date strings

## Best Practices

1. **Avoid N+1 Queries**: Single query per period fetches all accounts
2. **Efficient Joins**: Uses Supabase joins to include snapshot metadata
3. **Client-Side Calculation**: Percentage changes calculated in-memory
4. **Parallel Operations**: Database and Sheets saves run concurrently
5. **Error Boundaries**: Graceful error handling with user feedback
6. **Optimistic UI**: Loading states and immediate feedback

## Future Enhancements

- [ ] CSV export option
- [ ] Custom date range picker
- [ ] Pod/Account filtering in UI
- [ ] Scheduled automated saves
- [ ] Email reports
- [ ] Historical trend charts
- [ ] A/B test comparison mode

## Support

For issues or questions about CVR Hub, contact the development team or check the main project documentation.
