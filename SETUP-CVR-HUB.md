# CVR Hub - Setup Guide

## Quick Start

### 1. Environment Setup

**Optional** - Only required if you want to export to Google Sheets:

```env
# Optional: Google Sheets Export (only needed if you want to save to Sheets)
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional: Default CVR Hub spreadsheet
CVR_HUB_SHEET_ID=your_spreadsheet_id_here
```

**Note**: The CVR Hub works perfectly without Google Sheets. It will:

- ✅ Fetch and display all metrics from Supabase
- ✅ Save data to PostgreSQL database
- ⚠️ Skip Google Sheets export if credentials not configured

### 2. Database Setup

The CVR Hub uses existing tables. Ensure these are already created:

- `api_sources`
- `api_snapshots`
- `api_records`
- `api_record_metrics`
- `refresh_snapshot_metrics`
- `sheet_refresh_snapshots`

**No new migrations required** - all tables already exist per your schema.

### 3. Google Sheets Setup (Optional)

**Only required if you want to export CVR data to Google Sheets:**

1. Create a new Google Spreadsheet
2. Share it with your service account email
3. Copy the spreadsheet ID from the URL
4. Add to `CVR_HUB_SHEET_ID` environment variable

**Skip this step if you only need database storage.**

### 4. Access the Hub

Navigate to: `https://your-domain.com/dashboard/cvr-hub`

## File Checklist

Created files:

- ✅ `types/cvr-hub.ts` - Type definitions
- ✅ `lib/services/cvr-hub.ts` - Core business logic
- ✅ `lib/services/cvr-sheets.ts` - Google Sheets integration
- ✅ `app/api/cvr-hub/metrics/route.ts` - Metrics API
- ✅ `app/api/cvr-hub/filters/route.ts` - Filters API
- ✅ `app/api/cvr-hub/save/route.ts` - Save API
- ✅ `app/dashboard/cvr-hub/page.tsx` - Main page
- ✅ `components/cvr-hub/period-selector.tsx`
- ✅ `components/cvr-hub/metrics-table.tsx`
- ✅ `components/cvr-hub/aggregate-summary.tsx`
- ✅ `components/cvr-hub/save-cvr-button.tsx`
- ✅ `components/cvr-hub/index.ts`
- ✅ `components/ui/select.tsx` - Reusable select component

## Testing Checklist

### Manual Testing

1. **Load Dashboard**

   ```
   ✓ Navigate to /dashboard/cvr-hub
   ✓ Page loads without errors
   ✓ Period selector displays
   ```

2. **Fetch Metrics**

   ```
   ✓ Select "Last 7 Days" period
   ✓ Select "Previous Period" comparison
   ✓ Click Refresh
   ✓ Metrics table populates
   ✓ Aggregate cards show data
   ✓ Comparison columns show % changes
   ```

3. **Save Functionality**

   ```
   ✓ Click "Save to Database & Sheets"
   ✓ Success message appears
   ✓ Check database for new snapshot
   ✓ Check Google Sheet for exported data
   ```

4. **Error Handling**
   ```
   ✓ Invalid period shows error
   ✓ Network error shows error message
   ✓ Empty data shows empty state
   ```

### API Testing

```bash
# Test metrics endpoint
curl -X POST http://localhost:3000/api/cvr-hub/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "period": {
      "preset": "last_7_days",
      "comparisonMode": "previous_period"
    }
  }'

# Test filters endpoint
curl http://localhost:3000/api/cvr-hub/filters

# Test save endpoint (requires data)
curl -X POST http://localhost:3000/api/cvr-hub/save \
  -H "Content-Type: application/json" \
  -d @sample-cvr-data.json
```

## Troubleshooting

### "No data available"

- Ensure `refresh_snapshot_metrics` has data
- Check that snapshots have `refresh_status = 'completed'`
- Verify date range has data in database

### Google Sheets Error

- Verify `GOOGLE_SHEETS_CLIENT_EMAIL` and `GOOGLE_SHEETS_PRIVATE_KEY`
- Check spreadsheet is shared with service account
- Ensure `CVR_HUB_SHEET_ID` is correct

### TypeScript Errors

- Run `npm install` to ensure all dependencies
- Check `types/cvr-hub.ts` is not modified
- Verify imports match file structure

### API Returns 500

- Check server logs for detailed error
- Verify Supabase connection
- Ensure all environment variables set

## Performance Optimization

### For Large Datasets

If you have >1000 accounts:

1. **Add Pagination** to the metrics table
2. **Implement Virtual Scrolling** for better rendering
3. **Add Filters** (Pod, Account Name) to reduce data load
4. **Cache Results** with SWR or React Query

### Database Indexes

Ensure these indexes exist (already defined in schema):

- `idx_metrics_snapshot_id` on `refresh_snapshot_metrics`
- `idx_snapshots_date` on `sheet_refresh_snapshots`
- `idx_snapshots_composite` for multi-column queries

## Next Steps

1. Test the dashboard with real data
2. Customize Google Sheets formatting if needed
3. Add navigation link in main dashboard
4. Set up scheduled snapshots (optional)
5. Configure user permissions

## Support

For questions or issues:

- Check the main README in `/app/dashboard/cvr-hub/`
- Review TypeScript types in `types/cvr-hub.ts`
- Inspect API responses with browser DevTools

---

**Status**: ✅ Ready for Testing
**Last Updated**: December 6, 2025
