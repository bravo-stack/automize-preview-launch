import { getApiDataCategoryStats } from '@/lib/services/data-hub'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const stats = await getApiDataCategoryStats()
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error fetching API data stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      },
      { status: 500 },
    )
  }
}
