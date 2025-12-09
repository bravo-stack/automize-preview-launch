import { NextResponse } from 'next/server'

/**
 * Cron endpoint for Watchtower
 *
 * Note: Scheduled notifications have been disabled.
 * All notifications are now sent immediately when rules trigger.
 */

export async function GET() {
  return NextResponse.json({
    success: true,
    message:
      'Scheduled notifications are disabled. Notifications are sent immediately when rules trigger.',
    timestamp: new Date().toISOString(),
  })
}

// Also support POST for more secure cron handlers
export async function POST(request: Request) {
  return GET()
}
