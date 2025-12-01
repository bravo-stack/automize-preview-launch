import { sendWhatsAppMessage } from '@/lib/actions/whatsapp'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// POST /api/whatsapp/send
// ============================================================================
// Simple endpoint to send a WhatsApp message
// Protected by API key for external cron jobs / integrations
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.WHATSAPP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { to, message } = body

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 },
      )
    }

    // Send the message
    const result = await sendWhatsAppMessage(to, message)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('WhatsApp send API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
