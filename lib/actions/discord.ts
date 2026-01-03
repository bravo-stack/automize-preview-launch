'use server'

import { createAdminClient } from '@/lib/db/admin'
import {
  DiscordMessagePayload,
  sendDiscordMessage as sendRawDiscordMessage,
} from '@/lib/discord'
import { DiscordMessageLogInput, DiscordSourceFeature } from '@/types/discord'

interface SendDiscordOptions {
  sourceFeature?: DiscordSourceFeature
  channelId?: string
  podName?: string
}

interface SendDiscordResult {
  success: boolean
  error?: string
  channelName?: string
  channelId?: string
}

type ExtendedPayload = DiscordMessagePayload & { channelName?: string }

// Overload signatures
export async function sendDiscordMessage(
  payload: ExtendedPayload,
): Promise<SendDiscordResult>

export async function sendDiscordMessage(
  channelName: string,
  message: string,
  options?: SendDiscordOptions,
): Promise<SendDiscordResult>

// Implementation
export async function sendDiscordMessage(
  arg1: string | DiscordMessagePayload,
  arg2?: string,
  arg3?: SendDiscordOptions,
): Promise<SendDiscordResult> {
  // 1. Handle New Payload Style
  if (typeof arg1 === 'object') {
    const payload = arg1 as DiscordMessagePayload & { channelName?: string }

    const channelId = payload.channelId
    const messageContent =
      payload.content ||
      (payload.embeds ? JSON.stringify(payload.embeds) : 'Empty Message')

    try {
      // Use the official raw sender
      const result = await sendRawDiscordMessage(payload)

      // Use the channel name from API response for accurate logging
      const resolvedChannelName = result.channel.name
      const resolvedChannelId = result.channel.id

      // Log success with actual channel name from API
      await logDiscordMessage({
        channel_name: resolvedChannelName,
        channel_id: resolvedChannelId,
        source_feature: 'other',
        message_content: messageContent,
        delivery_status: 'sent',
      })

      return {
        success: true,
        channelName: resolvedChannelName,
        channelId: resolvedChannelId,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(
        `Error sending Discord notification (ID: ${channelId}):`,
        error,
      )

      // Log failure
      await logDiscordMessage({
        channel_name: payload.channelName || `ID: ${channelId}`,
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
  const channelId = options?.channelId || null
  const podName = options?.podName || null

  // Only use channelName as channelId if it's a valid snowflake ID
  const effectiveChannelId =
    channelId || (isSnowflake(channelName) ? channelName : null)

  try {
    // Construct payload for the new API
    // Use channelId if we have a valid snowflake, otherwise use channelName
    const payload: DiscordMessagePayload = effectiveChannelId
      ? { channelId: effectiveChannelId, content: message }
      : { channelName: channelName, content: message }

    const result = await sendRawDiscordMessage(payload)

    // Use the channel name from API response for accurate logging
    const resolvedChannelName = result.channel.name
    const resolvedChannelId = result.channel.id

    await logDiscordMessage({
      channel_name: resolvedChannelName,
      channel_id: resolvedChannelId,
      pod_name: podName,
      source_feature: sourceFeature,
      message_content: message,
      delivery_status: 'sent',
    })

    return {
      success: true,
      channelName: resolvedChannelName,
      channelId: resolvedChannelId,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(
      `Error sending message to Discord channel "${channelName}":`,
      error,
    )

    await logDiscordMessage({
      channel_name: channelName,
      channel_id: effectiveChannelId, // null if channelName wasn't a snowflake
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
