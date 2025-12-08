import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// GET /api/whatsapp/late-response
// ============================================================================
// ⚠️ DEPRECATED - This feature is now handled by the Discord NodeJS service
//
// Late response alerts have been migrated to the Discord NodeJS service for
// better integration with the existing Discord bot infrastructure.
//
// This endpoint is kept for backward compatibility and will return a
// deprecation notice.
// ============================================================================

export async function GET(request: NextRequest) {
  // Validate cron secret for backward compatibility
  const cronKey = request.nextUrl.searchParams.get('key')
  if (!cronKey || cronKey !== process.env.WHATSAPP_CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    {
      deprecated: true,
      message:
        'This endpoint is deprecated. Late response alerts are now handled by the Discord NodeJS service.',
      timestamp: new Date().toISOString(),
    },
    { status: 410 }, // 410 Gone
  )
}
