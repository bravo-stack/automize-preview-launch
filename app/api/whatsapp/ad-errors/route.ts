import { sendWhatsAppMessage } from '@/lib/actions/whatsapp'
import { createAdminClient } from '@/lib/db/admin'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// GET /api/whatsapp/ad-errors
// ============================================================================
// Daily cron that alerts media buyers about sheet refresh errors
// Detects errors from refresh_snapshot_metrics table where is_error = true
//
// Called by: Private server cron job (daily at 9 AM UTC)
// Auth: Cron secret key in query params
// ============================================================================

export async function GET(request: NextRequest) {
  // Validate cron secret
  const cronKey = request.nextUrl.searchParams.get('key')
  if (!cronKey || cronKey !== process.env.WHATSAPP_CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()

  try {
    // Fetch refresh snapshot metrics with errors from the database
    const { data: sheetData, error: fetchError } = await db
      .from('refresh_snapshot_metrics')
      .select(
        'id, snapshot_id, is_error, error_detail, pod (name, whatsapp_number), sheet_refresh_snapshots(sheet_id, data_preset, refresh_type, snapshot_date)',
      )
      .eq('is_error', true)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching ad errors:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch errors' },
        { status: 500 },
      )
    }

    if (!sheetData || sheetData.length === 0) {
      return NextResponse.json({ message: 'No unresolved ad errors' })
    }

    const results: {
      podName: string
      sheetType: string
      dataPreset: string
      mediaBuyerNotified: boolean
      sheetId: string
    }[] = []

    for (const sheet of sheetData) {
      const pod = Array.isArray(sheet.pod) ? sheet.pod[0] : sheet.pod
      const sheetSnapshot = Array.isArray(sheet.sheet_refresh_snapshots)
        ? sheet.sheet_refresh_snapshots[0]
        : sheet.sheet_refresh_snapshots

      if (!pod || !sheetSnapshot) continue

      // Format the error message
      const errorMessage = `Ad Account Error for ${sheetSnapshot.refresh_type === 'autometric' ? 'Facebook' : 'Finance'}-${sheetSnapshot.data_preset} Sheet

Pod: ${pod.name}
Google Sheet ID: ${sheetSnapshot.sheet_id}
Date Refreshed: ${sheetSnapshot.snapshot_date}
Error Details: ${sheet.error_detail || 'See sheet for details'}

Please check and resolve the issue.`

      let mediaBuyerNotified = false

      // Alert the media buyer (pod) via WhatsApp
      if (pod.whatsapp_number) {
        const mbResult = await sendWhatsAppMessage(
          pod.whatsapp_number,
          errorMessage,
        )
        mediaBuyerNotified = mbResult.success
      }

      results.push({
        podName: pod.name,
        sheetType: sheetSnapshot.refresh_type,
        dataPreset: sheetSnapshot.data_preset,
        mediaBuyerNotified,
        sheetId: sheetSnapshot.sheet_id,
      })
    }

    return NextResponse.json({
      message: 'Ad error alerts processed',
      alertsSent: results.length,
      results,
    })
  } catch (error) {
    console.error('Ad error alerts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// ============================================================================
// POST /api/whatsapp/ad-errors
// ============================================================================
// Manually trigger ad error detection and alerts for a specific pod
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.WHATSAPP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { pod_name } = body

    if (!pod_name) {
      return NextResponse.json(
        { error: 'Missing required field: pod_name' },
        { status: 400 },
      )
    }

    const db = createAdminClient()

    // Fetch refresh snapshot metrics with errors for the specific pod
    const { data: sheetData, error: fetchError } = await db
      .from('refresh_snapshot_metrics')
      .select(
        'id, snapshot_id, is_error, error_detail, pod (name, whatsapp_number), sheet_refresh_snapshots(sheet_id, data_preset, refresh_type, snapshot_date)',
      )
      .eq('is_error', true)
      .eq('pod.name', pod_name)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching ad errors:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch errors' },
        { status: 500 },
      )
    }

    if (!sheetData || sheetData.length === 0) {
      return NextResponse.json({
        message: 'No ad errors found for this pod',
        pod_name,
      })
    }

    const results: {
      sheetType: string
      dataPreset: string
      notified: boolean
    }[] = []

    for (const sheet of sheetData) {
      const pod = Array.isArray(sheet.pod) ? sheet.pod[0] : sheet.pod
      const sheetSnapshot = Array.isArray(sheet.sheet_refresh_snapshots)
        ? sheet.sheet_refresh_snapshots[0]
        : sheet.sheet_refresh_snapshots

      if (!pod || !sheetSnapshot) continue

      const errorMessage = `Ad Account Error for ${sheetSnapshot.refresh_type === 'autometric' ? 'Facebook' : 'Finance'}-${sheetSnapshot.data_preset} Sheet

Pod: ${pod.name}
Google Sheet ID: ${sheetSnapshot.sheet_id}
Date Refreshed: ${sheetSnapshot.snapshot_date}
Error Details: ${sheet.error_detail || 'See sheet for details'}

Please check and resolve the issue.`

      let notified = false
      if (pod.whatsapp_number) {
        const result = await sendWhatsAppMessage(
          pod.whatsapp_number,
          errorMessage,
        )
        notified = result.success
      }

      results.push({
        sheetType: sheetSnapshot.refresh_type,
        dataPreset: sheetSnapshot.data_preset,
        notified,
      })
    }

    return NextResponse.json({
      message: 'Ad errors processed for pod',
      pod_name,
      errorCount: results.length,
      results,
    })
  } catch (error) {
    console.error('POST ad-errors error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// ============================================================================
// PATCH /api/whatsapp/ad-errors
// ============================================================================
// Mark ad account errors as resolved (update is_error flag)
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.WHATSAPP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { snapshot_id, metric_id } = body

    if (!snapshot_id && !metric_id) {
      return NextResponse.json(
        { error: 'Provide snapshot_id or metric_id' },
        { status: 400 },
      )
    }

    const db = createAdminClient()

    let query = db.from('refresh_snapshot_metrics').update({
      is_error: false,
      error_detail: null,
    })

    if (metric_id) {
      query = query.eq('id', metric_id)
    } else if (snapshot_id) {
      query = query.eq('snapshot_id', snapshot_id)
    }

    const { error: updateError } = await query

    if (updateError) {
      console.error('Error resolving ad error:', updateError)
      return NextResponse.json(
        { error: 'Failed to resolve error' },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: 'Error marked as resolved' })
  } catch (error) {
    console.error('PATCH ad-errors error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
