import { createAdminClient } from '@/lib/db/admin'
import { NextResponse } from 'next/server'

/**
 * GET /api/watchtower/pods
 * Fetches all pods with their discord_id for Discord notification configuration.
 */
export async function GET() {
  try {
    const db = createAdminClient()

    const { data: pods, error } = await db
      .from('pod')
      .select('id, name, discord_id')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching pods:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pods' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: pods || [],
    })
  } catch (error) {
    console.error('Error in pods API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}
