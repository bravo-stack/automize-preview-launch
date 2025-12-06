import { getFinanceAggregates } from '@/lib/services/data-hub'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const snapshotId = searchParams.get('snapshotId') || undefined

    const aggregates = await getFinanceAggregates(snapshotId)
    return NextResponse.json({ success: true, data: aggregates })
  } catch (error) {
    console.error('Error fetching Finance aggregates:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch aggregates',
      },
      { status: 500 },
    )
  }
}
