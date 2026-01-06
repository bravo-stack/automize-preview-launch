import { updateMessageStatusWithHistory } from '@/lib/actions/whatsapp'
import type {
  TwilioWhatsAppStatusPayload,
  WhatsAppDeliveryStatus,
} from '@/types/whatsapp'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

// ============================================================================
// WhatsApp Status Callback Webhook
// Receives delivery status updates from Twilio for WhatsApp messages
// ============================================================================

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

  // CRITICAL: Reconstruct URL exactly as Twilio sees it
  // On Vercel/proxies, request.url may resolve to http:// internally,
  // but Twilio sent the request to https://, causing signature mismatch
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('host')
  const parsedUrl = new URL(request.url)
  const path = parsedUrl.pathname
  const search = parsedUrl.search
  const url = `${protocol}://${host}${path}${search}`

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
 * Parse Twilio form-urlencoded body into typed payload
 */
function parseTwilioPayload(body: string): TwilioWhatsAppStatusPayload {
  const formData = new URLSearchParams(body)

  return {
    MessageSid: formData.get('MessageSid') || '',
    MessageStatus: formData.get('MessageStatus') || '',
    To: formData.get('To') || '',
    From: formData.get('From') || '',
    AccountSid: formData.get('AccountSid') || '',
    ApiVersion: formData.get('ApiVersion') || undefined,
    ErrorCode: formData.get('ErrorCode') || undefined,
    ErrorMessage: formData.get('ErrorMessage') || undefined,
    ChannelPrefix: (formData.get('ChannelPrefix') as 'whatsapp') || undefined,
    ChannelInstallSid: formData.get('ChannelInstallSid') || undefined,
    ChannelStatusMessage: formData.get('ChannelStatusMessage') || undefined,
    EventType: formData.get('EventType') || undefined,
  }
}

/**
 * POST /api/whatsapp/status-callback
 * Receives status updates from Twilio when message delivery status changes
 *
 * Status flow for WhatsApp:
 * queued → sending → sent → delivered → read (if read receipts enabled)
 * queued → failed (if delivery fails)
 *
 * Important notes from Twilio docs:
 * - Status callbacks may arrive out of order due to network latency
 * - Always return HTTP 200 within 15 seconds
 * - Payload fields may change without notice
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature validation
    const body = await request.text()
    const headersList = await headers()
    const twilioSignature = headersList.get('x-twilio-signature')

    // Validate signature in production and staging
    const shouldValidate =
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'preview'

    if (shouldValidate) {
      const isValid = validateTwilioSignature(request, body, twilioSignature)
      if (!isValid) {
        console.error('[WhatsApp Callback] Invalid Twilio signature')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Parse form-urlencoded body into typed payload
    const payload = parseTwilioPayload(body)

    // Validate required fields
    if (!payload.MessageSid || !payload.MessageStatus) {
      console.error('[WhatsApp Callback] Missing required fields:', payload)
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const newStatus = payload.MessageStatus as WhatsAppDeliveryStatus

    console.log('[WhatsApp Callback] Received status update:', {
      messageSid: payload.MessageSid,
      status: newStatus,
      to: payload.To,
      errorCode: payload.ErrorCode,
      eventType: payload.EventType,
    })

    // Determine error message for failed deliveries
    const errorMessage =
      payload.ChannelStatusMessage || payload.ErrorMessage || undefined

    // Use the new atomic update function with history tracking
    const updateResult = await updateMessageStatusWithHistory(
      payload.MessageSid,
      newStatus,
      {
        errorCode: payload.ErrorCode,
        errorMessage: errorMessage,
        eventType: payload.EventType, // 'READ' for read receipts
      },
    )

    if (updateResult.success) {
      console.log(
        `[WhatsApp Callback] Processed ${payload.MessageSid} → ${newStatus}`,
      )
    } else if (updateResult.error === 'Message not found') {
      // Message not in our logs - could be from a different source
      console.warn(
        `[WhatsApp Callback] Message ${payload.MessageSid} not found in logs`,
      )
    } else {
      console.error(
        `[WhatsApp Callback] Failed to update ${payload.MessageSid}:`,
        updateResult.error,
      )
    }

    // Log specific error codes for monitoring/alerting
    if (payload.ErrorCode) {
      console.warn(`[WhatsApp Callback] Error code ${payload.ErrorCode}:`, {
        messageSid: payload.MessageSid,
        errorMessage: errorMessage,
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
