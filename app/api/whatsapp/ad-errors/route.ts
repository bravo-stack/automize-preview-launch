import {
  formatAdErrorMessage,
  sendWhatsAppMessage,
} from '@/lib/actions/whatsapp'
import { createAdminClient } from '@/lib/db/admin'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// GET /api/whatsapp/ad-errors
// ============================================================================
// Daily cron that alerts media buyers AND clients about ad account errors
// Keeps alerting daily until the error is resolved
//
// Called by: Vercel Cron (once daily, e.g., 9 AM)
// ============================================================================

export async function GET(request: NextRequest) {
  // Validate cron secret
  const cronKey = request.nextUrl.searchParams.get('key')
  if (!cronKey || cronKey !== process.env.WHATSAPP_CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()

  try {
    // Fetch all unresolved ad account errors with client info
    const { data: errors, error: fetchError } = await db
      .from('ad_account_errors')
      .select(
        `
        *,
        client:client_id(
          id,
          brand,
          phone_number,
          pod
        )
      `,
      )
      .eq('is_resolved', false)

    if (fetchError) {
      console.error('Error fetching ad errors:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch errors' },
        { status: 500 },
      )
    }

    if (!errors || errors.length === 0) {
      return NextResponse.json({ message: 'No unresolved ad errors' })
    }

    const now = new Date()
    const results: {
      brand: string
      mediaBuyerNotified: boolean
      clientNotified: boolean
      daysSinceDetected: number
    }[] = []

    for (const error of errors) {
      const client = error.client
      if (!client) continue

      // Calculate days since error was first detected
      const firstDetected = new Date(error.first_detected_at)
      const daysSinceDetected = Math.floor(
        (now.getTime() - firstDetected.getTime()) / (1000 * 60 * 60 * 24),
      )

      // Format the alert message
      const message = formatAdErrorMessage(
        client.brand,
        error.error_type,
        daysSinceDetected,
      )

      let mediaBuyerNotified = false
      let clientNotified = false

      // Get pod info for the client (pod is stored as name text)
      let podWhatsAppNumber: string | null = null
      if (client.pod) {
        const { data: podData } = await db
          .from('pod')
          .select('whatsapp_number')
          .eq('name', client.pod)
          .single()
        podWhatsAppNumber = podData?.whatsapp_number || null
      }

      // Alert the media buyer (pod)
      if (podWhatsAppNumber) {
        const mbResult = await sendWhatsAppMessage(podWhatsAppNumber, message)
        mediaBuyerNotified = mbResult.success
      }

      // Alert the client (if they have a phone number)
      if (client.phone_number) {
        const clientResult = await sendWhatsAppMessage(
          client.phone_number,
          message,
        )
        clientNotified = clientResult.success
      }

      // Update last_alerted_at
      await db
        .from('ad_account_errors')
        .update({ last_alerted_at: now.toISOString() })
        .eq('id', error.id)

      results.push({
        brand: client.brand,
        mediaBuyerNotified,
        clientNotified,
        daysSinceDetected,
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
// Manually log a new ad account error (called from other parts of the app)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.WHATSAPP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { client_id, error_type, error_message } = body

    if (!client_id || !error_type) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, error_type' },
        { status: 400 },
      )
    }

    const db = createAdminClient()

    // Check if this error already exists (upsert logic)
    const { data: existing } = await db
      .from('ad_account_errors')
      .select('id')
      .eq('client_id', client_id)
      .eq('error_type', error_type)
      .eq('is_resolved', false)
      .single()

    if (existing) {
      // Error already tracked, just update the message
      await db
        .from('ad_account_errors')
        .update({ error_message })
        .eq('id', existing.id)

      return NextResponse.json({
        message: 'Error already tracked',
        id: existing.id,
      })
    }

    // Insert new error
    const { data: newError, error: insertError } = await db
      .from('ad_account_errors')
      .insert({
        client_id,
        error_type,
        error_message: error_message || error_type,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting ad error:', insertError)
      return NextResponse.json(
        { error: 'Failed to log error' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: 'Error logged successfully',
      id: newError.id,
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
// Mark an ad account error as resolved
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.WHATSAPP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { error_id, client_id, error_type } = body

    const db = createAdminClient()

    // Can resolve by error_id OR by client_id + error_type
    let query = db.from('ad_account_errors').update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    })

    if (error_id) {
      query = query.eq('id', error_id)
    } else if (client_id && error_type) {
      query = query
        .eq('client_id', client_id)
        .eq('error_type', error_type)
        .eq('is_resolved', false)
    } else {
      return NextResponse.json(
        { error: 'Provide error_id or (client_id + error_type)' },
        { status: 400 },
      )
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
