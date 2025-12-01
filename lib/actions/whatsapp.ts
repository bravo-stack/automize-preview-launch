'use server'

import type { WhatsAppSendResult } from '@/types/whatsapp'
import twilio from 'twilio'

// ============================================================================
// WhatsApp Server Actions (via Twilio WhatsApp Business API)
// ============================================================================

export async function sendWhatsAppMessage(
  to: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER

  // Validate environment variables
  if (!accountSid || !authToken || !twilioWhatsAppNumber) {
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

  // Clean phone number and ensure E.164 format
  let cleanTo = to.replace('whatsapp:', '').trim()

  // Ensure number starts with + for E.164 format
  if (!cleanTo.startsWith('+')) {
    cleanTo = `+${cleanTo}`
  }

  // Twilio requires whatsapp: prefix for WhatsApp messages
  const twilioFormattedTo = `whatsapp:${cleanTo}`
  const twilioFormattedFrom = `whatsapp:${twilioWhatsAppNumber}`

  try {
    // Initialize Twilio client
    const client = twilio(accountSid, authToken)

    // Send WhatsApp message via Twilio
    const messageResponse = await client.messages.create({
      body: message,
      from: twilioFormattedFrom,
      to: twilioFormattedTo,
    })

    return {
      success: true,
      messageId: messageResponse.sid,
    }
  } catch (error) {
    console.error('Twilio WhatsApp send error:', error)
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
