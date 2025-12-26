'use server'

import { createAdminClient } from '@/lib/db/admin'
import type {
  WhatsAppMessageLogInput,
  WhatsAppSendResult,
  WhatsAppSourceFeature,
} from '@/types/whatsapp'
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
      success: messageResponse.errorCode ? false : true,
      date_created: messageResponse.dateCreated,
      delivery_status: messageResponse.status,
      messageId: messageResponse.sid,
      error: messageResponse.errorMessage || undefined,
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

// ============================================================================
// WhatsApp Message Logging
// ============================================================================

/**
 * Log a WhatsApp message to the whatsapp_message_logs table
 */
export async function logWhatsAppMessage(
  input: WhatsAppMessageLogInput,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  const { error } = await db.from('whatsapp_message_logs').insert({
    pod_name: input.pod_name,
    recipient_name: input.recipient_name || null,
    recipient_phone_number: input.recipient_phone_number,
    source_feature: input.source_feature,
    message_content: input.message_content || null,
    delivery_status: input.delivery_status,
    twilio_message_sid: input.twilio_message_sid || null,
    failure_reason: input.failure_reason || null,
  })

  if (error) {
    console.error('[WhatsApp] Failed to log message:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Send WhatsApp message and log the result
 * Combines sending and logging into a single operation
 */
export async function sendAndLogWhatsAppMessage(
  to: string,
  message: string,
  podName: string,
  sourceFeature: WhatsAppSourceFeature,
  recipientName?: string,
): Promise<WhatsAppSendResult> {
  const result = await sendWhatsAppMessage(to, message)

  // Clean phone number for logging (ensure consistent format)
  let cleanTo = to.replace('whatsapp:', '').trim()
  if (!cleanTo.startsWith('+')) {
    cleanTo = `+${cleanTo}`
  }

  // Log the message attempt
  await logWhatsAppMessage({
    pod_name: podName,
    recipient_name: recipientName || null,
    recipient_phone_number: cleanTo,
    source_feature: sourceFeature,
    message_content: message,
    delivery_status: result.delivery_status,
    twilio_message_sid: result.messageId || null,
    failure_reason: result.error || null,
  })

  return result
}
