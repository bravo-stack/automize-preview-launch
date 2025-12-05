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
// Test WhatsApp Job - Sends all notifications to hardcoded test number
// ============================================================================

const TEST_NUMBER = '+2349048188177'

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

        const customHeader = await getMessageHeader(
          summaryConfig,
          defaultHeader,
        )
        const batchHeader =
          batches.length > 1 && !summaryConfig.custom_message_header
            ? `${customHeader} (${i + 1}/${batches.length})`
            : customHeader

        const summaryMessage = formatSummaryMessage(batchHeader, batch)

        const summaryResult = await sendWhatsAppMessage(
          podWhatsappNumber ?? TEST_NUMBER,
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
    // 2. LATE RESPONSE ALERTS - Channels needing urgent response
    // ========================================================================
    console.log('\n[LATE RESPONSE ALERTS] Checking...')

    const lateAlertConfig = await getActiveConfig(podName, 'late_alert')

    if (!lateAlertConfig) {
      console.log('[LATE RESPONSE ALERTS] Feature disabled - no active config')
      results.push({
        type: 'Late Response Alerts',
        sent: false,
        preview: 'Feature disabled - no active configuration',
      })
    } else if (!shouldRunNow(lateAlertConfig)) {
      console.log('[LATE RESPONSE ALERTS] Skipping - not scheduled to run now')
      results.push({
        type: 'Late Response Alerts',
        sent: false,
        preview: 'Skipped - not scheduled for this time/day',
      })
    } else {
      const now = new Date()
      const ALERT_THRESHOLD_HOURS = 1 // 1 hour threshold

      const { data: lateReports } = await db
        .from('communication_reports')
        .select('*')
        .in('guild_id', podServers ?? [])
        .eq('status', 'Client responded - awaiting team reply')
        .order('days_since_ixm_message', { ascending: false })

      const lateResponseAlerts: string[] = []

      for (const report of lateReports || []) {
        let hoursSinceResponse = 0

        if (report.last_ixm_message_at) {
          hoursSinceResponse =
            (now.getTime() - new Date(report.last_ixm_message_at).getTime()) /
            (1000 * 60 * 60)
        } else if (report.days_since_ixm_message !== null) {
          hoursSinceResponse = report.days_since_ixm_message * 24
        }

        if (hoursSinceResponse >= ALERT_THRESHOLD_HOURS) {
          lateResponseAlerts.push(
            `${report.channel_name || 'Unknown'} - ${hoursSinceResponse.toFixed(1)}h (${report.guild_name || 'Unknown'})`,
          )
        }
      }

      console.log(
        `[LATE RESPONSE ALERTS] ${lateResponseAlerts.length} alerts triggered`,
      )

      if (lateResponseAlerts.length > 0) {
        // Batch alerts to avoid message length issues
        const ALERT_BATCH_SIZE = 10
        const alertBatches: string[][] = []
        for (let i = 0; i < lateResponseAlerts.length; i += ALERT_BATCH_SIZE) {
          alertBatches.push(lateResponseAlerts.slice(i, i + ALERT_BATCH_SIZE))
        }

        for (let i = 0; i < alertBatches.length; i++) {
          const batch = alertBatches[i]
          const defaultHeader = '🚨 *LATE RESPONSE ALERTS*'
          const customHeader = getMessageHeader(lateAlertConfig, defaultHeader)

          const lateResponseMessage = [
            customHeader,
            '',
            `*Pod:* ${podName}`,
            `*Threshold:* ${ALERT_THRESHOLD_HOURS} hour(s)`,
            alertBatches.length > 1
              ? `*Batch:* ${i + 1}/${alertBatches.length}`
              : '',
            '',
            '*Channels needing urgent response:*',
            ...batch.map((alert) => `• ${alert}`),
            '',
            '_Please respond immediately._',
          ]
            .filter(Boolean)
            .join('\n')

          const lateResponseResult = await sendWhatsAppMessage(
            podWhatsappNumber ?? TEST_NUMBER,
            lateResponseMessage,
          )

          if (!lateResponseResult.success) {
            console.error(
              `[LATE RESPONSE ALERTS] Failed to send batch ${i + 1}:`,
              lateResponseResult.error,
            )
          }

          results.push({
            type: `Late Response Alerts${alertBatches.length > 1 ? ` (${i + 1}/${alertBatches.length})` : ''}`,
            sent: lateResponseResult.success,
            preview:
              lateResponseMessage.substring(0, 100) +
              (lateResponseMessage.length > 100 ? '...' : ''),
            error: lateResponseResult.error,
          })

          if (lateResponseResult.success) messagesSent++

          // Add small delay between batches
          if (i < alertBatches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }

        // Mark config as sent
        await markConfigAsSent(lateAlertConfig.id)
      } else {
        results.push({
          type: 'Late Response Alerts',
          sent: true,
          preview: 'No late responses detected',
        })
      }
    }

    // ========================================================================
    // 3. AD ACCOUNT ERRORS - Alert about unresolved errors
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
              pod?.whatsapp_number ?? TEST_NUMBER,
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
