'use server'

import { createAdminClient } from '@/lib/db/admin'
import {
  sendDiscordMessage as sendRawDiscordMessage,
  DiscordMessagePayload,
} from '@/lib/discord'
import { DiscordMessageLogInput, DiscordSourceFeature } from '@/types/discord'

const DISCORD_API_URL = 'https://ixm-bot.onrender.com/api/sendMessage'

interface SendDiscordOptions {
  sourceFeature?: DiscordSourceFeature
  channelId?: string
  podName?: string
}

// Overload signatures
export async function sendDiscordMessage(
  payload: DiscordMessagePayload,
): Promise<{ success: boolean; error?: string }>

export async function sendDiscordMessage(
  channelName: string,
  message: string,
  options?: SendDiscordOptions,
): Promise<{ success: boolean; error?: string }>

// Implementation
export async function sendDiscordMessage(
  arg1: string | DiscordMessagePayload,
  arg2?: string,
  arg3?: SendDiscordOptions,
): Promise<{ success: boolean; error?: string }> {
  // 1. Handle New Payload Style
  if (typeof arg1 === 'object') {
    const payload = arg1
    const channelId = payload.channelId
    // Extract a summary for logging
    const messageContent =
      payload.content ||
      (payload.embeds ? JSON.stringify(payload.embeds) : 'Empty Message')

    try {
      // Use the official raw sender
      const result = await sendRawDiscordMessage(payload)

      // Log success
      await logDiscordMessage({
        channel_name: 'ID: ' + channelId, // We might not have a name for ID-based calls
        channel_id: channelId,
        source_feature: 'other', // We could add a way to pass this in payload if needed
        message_content: messageContent,
        delivery_status: 'sent',
      })

      return { success: true }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Error sending Discord notification (ID: ${channelId}):`, error)

      // Log failure
      await logDiscordMessage({
        channel_name: 'ID: ' + channelId,
        channel_id: channelId,
        source_feature: 'other',
        message_content: messageContent,
        delivery_status: 'failed',
        failure_reason: errorMsg,
      })

      return { success: false, error: errorMsg }
    }
  }

  // 2. Handle Legacy Style (channelName, message)
  const channelName = arg1
  const message = arg2 || ''
  const options = arg3

  const sourceFeature = options?.sourceFeature || 'other'
  const channelId = options?.channelId || null // Legacy options might provide an ID
  const podName = options?.podName || null

  // If we have a channelId in options, use it.
  // If not, we have to rely on the channelName.
  // The new API REQUIRES a channelId.
  // If channelName LOOKS like an ID (snowflake), use it as channelId.
  // Otherwise, we might be in trouble if the new API strictly requires IDs.
  // We'll attempt to use channelName as channelId if no explicit ID is provided.
  const effectiveChannelId = channelId || (isSnowflake(channelName) ? channelName : channelName)

  try {
    // Construct payload for the new API
    const payload: DiscordMessagePayload = {
      channelId: effectiveChannelId,
      content: message,
    }

    const result = await sendRawDiscordMessage(payload)

    await logDiscordMessage({
      channel_name: channelName,
      channel_id: effectiveChannelId,
      pod_name: podName,
      source_feature: sourceFeature,
      message_content: message,
      delivery_status: 'sent',
    })

    return { success: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(
      `Error sending message to Discord channel "${channelName}":`,
      error,
    )

    await logDiscordMessage({
      channel_name: channelName,
      channel_id: effectiveChannelId,
      pod_name: podName,
      source_feature: sourceFeature,
      message_content: message,
      delivery_status: 'failed',
      failure_reason: errorMsg,
    })

    return { success: false, error: errorMsg }
  }
}

function isSnowflake(id: string): boolean {
  // Basic check: numeric and long enough (17-19 chars usually)
  return /^\d{17,19}$/.test(id)
}

export async function logDiscordMessage(
  input: DiscordMessageLogInput,
): Promise<{ success: boolean; error?: string }> {
  const db = createAdminClient()

  const { error } = await db.from('discord_message_logs').insert({
    channel_name: input.channel_name,
    channel_id: input.channel_id || null,
    pod_name: input.pod_name || null,
    source_feature: input.source_feature,
    message_content: input.message_content || null,
    delivery_status: input.delivery_status,
    failure_reason: input.failure_reason || null,
  })

  if (error) {
    console.error('[Discord] Failed to log message:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}