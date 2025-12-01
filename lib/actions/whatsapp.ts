'use server'

import type { WhatsAppSendResult } from '@/types/whatsapp'

// ============================================================================
// WhatsApp Server Actions (via WhatsApp Cloud API)
// ============================================================================

export async function sendWhatsAppMessage(
  to: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  // Validate environment variables
  if (!accessToken || !phoneNumberId) {
    console.error(
      'Missing WhatsApp Cloud API credentials in environment variables',
    )
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

  // Clean phone number (remove whatsapp: prefix if present, ensure E.164 format)
  let cleanTo = to.replace('whatsapp:', '').trim()

  // Ensure number starts with + for E.164 format
  if (!cleanTo.startsWith('+')) {
    cleanTo = `+${cleanTo}`
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp Cloud API error:', data)
      return {
        success: false,
        error:
          data.error?.message ||
          data.error?.error_user_msg ||
          'Failed to send WhatsApp message',
      }
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
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
