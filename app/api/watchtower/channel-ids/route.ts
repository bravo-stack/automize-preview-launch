import { createAdminClient } from '@/lib/db/admin'
import { NextResponse } from 'next/server'
// 1. Force dynamic rendering
export const dynamic = 'force-dynamic'

// 2. Explicitly setting revalidation to 0 (The "Nuclear Option" for caching)
export const revalidate = 0

/**
 * GET /api/watchtower/pods
 * Fetches all pods with their discord_id and whatsapp_number for notification configuration.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ruleId = searchParams.get('ruleId')

  if (!ruleId) {
    return NextResponse.json(
      { success: false, error: 'Missing ruleId parameter', data: [] },
      { status: 400 },
    )
  }

  try {
    const db = createAdminClient()

    const { data: channelIds, error } = await db
      .from('watchtower_channel_ids')
      .select('*')
      .eq('rule_id', ruleId)
      .order('label', { ascending: true })

    if (error) {
      console.error('Error fetching channel IDs:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch channel IDs' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: channelIds || [],
    })
  } catch (error) {
    console.error('Error in channel IDs API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}
