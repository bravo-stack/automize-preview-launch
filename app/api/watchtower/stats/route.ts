import { getWatchtowerStats } from '@/lib/actions/watchtower'
import { NextResponse } from 'next/server'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// ============================================================================
// GET /api/watchtower/stats - Get Watchtower statistics
// ============================================================================

export async function GET() {
  try {
    const stats = await getWatchtowerStats()

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      {
        headers: {
          // Prevent caching to ensure fresh data on each request
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    )
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
