import { createAdminClient } from '@/lib/db/admin'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

// ============================================================================
// WhatsApp Status Callback Webhook
// Receives delivery status updates from Twilio for WhatsApp messages
// ============================================================================

/**
 * Twilio status callback payload for WhatsApp messages
 */
interface TwilioStatusCallback {
  MessageSid: string
  MessageStatus: string
  To: string
  From: string
  AccountSid: string
  ApiVersion?: string
  ErrorCode?: string
  ErrorMessage?: string
  // WhatsApp-specific fields
  ChannelPrefix?: string
  ChannelInstallSid?: string
  ChannelStatusMessage?: string
  EventType?: string // 'READ' when message is read
}

/**
 * Validate Twilio webhook signature
 * Ensures the request is actually from Twilio
 */
function validateTwilioSignature(
  request: NextRequest,
  body: string,
  signature: string | null,
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!authToken) {
    console.error('[WhatsApp Callback] Missing TWILIO_AUTH_TOKEN')
    return false
  }

  if (!signature) {
    console.error('[WhatsApp Callback] Missing X-Twilio-Signature header')
    return false
  }

  // Get the full URL that Twilio used to make the request
  const url = request.url

  // Parse the body as form data for validation
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(body)
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  try {
    const isValid = twilio.validateRequest(authToken, signature, url, params)
    return isValid
  } catch (error) {
    console.error('[WhatsApp Callback] Signature validation error:', error)
    return false
  }
}

/**
 * POST /api/whatsapp/status-callback
 * Receives status updates from Twilio when message delivery status changes
 *
 * Status flow for WhatsApp:
 * queued → sending → sent → delivered → read (if read receipts enabled)
 * queued → failed (if delivery fails)
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature validation
    const body = await request.text()
    const headersList = await headers()
    const twilioSignature = headersList.get('x-twilio-signature')

    // Validate signature in production
    if (process.env.NODE_ENV === 'production') {
      const isValid = validateTwilioSignature(request, body, twilioSignature)
      if (!isValid) {
        console.error('[WhatsApp Callback] Invalid Twilio signature')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Parse form-urlencoded body
    const formData = new URLSearchParams(body)
    const payload: TwilioStatusCallback = {
      MessageSid: formData.get('MessageSid') || '',
      MessageStatus: formData.get('MessageStatus') || '',
      To: formData.get('To') || '',
      From: formData.get('From') || '',
      AccountSid: formData.get('AccountSid') || '',
      ApiVersion: formData.get('ApiVersion') || undefined,
      ErrorCode: formData.get('ErrorCode') || undefined,
      ErrorMessage: formData.get('ErrorMessage') || undefined,
      ChannelPrefix: formData.get('ChannelPrefix') || undefined,
      ChannelInstallSid: formData.get('ChannelInstallSid') || undefined,
      ChannelStatusMessage: formData.get('ChannelStatusMessage') || undefined,
      EventType: formData.get('EventType') || undefined,
    }

    // Validate required fields
    if (!payload.MessageSid || !payload.MessageStatus) {
      console.error('[WhatsApp Callback] Missing required fields:', payload)
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    console.log('[WhatsApp Callback] Received status update:', {
      messageSid: payload.MessageSid,
      status: payload.MessageStatus,
      to: payload.To,
      errorCode: payload.ErrorCode,
      eventType: payload.EventType,
    })

    // Update the message log in database
    const db = createAdminClient()

    // Determine failure reason if applicable
    let failureReason: string | null = null
    if (
      payload.MessageStatus === 'failed' ||
      payload.MessageStatus === 'undelivered'
    ) {
      failureReason =
        payload.ChannelStatusMessage ||
        payload.ErrorMessage ||
        `Delivery failed with status: ${payload.MessageStatus}${payload.ErrorCode ? ` (Error ${payload.ErrorCode})` : ''}`
    }

    // Update the log entry with the new status
    const { error: updateError, count } = await db
      .from('whatsapp_message_logs')
      .update({
        delivery_status: payload.MessageStatus,
        failure_reason: failureReason,
      })
      .eq('twilio_message_sid', payload.MessageSid)

    if (updateError) {
      console.error(
        '[WhatsApp Callback] Failed to update message log:',
        updateError,
      )
      // Don't return error to Twilio - we still received the callback
    } else {
      console.log(
        `[WhatsApp Callback] Updated message ${payload.MessageSid} to status: ${payload.MessageStatus}`,
        count !== null ? `(${count} rows affected)` : '',
      )
    }

    // Log specific error codes for monitoring
    if (payload.ErrorCode) {
      console.warn(`[WhatsApp Callback] Error code ${payload.ErrorCode}:`, {
        messageSid: payload.MessageSid,
        errorMessage: payload.ErrorMessage || payload.ChannelStatusMessage,
        to: payload.To,
      })
    }

    // Return 200 OK to acknowledge receipt
    // Twilio expects a 200 response within 15 seconds
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[WhatsApp Callback] Unexpected error:', error)
    // Still return 200 to prevent Twilio from retrying
    // Log the error for investigation
    return NextResponse.json(
      { received: true, error: 'Internal processing error' },
      { status: 200 },
    )
  }
}

/**
 * GET /api/whatsapp/status-callback
 * Health check endpoint - useful for verifying the webhook is accessible
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'WhatsApp Status Callback Webhook',
    timestamp: new Date().toISOString(),
  })
}
