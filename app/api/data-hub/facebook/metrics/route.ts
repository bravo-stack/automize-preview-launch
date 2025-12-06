import { getFacebookMetrics } from '@/lib/services/data-hub'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '15', 10)
    const snapshotId = searchParams.get('snapshotId') || undefined
    const pod = searchParams.get('pod') || undefined
    const datePreset = searchParams.get('datePreset') || undefined

    const result = await getFacebookMetrics({
      page,
      pageSize,
      snapshotId,
      pod,
      datePreset,
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Error fetching Facebook metrics:', error)
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
