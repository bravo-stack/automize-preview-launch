'use server'

import { createAdminClient } from '@/lib/db/admin'
import {
  getActiveConfig,
  getMessageHeader,
  markConfigAsSent,
  shouldRunNow,
} from '@/lib/utils/whatsapp-config'
import { formatSummaryMessage } from '@/lib/utils/whatsapp-formatters'
import { sendWhatsAppMessage } from './whatsapp'

// ============================================================================
// Test WhatsApp Job - Sends notifications using pod's configured number
// ============================================================================
// Note: Aborts if no WhatsApp number is configured for the pod
// ============================================================================

interface TestJobResult {
  success: boolean
  messagesSent: number
  results: {
    type: string
    sent: boolean
    preview: string
    error?: string
  }[]
}

export async function runTestWhatsAppJob(
  podName: string,
  podServers: string[],
  podWhatsappNumber: string | null,
): Promise<TestJobResult> {
  const db = createAdminClient()
  const results: TestJobResult['results'] = []
  let messagesSent = 0

  // Abort early if no WhatsApp number is configured
  if (!podWhatsappNumber || podWhatsappNumber.trim() === '') {
    console.log(
      `[WhatsApp Test] Aborted - No WhatsApp number configured for pod: ${podName}`,
    )
    return {
      success: false,
      messagesSent: 0,
      results: [
        {
          type: 'Configuration',
          sent: false,
          preview:
            'No WhatsApp number configured for this pod. Please add a WhatsApp number first.',
        },
      ],
    }
  }

  try {
    // ========================================================================
    // 1. SCHEDULED SUMMARY - Clients needing response
    // ========================================================================
    console.log('\n[SCHEDULED SUMMARY] Starting for pod:', podName)

    const summaryConfig = await getActiveConfig(podName, 'daily_summary')

    if (!summaryConfig) {
      console.log('[SCHEDULED SUMMARY] Feature disabled - no active config')
      results.push({
        type: 'Scheduled Summary',
        sent: false,
        preview: 'Feature disabled - no active configuration',
      })
    } else if (!shouldRunNow(summaryConfig)) {
      console.log('[SCHEDULED SUMMARY] Skipping - not scheduled to run now')
      results.push({
        type: 'Scheduled Summary',
        sent: false,
        preview: 'Skipped - not scheduled for this time/day',
      })
    } else {
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
        `[SCHEDULED SUMMARY] Found ${reports?.length || 0} reports needing response`,
      )

      const clientsNeedingResponse = (reports || []).map(
        (r) =>
          `${r?.category_name ?? 'category name'} - ${r?.guild_name ?? ''}`,
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

      console.log(`[SCHEDULED SUMMARY] Sending ${batches.length} batch(es)`)

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
            `[SCHEDULED SUMMARY] Failed to send batch ${i + 1}:`,
            summaryResult.error,
          )
        }

        results.push({
          type: `Scheduled Summary${batches.length > 1 ? ` (${i + 1}/${batches.length})` : ''}`,
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
    }

    // ========================================================================
    // 2. AD ACCOUNT ERRORS - Alert about unresolved errors
    // ========================================================================
    console.log('\n[AD ERRORS] Checking for pod:', podName)

    const adErrorConfig = await getActiveConfig(podName, 'ad_error')

    if (!adErrorConfig) {
      console.log('[AD ERRORS] Feature disabled - no active config')
      results.push({
        type: 'Ad Errors',
        sent: false,
        preview: 'Feature disabled - no active configuration',
      })
    } else if (!shouldRunNow(adErrorConfig)) {
      console.log('[AD ERRORS] Skipping - not scheduled to run now')
      results.push({
        type: 'Ad Errors',
        sent: false,
        preview: 'Skipped - not scheduled for this time/day',
      })
    } else {
      // fetch refreshed sheet from db
      const { data: sheetData, error: sheetError } = await db
        .from('refresh_snapshot_metrics')
        .select(
          `
        id, 
        snapshot_id, 
        is_error, 
        error_detail, 
        pod,
        pod_detail (
            name, 
            whatsapp_number
        ), 
        sheet_refresh_snapshots (
            sheet_id, 
            date_preset, 
            refresh_type, 
            snapshot_date
        )
    `,
        )
        .eq('is_error', true)
        // OPTIMIZATION: Filter by the local column 'pod' instead of the joined relationship
        // This is much faster because 'pod' is indexed on 'refresh_snapshot_metrics'
        .eq('pod', podName)
        .order('created_at', { ascending: false })
        .limit(4)

      console.log(sheetData, sheetError)

      console.log(`[AD ERRORS] Found ${sheetData?.length || 0} error sheets`)

      if (sheetData && sheetData.length > 0) {
        for (const sheet of sheetData) {
          // --- UPDATED SECTION START ---
          const podRelation = Array.isArray(sheet.pod_detail)
            ? sheet.pod_detail[0]
            : sheet.pod_detail

          // Construct pod object with fallback to raw text name
          const pod = {
            name: podRelation?.name || sheet.pod,
            whatsapp_number: podRelation?.whatsapp_number,
          }

          const sheetSnapshot = Array.isArray(sheet.sheet_refresh_snapshots)
            ? sheet.sheet_refresh_snapshots[0]
            : sheet.sheet_refresh_snapshots
          // --- UPDATED SECTION END ---

          if (sheet.is_error) {
            const defaultHeader = `⚠️ *Ad Account Error for ${sheetSnapshot.refresh_type === 'autometric' ? 'Facebook' : 'Finance'}-${sheetSnapshot?.date_preset} Sheet*`
            const customHeader = getMessageHeader(adErrorConfig, defaultHeader)

            const errorMessage = [
              customHeader,
              '',
              `*Pod:* ${pod.name}`, // Works even if pod is not in DB
              `*Google Sheet ID:* ${sheetSnapshot.sheet_id}`,
              `*Date Refreshed:* ${sheetSnapshot.snapshot_date}`,
              sheet.error_detail ? `*Error:* ${sheet.error_detail}` : '',
              '',
              '_Please check and resolve this issue._',
            ]
              .filter(Boolean)
              .join('\n')

            const errorResult = await sendWhatsAppMessage(
              pod?.whatsapp_number || podWhatsappNumber,
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
    }

    return {
      success: true,
      messagesSent,
      results,
    }
  } catch (error) {
    console.error('Test WhatsApp job error:', error)
    return {
      success: false,
      messagesSent,
      results: [
        ...results,
        {
          type: 'error',
          sent: false,
          preview: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    }
  }
}
