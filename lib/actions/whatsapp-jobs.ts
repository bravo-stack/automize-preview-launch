'use server'

import { createAdminClient } from '@/lib/db/admin'
import {
  getActiveConfig,
  getMessageHeader,
  markConfigAsSent,
  shouldRunNow,
} from '@/lib/utils/whatsapp-config'
import { formatSummaryMessage } from '@/lib/utils/whatsapp-formatters'
import type { WaFeatureType } from '@/types/whatsapp'
import { sendWhatsAppMessage } from './whatsapp'

// ============================================================================
// WhatsApp Cron Jobs - Production-ready with pod_whatsapp_configs
// ============================================================================

interface JobResult {
  success: boolean
  messagesSent: number
  results: {
    type: string
    sent: boolean
    preview: string
    error?: string
  }[]
}

/**
 * Run WhatsApp job for all pods with active configs
 * Called by cron endpoints
 */
export async function runWhatsAppJobForAllPods(
  featureType: WaFeatureType,
): Promise<JobResult> {
  const db = createAdminClient()
  const results: JobResult['results'] = []
  let messagesSent = 0

  try {
    // Get all pods
    const { data: pods } = await db
      .from('pod')
      .select('name, servers, whatsapp_number')
      .not('whatsapp_number', 'is', null)

    if (!pods || pods.length === 0) {
      return {
        success: true,
        messagesSent: 0,
        results: [
          {
            type: featureType,
            sent: false,
            preview: 'No pods with WhatsApp numbers configured',
          },
        ],
      }
    }

    // Process each pod
    for (const pod of pods) {
      const podResult = await runWhatsAppJobForPod(
        pod.name,
        pod.servers || [],
        pod.whatsapp_number,
        featureType,
      )

      results.push(...podResult.results)
      messagesSent += podResult.messagesSent
    }

    return {
      success: true,
      messagesSent,
      results,
    }
  } catch (error) {
    console.error(`[WhatsApp Job] Error running ${featureType}:`, error)
    return {
      success: false,
      messagesSent,
      results: [
        ...results,
        {
          type: featureType,
          sent: false,
          preview: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    }
  }
}

/**
 * Run WhatsApp job for a specific pod
 */
export async function runWhatsAppJobForPod(
  podName: string,
  podServers: string[],
  podWhatsappNumber: string | null,
  featureType: WaFeatureType,
): Promise<JobResult> {
  const db = createAdminClient()
  const results: JobResult['results'] = []
  let messagesSent = 0

  if (!podWhatsappNumber) {
    return {
      success: false,
      messagesSent: 0,
      results: [
        {
          type: featureType,
          sent: false,
          preview: `No WhatsApp number configured for ${podName}`,
        },
      ],
    }
  }

  try {
    switch (featureType) {
      case 'daily_summary':
        return await runDailySummaryJob(podName, podServers, podWhatsappNumber)
      case 'ad_error':
        return await runAdErrorJob(podName, podWhatsappNumber)
      default:
        return {
          success: false,
          messagesSent: 0,
          results: [
            {
              type: featureType,
              sent: false,
              preview: `Unknown feature type: ${featureType}`,
            },
          ],
        }
    }
  } catch (error) {
    console.error(`[WhatsApp Job] Error for pod ${podName}:`, error)
    return {
      success: false,
      messagesSent: 0,
      results: [
        {
          type: featureType,
          sent: false,
          preview: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    }
  }
}

/**
 * Daily Summary Job - Clients needing response
 */
async function runDailySummaryJob(
  podName: string,
  podServers: string[],
  podWhatsappNumber: string,
): Promise<JobResult> {
  const db = createAdminClient()
  const results: JobResult['results'] = []
  let messagesSent = 0

  console.log('[DAILY SUMMARY] Starting for pod:', podName)

  const summaryConfig = await getActiveConfig(podName, 'daily_summary')

  if (!summaryConfig) {
    console.log('[DAILY SUMMARY] Feature disabled - no active config')
    return {
      success: true,
      messagesSent: 0,
      results: [
        {
          type: 'Daily Summary',
          sent: false,
          preview: 'Feature disabled - no active configuration',
        },
      ],
    }
  }

  if (!(await shouldRunNow(summaryConfig))) {
    console.log('[DAILY SUMMARY] Skipping - not scheduled to run now')
    return {
      success: true,
      messagesSent: 0,
      results: [
        {
          type: 'Daily Summary',
          sent: false,
          preview: 'Skipped - not scheduled for this time/day',
        },
      ],
    }
  }

  const { data: reports } = await db
    .from('communication_reports')
    .select(
      'channel_name, days_since_ixm_message, guild_name, guild_id, category_name',
    )
    .in('guild_id', podServers ?? [])
    .in('status', ['Client responded - awaiting team reply'])
    .order('days_since_ixm_message', { ascending: false })
    .limit(20)

  console.log(
    `[DAILY SUMMARY] Found ${reports?.length || 0} reports needing response`,
  )

  const clientsNeedingResponse = (reports || []).map(
    (r) => `${r?.category_name ?? 'category name'} - ${r?.guild_name ?? ''}`,
  )

  // Batch messages to avoid concatenation length issues (WhatsApp limit ~4096 chars)
  const BATCH_SIZE = 15
  const batches: string[][] = []
  for (let i = 0; i < clientsNeedingResponse.length; i += BATCH_SIZE) {
    batches.push(clientsNeedingResponse.slice(i, i + BATCH_SIZE))
  }

  if (batches.length === 0) {
    batches.push([]) // Ensure at least one batch for "no clients" message
  }

  console.log(`[DAILY SUMMARY] Sending ${batches.length} batch(es)`)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const defaultHeader =
      batches.length > 1
        ? `DAILY SUMMARY - Clients needing response (${i + 1}/${batches.length}):`
        : 'DAILY SUMMARY - Clients needing response:'

    const customHeader = getMessageHeader(summaryConfig, defaultHeader)
    const batchHeader =
      batches.length > 1 && !summaryConfig.custom_message_header
        ? `${customHeader} (${i + 1}/${batches.length})`
        : customHeader

    const summaryMessage = formatSummaryMessage(batchHeader, batch)

    const summaryResult = await sendWhatsAppMessage(
      podWhatsappNumber,
      summaryMessage,
    )

    if (!summaryResult.success) {
      console.error(
        `[DAILY SUMMARY] Failed to send batch ${i + 1}:`,
        summaryResult.error,
      )
    }

    results.push({
      type: `Daily Summary${batches.length > 1 ? ` (${i + 1}/${batches.length})` : ''}`,
      sent: summaryResult.success,
      preview:
        summaryMessage.substring(0, 100) +
        (summaryMessage.length > 100 ? '...' : ''),
      error: summaryResult.error,
    })

    if (summaryResult.success) messagesSent++

    // Add small delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  // Mark config as sent
  await markConfigAsSent(summaryConfig.id)

  return { success: true, messagesSent, results }
}

/**
 * Ad Error Job - Alert about unresolved errors
 */
async function runAdErrorJob(
  podName: string,
  podWhatsappNumber: string,
): Promise<JobResult> {
  const db = createAdminClient()
  const results: JobResult['results'] = []
  let messagesSent = 0

  console.log('[AD ERRORS] Checking for pod:', podName)

  const adErrorConfig = await getActiveConfig(podName, 'ad_error')

  if (!adErrorConfig) {
    console.log('[AD ERRORS] Feature disabled - no active config')
    return {
      success: true,
      messagesSent: 0,
      results: [
        {
          type: 'Ad Errors',
          sent: false,
          preview: 'Feature disabled - no active configuration',
        },
      ],
    }
  }

  if (!(await shouldRunNow(adErrorConfig))) {
    console.log('[AD ERRORS] Skipping - not scheduled to run now')
    return {
      success: true,
      messagesSent: 0,
      results: [
        {
          type: 'Ad Errors',
          sent: false,
          preview: 'Skipped - not scheduled for this time/day',
        },
      ],
    }
  }

  // fetch refreshed sheet from db
  const { data: sheetData } = await db
    .from('refresh_snapshot_metrics')
    .select(
      'id, snapshot_id, is_error, error_detail, pod (name, whatsapp_number), sheet_refresh_snapshots(sheet_id, data_preset, refresh_type, snapshot_date)',
    )
    .eq('is_error', true)
    .eq('pod.name', podName)
    .order('created_at', { ascending: false })

  console.log(`[AD ERRORS] Found ${sheetData?.length || 0} error sheets`)

  if (sheetData && sheetData.length > 0) {
    for (const sheet of sheetData) {
      const pod = Array.isArray(sheet.pod) ? sheet.pod[0] : sheet.pod
      const sheetSnapshot = Array.isArray(sheet.sheet_refresh_snapshots)
        ? sheet.sheet_refresh_snapshots[0]
        : sheet.sheet_refresh_snapshots

      if (sheet.is_error) {
        const defaultHeader = `⚠️ *Ad Account Error for ${sheetSnapshot.refresh_type === 'autometric' ? 'Facebook' : 'Finance'}-${sheetSnapshot.data_preset} Sheet*`
        const customHeader = getMessageHeader(adErrorConfig, defaultHeader)

        const errorMessage = [
          customHeader,
          '',
          `*Pod:* ${pod.name}`,
          `*Google Sheet ID:* ${sheetSnapshot.sheet_id}`,
          `*Date Refreshed:* ${sheetSnapshot.snapshot_date}`,
          sheet.error_detail ? `*Error:* ${sheet.error_detail}` : '',
          '',
          '_Please check and resolve this issue._',
        ]
          .filter(Boolean)
          .join('\n')

        const errorResult = await sendWhatsAppMessage(
          podWhatsappNumber,
          errorMessage,
        )

        if (!errorResult.success) {
          console.error(
            `[AD ERRORS] Failed to send notification for ${sheetSnapshot?.refresh_type}:`,
            errorResult.error,
          )
        }

        results.push({
          type: `Ad Error - ${sheetSnapshot.refresh_type}`,
          sent: errorResult.success,
          preview:
            errorMessage.substring(0, 100) +
            (errorMessage.length > 100 ? '...' : ''),
          error: errorResult.error,
        })
        if (errorResult.success) messagesSent++
      }
    }

    // Mark config as sent after processing all errors
    if (sheetData.some((s) => s.is_error)) {
      await markConfigAsSent(adErrorConfig.id)
    }
  } else {
    results.push({
      type: 'Ad Errors',
      sent: true,
      preview: 'No unresolved ad account errors',
    })
  }

  return { success: true, messagesSent, results }
}
