'use server'

import type { WhatsAppSendResult } from '@/types/whatsapp'

// ============================================================================
// WhatsApp Server Actions (via Twilio)
// ============================================================================

export async function sendWhatsAppMessage(
  to: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER // Format: 'whatsapp:+14155238886'

  // Validate environment variables
  if (!accountSid || !authToken || !fromNumber) {
    console.error('Missing Twilio credentials in environment variables')
    return {
      success: false,
      error: 'WhatsApp service not configured',
    }
  }

  // Validate inputs
  if (!to || !message) {
    return {
      success: false,
      error: 'Missing recipient or message',
    }
  }

  // Ensure phone number has WhatsApp prefix
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: toNumber,
        Body: message,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Twilio API error:', data)
      return {
        success: false,
        error: data.message || 'Failed to send WhatsApp message',
      }
    }

    return {
      success: true,
      messageId: data.sid,
    }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function sendWhatsAppToMany(
  recipients: string[],
  message: string,
): Promise<{ recipient: string; result: WhatsAppSendResult }[]> {
  const results = await Promise.all(
    recipients.map(async (recipient) => ({
      recipient,
      result: await sendWhatsAppMessage(recipient, message),
    })),
  )

  return results
}

export function formatSummaryMessage(
  customMessage: string,
  clients: string[],
): string {
  if (clients.length === 0) {
    return `${customMessage}\n\n✅ All clients have been responded to!`
  }

  const clientList = clients.map((client) => `• ${client}`).join('\n')

  return `${customMessage}\n\nClient List:\n${clientList}`
}

export function formatAdErrorMessage(
  brandName: string,
  errorType: string,
  daysSinceDetected: number,
): string {
  const urgency = daysSinceDetected > 3 ? '🚨 URGENT' : '⚠️ Alert'

  return `${urgency}: Ad Account Error

Brand: ${brandName}
Error: ${errorType}
Days Active: ${daysSinceDetected}

Please check the ad account and resolve the issue.`
}
