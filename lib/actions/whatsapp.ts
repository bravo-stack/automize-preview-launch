'use server'

import { createAdminClient } from '@/lib/db/admin'
import {
  delay,
  getStatusCallbackUrl,
  validateAndCleanPhoneNumber,
  WHATSAPP_RATE_LIMITS,
} from '@/lib/utils/whatsapp-helpers'
import type {
  WhatsAppMessageLogInput,
  WhatsAppSendResult,
  WhatsAppSourceFeature,
} from '@/types/whatsapp'
import twilio from 'twilio'

// ============================================================================
// WhatsApp Server Actions (via Twilio WhatsApp Business API)
// ============================================================================

export interface SendWhatsAppOptions {
  /** Include status callback URL for delivery tracking */
  trackDelivery?: boolean
  /** Skip validation (use with caution) */
  skipValidation?: boolean
}

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  options: SendWhatsAppOptions = { trackDelivery: true },
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

  // Validate and clean phone number
  const cleanTo = options.skipValidation
    ? to
        .replace('whatsapp:', '')
        .trim()
        .replace(/^(?!\+)/, '+')
    : validateAndCleanPhoneNumber(to)

  if (!cleanTo) {
    return {
      success: false,
      error: `Invalid phone number format: ${to}. Ensure numbers are in E.164 format (e.g., +14155238886)`,
    }
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

    // Build message options
    const messageOptions: {
      body: string
      from: string
      to: string
      statusCallback?: string
    } = {
      body: message,
      from: twilioFormattedFrom,
      to: twilioFormattedTo,
    }

    // Add status callback URL for delivery tracking
    if (options.trackDelivery) {
      const statusCallbackUrl = getStatusCallbackUrl()
      if (statusCallbackUrl) {
        messageOptions.statusCallback = statusCallbackUrl
      }
    }

    // Send WhatsApp message via Twilio
    const messageResponse = await client.messages.create(messageOptions)

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
  options: SendWhatsAppOptions = { trackDelivery: true },
): Promise<{ recipient: string; result: WhatsAppSendResult }[]> {
  const results: { recipient: string; result: WhatsAppSendResult }[] = []
  const { MESSAGE_DELAY_MS, BATCH_SIZE, BATCH_DELAY_MS } = WHATSAPP_RATE_LIMITS

  console.log(
    `[WhatsApp] Starting rate-limited send to ${recipients.length} recipients`,
  )

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]

    // Send the message
    const result = await sendWhatsAppMessage(recipient, message, options)
    results.push({ recipient, result })

    // Log progress every 10 messages
    if ((i + 1) % 10 === 0) {
      console.log(`[WhatsApp] Sent ${i + 1}/${recipients.length} messages`)
    }

    // Rate limiting: Add delay between messages
    if (i < recipients.length - 1) {
      // Check if we've completed a batch
      if ((i + 1) % BATCH_SIZE === 0) {
        console.log(
          `[WhatsApp] Batch of ${BATCH_SIZE} complete, pausing for ${BATCH_DELAY_MS}ms`,
        )
        await delay(BATCH_DELAY_MS)
      } else {
        // Standard delay between messages
        await delay(MESSAGE_DELAY_MS)
      }
    }
  }

  // Log summary
  const successCount = results.filter((r) => r.result.success).length
  const failCount = results.length - successCount
  console.log(
    `[WhatsApp] Completed: ${successCount} sent, ${failCount} failed out of ${recipients.length} total`,
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
  options: SendWhatsAppOptions = { trackDelivery: true },
): Promise<WhatsAppSendResult> {
  // Validate and clean phone number first
  const cleanTo = validateAndCleanPhoneNumber(to)

  // If invalid, log the failure and return early
  if (!cleanTo) {
    const failureResult: WhatsAppSendResult = {
      success: false,
      error: `Invalid phone number format: ${to}`,
    }

    await logWhatsAppMessage({
      pod_name: podName,
      recipient_name: recipientName || null,
      recipient_phone_number: to, // Log original for debugging
      source_feature: sourceFeature,
      message_content: message,
      delivery_status: 'failed',
      twilio_message_sid: null,
      failure_reason: failureResult.error,
    })

    return failureResult
  }

  // Send with validated number (skip validation since we already did it)
  const result = await sendWhatsAppMessage(cleanTo, message, {
    ...options,
    skipValidation: true,
  })

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

// ============================================================================
// Bulk Send with Logging (User-Centric)
// ============================================================================

export interface RecipientWithMetadata {
  phoneNumber: string
  podName: string
  recipientName?: string
}

/**
 * Send WhatsApp messages to multiple recipients with individual logging
 * Uses rate limiting and tracks delivery for each recipient
 */
export async function sendAndLogWhatsAppToMany(
  recipients: RecipientWithMetadata[],
  message: string,
  sourceFeature: WhatsAppSourceFeature,
): Promise<{ recipient: RecipientWithMetadata; result: WhatsAppSendResult }[]> {
  const results: {
    recipient: RecipientWithMetadata
    result: WhatsAppSendResult
  }[] = []
  const { MESSAGE_DELAY_MS, BATCH_SIZE, BATCH_DELAY_MS } = WHATSAPP_RATE_LIMITS

  console.log(
    `[WhatsApp] Starting rate-limited send with logging to ${recipients.length} recipients`,
  )

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]

    // Send and log the message
    const result = await sendAndLogWhatsAppMessage(
      recipient.phoneNumber,
      message,
      recipient.podName,
      sourceFeature,
      recipient.recipientName,
    )

    results.push({ recipient, result })

    // Log progress every 10 messages
    if ((i + 1) % 10 === 0) {
      console.log(`[WhatsApp] Sent ${i + 1}/${recipients.length} messages`)
    }

    // Rate limiting: Add delay between messages
    if (i < recipients.length - 1) {
      if ((i + 1) % BATCH_SIZE === 0) {
        console.log(
          `[WhatsApp] Batch of ${BATCH_SIZE} complete, pausing for ${BATCH_DELAY_MS}ms`,
        )
        await delay(BATCH_DELAY_MS)
      } else {
        await delay(MESSAGE_DELAY_MS)
      }
    }
  }

  // Log summary
  const successCount = results.filter((r) => r.result.success).length
  const failCount = results.length - successCount
  console.log(
    `[WhatsApp] Completed: ${successCount} sent, ${failCount} failed out of ${recipients.length} total`,
  )

  return results
}

// ============================================================================
// Status Management Utilities
// ============================================================================

/**
 * Manually fetch and update the status of a message from Twilio
 * Useful for checking on messages that may have stale statuses
 */
export async function refreshMessageStatus(
  twilioMessageSid: string,
): Promise<{ success: boolean; status?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    return { success: false, error: 'Twilio credentials not configured' }
  }

  try {
    const client = twilio(accountSid, authToken)
    const message = await client.messages(twilioMessageSid).fetch()

    // Update the database with the current status
    const db = createAdminClient()
    const { error: updateError } = await db
      .from('whatsapp_message_logs')
      .update({
        delivery_status: message.status,
        failure_reason: message.errorMessage || null,
      })
      .eq('twilio_message_sid', twilioMessageSid)

    if (updateError) {
      console.error('[WhatsApp] Failed to update message status:', updateError)
    }

    return {
      success: true,
      status: message.status,
    }
  } catch (error) {
    console.error('[WhatsApp] Failed to fetch message status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get delivery statistics for a pod's messages
 */
export async function getDeliveryStats(
  podName: string,
  daysBack: number = 7,
): Promise<{
  total: number
  delivered: number
  failed: number
  pending: number
  deliveryRate: number
}> {
  const db = createAdminClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)

  const { data: logs, error } = await db
    .from('whatsapp_message_logs')
    .select('delivery_status')
    .eq('pod_name', podName)
    .gte('sent_at', startDate.toISOString())

  if (error || !logs) {
    console.error('[WhatsApp] Failed to fetch delivery stats:', error)
    return { total: 0, delivered: 0, failed: 0, pending: 0, deliveryRate: 0 }
  }

  const total = logs.length
  const delivered = logs.filter(
    (l) => l.delivery_status === 'delivered' || l.delivery_status === 'read',
  ).length
  const failed = logs.filter(
    (l) =>
      l.delivery_status === 'failed' || l.delivery_status === 'undelivered',
  ).length
  const pending = logs.filter(
    (l) =>
      l.delivery_status === 'queued' ||
      l.delivery_status === 'sent' ||
      l.delivery_status === 'sending',
  ).length

  return {
    total,
    delivered,
    failed,
    pending,
    deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
  }
}

// Re-export helpers for use elsewhere
export {
  isValidPhoneNumberFormat,
  validateAndCleanPhoneNumber,
} from '@/lib/utils/whatsapp-helpers'
