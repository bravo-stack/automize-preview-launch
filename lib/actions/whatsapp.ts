'use server'

import { createAdminClient } from '@/lib/db/admin'
import {
  delay,
  getStatusCallbackUrl,
  isValidStatusTransition,
  STALE_MESSAGE_THRESHOLD_MINUTES,
  SYNC_BATCH_SIZE,
  validateAndCleanPhoneNumber,
  WHATSAPP_RATE_LIMITS,
} from '@/lib/utils/whatsapp-helpers'
import type {
  WhatsAppDeliveryStatus,
  WhatsAppMessageLogInput,
  WhatsAppSendResult,
  WhatsAppSourceFeature,
  WhatsAppStatusHistoryInput,
  WhatsAppSyncJobResult,
} from '@/types/whatsapp'
import twilio from 'twilio'

// ============================================================================
// WhatsApp Server Actions (via Twilio WhatsApp Business API)
// ============================================================================

export interface SendWhatsAppOptions {
  // Include status callback URL for delivery tracking
  trackDelivery?: boolean
  // Skip validation (use with caution)
  skipValidation?: boolean
  // Use a pre-approved template instead of free-form message
  useTemplate?: boolean
  // Content SID for the template (required if useTemplate is true)
  contentSid?: string
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
    useTemplate: options.useTemplate ?? false,
  })

  try {
    // Initialize Twilio client
    const client = twilio(accountSid, authToken)

    // Build message options based on whether using template or free-form
    const baseOptions = {
      from: twilioFormattedFrom,
      to: twilioFormattedTo,
      ...(options.trackDelivery && getStatusCallbackUrl()
        ? { statusCallback: getStatusCallbackUrl() }
        : {}),
    }

    const messageOptions =
      options.useTemplate && options.contentSid
        ? {
            ...baseOptions,
            contentSid: options.contentSid,
            contentVariables: JSON.stringify({ '1': message }),
          }
        : {
            ...baseOptions,
            body: message,
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
      delivery_status: 'failed',
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
    delivery_status: result.delivery_status ?? 'failed', // Fallback to 'failed' if undefined
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

// ============================================================================
// Status History & Audit Trail
// ============================================================================

/**
 * Log a status change to the status history table for audit trail
 */
export async function logStatusHistory(
  input: WhatsAppStatusHistoryInput,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  const { error } = await db.from('whatsapp_status_history').insert({
    message_log_id: input.message_log_id,
    twilio_message_sid: input.twilio_message_sid,
    previous_status: input.previous_status,
    new_status: input.new_status,
    error_code: input.error_code || null,
    error_message: input.error_message || null,
    event_type: input.event_type || null,
  })

  if (error) {
    console.error('[WhatsApp] Failed to log status history:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get status history for a specific message
 */
export async function getMessageStatusHistory(
  twilioMessageSid: string,
): Promise<{
  success: boolean
  history?: Array<{
    previous_status: string | null
    new_status: string
    changed_at: string
    error_code: string | null
    event_type: string | null
  }>
  error?: string
}> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('whatsapp_status_history')
    .select('previous_status, new_status, changed_at, error_code, event_type')
    .eq('twilio_message_sid', twilioMessageSid)
    .order('changed_at', { ascending: true })

  if (error) {
    console.error('[WhatsApp] Failed to fetch status history:', error)
    return { success: false, error: error.message }
  }

  return { success: true, history: data || [] }
}

// ============================================================================
// Background Sync Job for Stale Messages
// ============================================================================

/**
 * Sync pending messages that haven't received status updates
 * This handles cases where callbacks were missed or delayed
 *
 * @param thresholdMinutes - Only sync messages older than this (default: 30 min)
 * @param batchSize - Maximum messages to process in one run (default: 50)
 */
export async function syncPendingMessageStatuses(
  thresholdMinutes: number = STALE_MESSAGE_THRESHOLD_MINUTES,
  batchSize: number = SYNC_BATCH_SIZE,
): Promise<WhatsAppSyncJobResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    console.error('[WhatsApp Sync] Twilio credentials not configured')
    return {
      processed: 0,
      updated: 0,
      failed: 0,
      errors: [
        { messageSid: 'N/A', error: 'Twilio credentials not configured' },
      ],
    }
  }

  const db = createAdminClient()
  const client = twilio(accountSid, authToken)

  // Calculate threshold timestamp
  const thresholdDate = new Date()
  thresholdDate.setMinutes(thresholdDate.getMinutes() - thresholdMinutes)

  // Query messages with pending status older than threshold
  const { data: pendingMessages, error: queryError } = await db
    .from('whatsapp_message_logs')
    .select('id, twilio_message_sid, delivery_status, sent_at')
    .in('delivery_status', ['queued', 'accepted', 'sending', 'sent'])
    .not('twilio_message_sid', 'is', null)
    .lt('sent_at', thresholdDate.toISOString())
    .limit(batchSize)

  if (queryError) {
    console.error(
      '[WhatsApp Sync] Failed to query pending messages:',
      queryError,
    )
    return {
      processed: 0,
      updated: 0,
      failed: 0,
      errors: [{ messageSid: 'N/A', error: queryError.message }],
    }
  }

  if (!pendingMessages || pendingMessages.length === 0) {
    console.log('[WhatsApp Sync] No stale pending messages found')
    return { processed: 0, updated: 0, failed: 0, errors: [] }
  }

  console.log(
    `[WhatsApp Sync] Found ${pendingMessages.length} stale messages to sync`,
  )

  const result: WhatsAppSyncJobResult = {
    processed: 0,
    updated: 0,
    failed: 0,
    errors: [],
  }

  // Process messages in parallel with concurrency control
  // This reduces total time from O(n * latency) to O(n / concurrency * latency)
  const CONCURRENCY_LIMIT = 10

  const processSingleMessage = async (msg: {
    id: number
    twilio_message_sid: string | null
    delivery_status: string
    sent_at: string
  }): Promise<{ updated: boolean; error?: string }> => {
    if (!msg.twilio_message_sid) {
      return { updated: false }
    }

    try {
      // Fetch current status from Twilio
      const twilioMessage = await client
        .messages(msg.twilio_message_sid)
        .fetch()
      const newStatus = twilioMessage.status as WhatsAppDeliveryStatus
      const currentStatus = msg.delivery_status as WhatsAppDeliveryStatus

      // Check if status actually changed and is a valid transition
      // CRITICAL: isValidStatusTransition prevents race condition where
      // cron could overwrite a 'read' status with 'delivered'
      if (
        newStatus !== currentStatus &&
        isValidStatusTransition(currentStatus, newStatus)
      ) {
        // Determine failure reason if applicable
        let failureReason: string | null = null
        if (newStatus === 'failed' || newStatus === 'undelivered') {
          failureReason =
            twilioMessage.errorMessage ||
            `Delivery failed with status: ${newStatus}${twilioMessage.errorCode ? ` (Error ${twilioMessage.errorCode})` : ''}`
        }

        // Update the message log with race condition protection
        // Only update if current DB status allows transition (prevents overwriting 'read' with 'delivered')
        const { error: updateError, count } = await db
          .from('whatsapp_message_logs')
          .update({
            delivery_status: newStatus,
            failure_reason: failureReason,
            status_updated_at: new Date().toISOString(),
            // Update read tracking if applicable
            ...(newStatus === 'read' && {
              is_read: true,
              read_at: new Date().toISOString(),
            }),
          })
          .eq('id', msg.id)
          // Race condition guard: don't overwrite terminal statuses
          .not('delivery_status', 'in', '("read","failed","undelivered")')

        if (updateError) {
          return { updated: false, error: updateError.message }
        }

        // Only log history if we actually updated (count > 0)
        if (count && count > 0) {
          await logStatusHistory({
            message_log_id: msg.id,
            twilio_message_sid: msg.twilio_message_sid,
            previous_status: currentStatus,
            new_status: newStatus,
            error_code: twilioMessage.errorCode?.toString() || null,
            error_message: twilioMessage.errorMessage || null,
            event_type: 'SYNC_JOB',
          })

          console.log(
            `[WhatsApp Sync] Updated ${msg.twilio_message_sid}: ${currentStatus} → ${newStatus}`,
          )
          return { updated: true }
        }
      }

      return { updated: false }
    } catch (error) {
      return {
        updated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Process in batches with concurrency control
  // Using chunked Promise.all to limit concurrent requests to Twilio
  const chunks: (typeof pendingMessages)[] = []
  for (let i = 0; i < pendingMessages.length; i += CONCURRENCY_LIMIT) {
    chunks.push(pendingMessages.slice(i, i + CONCURRENCY_LIMIT))
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map((msg) => processSingleMessage(msg)),
    )

    // Aggregate results
    for (let i = 0; i < chunkResults.length; i++) {
      result.processed++
      const res = chunkResults[i]
      if (res.updated) {
        result.updated++
      } else if (res.error) {
        result.failed++
        result.errors.push({
          messageSid: chunk[i].twilio_message_sid || 'unknown',
          error: res.error,
        })
      }
    }

    // Small delay between batches to avoid rate limiting
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await delay(200)
    }
  }

  console.log(
    `[WhatsApp Sync] Completed: ${result.processed} processed, ${result.updated} updated, ${result.failed} failed`,
  )

  return result
}

/**
 * Update message status with history tracking
 * Used by the status callback webhook for atomic updates
 */
export async function updateMessageStatusWithHistory(
  twilioMessageSid: string,
  newStatus: WhatsAppDeliveryStatus,
  options: {
    errorCode?: string
    errorMessage?: string
    eventType?: string
  } = {},
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  // Fetch current message state
  const { data: currentMessage, error: fetchError } = await db
    .from('whatsapp_message_logs')
    .select('id, delivery_status')
    .eq('twilio_message_sid', twilioMessageSid)
    .single()

  if (fetchError || !currentMessage) {
    // Message not found - could be a message we didn't track
    console.warn(`[WhatsApp] Message ${twilioMessageSid} not found in logs`)
    return { success: false, error: 'Message not found' }
  }

  const currentStatus = currentMessage.delivery_status as WhatsAppDeliveryStatus

  // Validate status transition (prevent out-of-order updates)
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    console.log(
      `[WhatsApp] Ignoring invalid transition: ${currentStatus} → ${newStatus} for ${twilioMessageSid}`,
    )
    return { success: true } // Not an error, just a no-op
  }

  // Skip if status hasn't changed
  if (currentStatus === newStatus) {
    return { success: true }
  }

  // Determine failure reason
  let failureReason: string | null = null
  if (newStatus === 'failed' || newStatus === 'undelivered') {
    failureReason =
      options.errorMessage ||
      `Delivery failed with status: ${newStatus}${options.errorCode ? ` (Error ${options.errorCode})` : ''}`
  }

  // Update the message log
  const { error: updateError } = await db
    .from('whatsapp_message_logs')
    .update({
      delivery_status: newStatus,
      failure_reason: failureReason,
      // Track read receipts
      ...(newStatus === 'read' && {
        is_read: true,
        read_at: new Date().toISOString(),
      }),
    })
    .eq('id', currentMessage.id)

  if (updateError) {
    console.error('[WhatsApp] Failed to update message status:', updateError)
    return { success: false, error: updateError.message }
  }

  // Log to status history for audit trail
  await logStatusHistory({
    message_log_id: currentMessage.id,
    twilio_message_sid: twilioMessageSid,
    previous_status: currentStatus,
    new_status: newStatus,
    error_code: options.errorCode || null,
    error_message: options.errorMessage || null,
    event_type: options.eventType || null,
  })

  return { success: true }
}

// ============================================================================
// On-Demand Sync Actions (Client-Safe)
// These actions can be called directly from the dashboard without cron auth
// ============================================================================

/**
 * Pending message summary for UI display
 */
export interface PendingMessageSummary {
  id: number
  twilio_message_sid: string
  pod_name: string
  recipient_name: string | null
  recipient_phone_number: string
  delivery_status: WhatsAppDeliveryStatus
  sent_at: string
  age_minutes: number
}

/**
 * Fetch messages with pending statuses that haven't been updated
 * Used by dashboard to display stale messages
 */
export async function getPendingMessages(
  thresholdMinutes: number = STALE_MESSAGE_THRESHOLD_MINUTES,
): Promise<{
  success: boolean
  messages: PendingMessageSummary[]
  error?: string
}> {
  const db = createAdminClient()

  // Calculate threshold timestamp
  const thresholdDate = new Date()
  thresholdDate.setMinutes(thresholdDate.getMinutes() - thresholdMinutes)

  const { data, error } = await db
    .from('whatsapp_message_logs')
    .select(
      'id, twilio_message_sid, pod_name, recipient_name, recipient_phone_number, delivery_status, sent_at',
    )
    .in('delivery_status', ['queued', 'accepted', 'sending', 'sent'])
    .not('twilio_message_sid', 'is', null)
    .lt('sent_at', thresholdDate.toISOString())
    .order('sent_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[WhatsApp] Failed to fetch pending messages:', error)
    return { success: false, messages: [], error: error.message }
  }

  // Calculate age for each message
  const now = new Date()
  const messagesWithAge: PendingMessageSummary[] = (data || []).map((msg) => ({
    ...msg,
    twilio_message_sid: msg.twilio_message_sid as string,
    delivery_status: msg.delivery_status as WhatsAppDeliveryStatus,
    age_minutes: Math.floor(
      (now.getTime() - new Date(msg.sent_at).getTime()) / 1000 / 60,
    ),
  }))

  return { success: true, messages: messagesWithAge }
}

/**
 * Sync a single message's status from Twilio
 * Used for per-message refresh button in UI
 */
export async function syncSingleMessageStatus(
  twilioMessageSid: string,
): Promise<{
  success: boolean
  newStatus?: WhatsAppDeliveryStatus
  previousStatus?: WhatsAppDeliveryStatus
  error?: string
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    return { success: false, error: 'Twilio credentials not configured' }
  }

  const db = createAdminClient()
  const client = twilio(accountSid, authToken)

  // Fetch current message from DB
  const { data: currentMessage, error: fetchError } = await db
    .from('whatsapp_message_logs')
    .select('id, delivery_status')
    .eq('twilio_message_sid', twilioMessageSid)
    .single()

  if (fetchError || !currentMessage) {
    return { success: false, error: 'Message not found in database' }
  }

  const previousStatus =
    currentMessage.delivery_status as WhatsAppDeliveryStatus

  try {
    // Fetch current status from Twilio
    const twilioMessage = await client.messages(twilioMessageSid).fetch()
    const newStatus = twilioMessage.status as WhatsAppDeliveryStatus

    // Check if status changed and is valid transition
    if (
      newStatus !== previousStatus &&
      isValidStatusTransition(previousStatus, newStatus)
    ) {
      // Determine failure reason if applicable
      let failureReason: string | null = null
      if (newStatus === 'failed' || newStatus === 'undelivered') {
        failureReason =
          twilioMessage.errorMessage ||
          `Delivery failed with status: ${newStatus}${twilioMessage.errorCode ? ` (Error ${twilioMessage.errorCode})` : ''}`
      }

      // Update the message log
      const { error: updateError } = await db
        .from('whatsapp_message_logs')
        .update({
          delivery_status: newStatus,
          failure_reason: failureReason,
          status_updated_at: new Date().toISOString(),
          ...(newStatus === 'read' && {
            is_read: true,
            read_at: new Date().toISOString(),
          }),
        })
        .eq('id', currentMessage.id)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Log to history
      await logStatusHistory({
        message_log_id: currentMessage.id,
        twilio_message_sid: twilioMessageSid,
        previous_status: previousStatus,
        new_status: newStatus,
        error_code: twilioMessage.errorCode?.toString() || null,
        error_message: twilioMessage.errorMessage || null,
        event_type: 'MANUAL_REFRESH',
      })

      return { success: true, newStatus, previousStatus }
    }

    // No change needed
    return { success: true, newStatus: previousStatus, previousStatus }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch from Twilio'
    return { success: false, error: errorMessage }
  }
}

/**
 * Sync all pending messages (batch operation)
 * Wrapper around syncPendingMessageStatuses for client use
 */
export async function syncAllPendingMessages(): Promise<WhatsAppSyncJobResult> {
  return syncPendingMessageStatuses()
}
