import {
  getApiRecords,
  getApiSnapshots,
  getApiSources,
  getFormSubmissions,
  getRefreshSnapshotMetrics,
  getSheetSnapshots,
  getWatchtowerAlerts,
  getWatchtowerRules,
} from '@/lib/services/data-hub'
import { NextRequest, NextResponse } from 'next/server'

type TableName =
  | 'sources'
  | 'snapshots'
  | 'records'
  | 'sheet-snapshots'
  | 'sheet-metrics'
  | 'alerts'
  | 'rules'
  | 'forms'

export async function GET(
  request: NextRequest,
  { params }: { params: { table: TableName } },
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)

    // Get optional filters
    const filters: Record<string, string | boolean | undefined> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'pageSize') {
        filters[key] =
          value === 'true' ? true : value === 'false' ? false : value
      }
    })

    let result

    switch (params.table) {
      case 'sources':
        result = await getApiSources({ page, pageSize })
        break

      case 'snapshots':
        result = await getApiSnapshots({
          page,
          pageSize,
          sourceId: filters.sourceId as string,
          status: filters.status as string,
        })
        break

      case 'records':
        result = await getApiRecords({
          page,
          pageSize,
          snapshotId: filters.snapshotId as string,
          category: filters.category as string,
          status: filters.status as string,
        })
        break

      case 'sheet-snapshots':
        result = await getSheetSnapshots({
          page,
          pageSize,
          refreshType: filters.refreshType as string,
          status: filters.status as string,
        })
        break

      case 'sheet-metrics':
        result = await getRefreshSnapshotMetrics({
          page,
          pageSize,
          snapshotId: filters.snapshotId as string,
          pod: filters.pod as string,
        })
        break

      case 'alerts':
        result = await getWatchtowerAlerts({
          page,
          pageSize,
          severity: filters.severity as string,
          isAcknowledged: filters.isAcknowledged as boolean | undefined,
        })
        break

      case 'rules':
        result = await getWatchtowerRules({
          page,
          pageSize,
          isActive: filters.isActive as boolean | undefined,
        })
        break

      case 'forms':
        result = await getFormSubmissions({
          page,
          pageSize,
          formType: filters.formType as string,
          status: filters.status as string,
        })
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid table name' },
          { status: 400 },
        )
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error(`Error fetching ${params.table}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      },
      { status: 500 },
    )
  }
}
