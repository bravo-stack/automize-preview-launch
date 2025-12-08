import { processScheduledNotifications } from '@/lib/actions/watchtower-engine'
import { NextResponse } from 'next/server'

/**
 * Cron endpoint for processing scheduled Watchtower notifications
 *
 * This endpoint should be called by a cron scheduler (e.g., Vercel Cron, GitHub Actions)
 *
 * Query parameters:
 * - schedule: 'daily' | 'weekly' (required)
 * - key: Authorization key (optional, for security)
 *
 * Example cron configurations:
 * - Daily: Call at 9:00 AM with ?schedule=daily
 * - Weekly: Call on Monday at 9:00 AM with ?schedule=weekly
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const schedule = searchParams.get('schedule') as 'daily' | 'weekly' | null
    const authKey = searchParams.get('key')

    // Optional: Verify authorization key
    const expectedKey = process.env.CRON_SECRET_KEY
    if (expectedKey && authKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    if (!schedule || !['daily', 'weekly'].includes(schedule)) {
      return NextResponse.json(
        { success: false, error: 'Invalid schedule. Use "daily" or "weekly"' },
        { status: 400 },
      )
    }

    console.log(`Processing ${schedule} scheduled notifications...`)

    const result = await processScheduledNotifications(schedule)

    console.log(
      `Scheduled notifications processed: ${result.processed} rules checked, ${result.sent} notifications sent`,
    )

    return NextResponse.json({
      success: true,
      schedule,
      processed: result.processed,
      sent: result.sent,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error processing scheduled notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process notifications',
      },
      { status: 500 },
    )
  }
}

// Also support POST for more secure cron handlers
export async function POST(request: Request) {
  return GET(request)
}
