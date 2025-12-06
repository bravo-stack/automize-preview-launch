import { getDayDropRequests } from '@/lib/services/data-hub'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '15', 10)
    const status = searchParams.get('status') || undefined

    const result = await getDayDropRequests({
      page,
      pageSize,
      status,
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Error fetching Day Drop requests:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch requests',
      },
      { status: 500 },
    )
  }
}
