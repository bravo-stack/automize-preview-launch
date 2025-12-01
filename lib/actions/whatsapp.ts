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

  // Clean the from number (remove whatsapp: prefix if present)
  const cleanFrom = twilioWhatsAppNumber.replace('whatsapp:', '').trim()

  // Twilio requires whatsapp: prefix for WhatsApp messages
  const twilioFormattedTo = `whatsapp:${cleanTo}`
  const twilioFormattedFrom = `whatsapp:${cleanFrom}`

  // Debug logging
  console.log('📱 Sending WhatsApp via Twilio:', {
    from: twilioFormattedFrom,
    to: twilioFormattedTo,
    messagePreview: message.substring(0, 50) + '...',
  })

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

    // Provide helpful error messages for common issues
    let errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('Channel with the specified From address')) {
      errorMessage = `The Twilio number ${cleanFrom} is not WhatsApp-enabled. For sandbox testing, make sure both sender and recipient have joined the sandbox by sending "join <keyword>" to the Twilio sandbox number.`
    } else if (errorMessage.includes('not a valid')) {
      errorMessage = `Invalid phone number format. Ensure numbers are in E.164 format (e.g., +14155238886)`
    }

    return {
      success: false,
      error: errorMessage,
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
