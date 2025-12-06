import { getWatchtowerStats } from '@/lib/actions/watchtower'
import { NextResponse } from 'next/server'

// ============================================================================
// GET /api/watchtower/stats - Get Watchtower statistics
// ============================================================================

export async function GET() {
  try {
    const stats = await getWatchtowerStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching Watchtower stats:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch statistics',
      },
      { status: 500 },
    )
  }
}
