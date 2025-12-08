import { runWhatsAppJobForAllPods } from '@/lib/actions/whatsapp-jobs'
import type { WaFeatureType } from '@/types/whatsapp'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// POST /api/whatsapp/cron-handler
// ============================================================================
// Unified cron endpoint for all WhatsApp notification features
// Replaces individual scheduled-summary and late-response endpoints
//
// Features:
// - Uses pod_whatsapp_configs for configuration
// - Config-driven execution with shouldRunNow() validation
// - Supports feature types: daily_summary, ad_error
//
// Note: late_alert is handled by the Discord NodeJS service
//
// Called by: Private server cron job or Vercel Cron
// Auth: Cron secret key in header
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Validate cron secret
    const cronSecret = request.headers.get('x-cron-secret')
    if (!cronSecret || cronSecret !== process.env.WHATSAPP_CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { feature } = body

    // Validate feature type
    const validFeatures: WaFeatureType[] = ['daily_summary', 'ad_error']

    if (!feature || !validFeatures.includes(feature)) {
      return NextResponse.json(
        {
          error: 'Invalid feature type',
          validFeatures,
        },
        { status: 400 },
      )
    }

    console.log(`[WhatsApp Cron] Starting ${feature} job`)

    // Run the job for all pods
    const result = await runWhatsAppJobForAllPods(feature as WaFeatureType)

    const executionTime = Date.now() - startTime

    // Log execution details
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'whatsapp_cron_executed',
        feature,
        messagesSent: result.messagesSent,
        totalResults: result.results.length,
        success: result.success,
        executionTimeMs: executionTime,
      }),
    )

    return NextResponse.json({
      success: result.success,
      feature,
      messagesSent: result.messagesSent,
      executionTimeMs: executionTime,
      results: result.results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[WhatsApp Cron] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// ============================================================================
// GET endpoint for health check / manual trigger (dev only)
// ============================================================================
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'GET method not allowed in production. Use POST.' },
      { status: 405 },
    )
  }

  const feature = request.nextUrl.searchParams.get('feature')
  const cronSecret = request.nextUrl.searchParams.get('secret')

  if (!cronSecret || cronSecret !== process.env.WHATSAPP_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!feature) {
    return NextResponse.json(
      {
        message: 'WhatsApp Cron Handler',
        usage: 'POST with body: { "feature": "daily_summary" | "ad_error" }',
        devUsage: 'GET ?feature=daily_summary&secret=YOUR_SECRET (dev only)',
        note: 'late_alert is now handled by the Discord NodeJS service',
      },
      { status: 200 },
    )
  }

  // Forward to POST handler
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ feature }),
    }),
  )
}
