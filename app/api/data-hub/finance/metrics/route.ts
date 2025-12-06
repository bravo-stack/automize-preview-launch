import { getFinanceMetrics } from '@/lib/services/data-hub'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '15', 10)
    const snapshotId = searchParams.get('snapshotId') || undefined
    const rebillStatus = searchParams.get('rebillStatus') || undefined

    const result = await getFinanceMetrics({
      page,
      pageSize,
      snapshotId,
      rebillStatus,
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Error fetching Finance metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch metrics',
      },
      { status: 500 },
    )
  }
}
