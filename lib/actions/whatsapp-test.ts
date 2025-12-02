'use server'

import { createAdminClient } from '@/lib/db/admin'
import { formatSummaryMessage } from '@/lib/utils/whatsapp-formatters'
import { sendWhatsAppMessage } from './whatsapp'
import { createSchedule } from './whatsapp-schedules'

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
): Promise<TestJobResult> {
  const db = createAdminClient()
  const results: TestJobResult['results'] = []
  let messagesSent = 0

  try {
    // Get pod info
    const { data: pod } = await db
      .from('pod')
      .select('name, servers')
      .eq('name', podName)
      .single()

    if (!pod) {
      return {
        success: false,
        messagesSent: 0,
        results: [
          {
            type: 'error',
            sent: false,
            preview: 'Pod not found',
          },
        ],
      }
    }

    // ========================================================================
    // 1. SCHEDULED SUMMARY - Clients needing response
    // ========================================================================

    const today = new Date().toISOString().split('T')[0]
    const serverIds = pod.servers || []

    const { data: reports } = await db
      .from('communication_reports')
      .select(
        'channel_name, days_since_ixm_message, guild_name, guild_id, category_name',
      )
      //   .eq('report_date', today)
      .in('guild_id', serverIds)
      //   .gt('days_since_ixm_message', 1) // More than 1 day since team response
      .in('status', [
        'Client responded - awaiting team reply',
        // `IXM didn't reach out for 48 hours`,
      ])
      .limit(20)
      .order('days_since_ixm_message', { ascending: false })

    // const uniquePods = Array.from(
    //   new Map(reports?.map((p) => [p.guild_id, p]) || []).values(),
    // )

    const clientsNeedingResponse = (reports || []).map(
      (r) => `${r?.category_name ?? 'category name'} - ${r?.guild_name ?? ''}`,
    )

    const summaryMessage = formatSummaryMessage(
      'DAILY SUMMARY - Clients needing response:',
      clientsNeedingResponse,
    )

    const summaryResult = await sendWhatsAppMessage(TEST_NUMBER, summaryMessage)
    results.push({
      type: 'Scheduled Summary',
      sent: summaryResult.success,
      preview:
        summaryMessage.substring(0, 100) +
        (summaryMessage.length > 100 ? '...' : ''),
      error: summaryResult.error,
    })
    if (summaryResult.success) messagesSent++

    // ========================================================================
    // 2. AD ACCOUNT ERRORS - Alert about unresolved errors
    // ========================================================================

    // fetch refreshed sheet from db
    const { data: sheetData } = await db
      .from('refresh_snapshot_metrics')
      .select(
        'id, snapshot_id, is_error, error_detail, pod (name), sheet_refresh_snapshots(sheet_id, data_preset, refresh_type, snapshot_date)',
      )
      .eq('is_error', true)
      .eq('pod.name', podName)
      .order('created_at', { ascending: false })

    // Fetch clients associated with this pod
    const { data: clients } = await db
      .from('client')
      .select('id, brand, phone_number')
      .eq('pod', podName)

    const clientIds = (clients || []).map((c) => c.id)

    if (sheetData && sheetData.length > 0) {
      for (const sheet of sheetData) {
        const pod = Array.isArray(sheet.pod) ? sheet.pod[0] : sheet.pod
        const sheetSnapshot = Array.isArray(sheet.sheet_refresh_snapshots)
          ? sheet.sheet_refresh_snapshots[0]
          : sheet.sheet_refresh_snapshots

        if (sheet.is_error) {
          const { success } = await createSchedule({
            pod_name: pod.name,
            frequency: 'daily',
            time: '09:00',
            timezone: 'UTC',
            custom_message: 'Check the following add account error',
            is_active: true,
          })
          const errorMessage = `Ad Account Error for ${sheetSnapshot.refresh_type === 'autometric' ? 'Facebook' : 'Finance'}-${sheetSnapshot.data_preset} Sheet; With Details As Follows. \n\n\nPod: ${pod.name}.\nGoogle Sheet ID: ${sheetSnapshot.sheet_id}.Date Refreshed: ${sheetSnapshot.snapshot_date} `

          const errorResult = await sendWhatsAppMessage(
            TEST_NUMBER,
            errorMessage,
          )
          results.push({
            type: `Ad Error - ${sheetSnapshot.refresh_type}`,
            sent: errorResult.success,
            preview:
              errorMessage.substring(0, 100) +
              (errorMessage.length > 100 ? '...' : ''),
            error: errorResult.error,
          })
          if (errorResult.success) messagesSent++
        } else {
          const { success } = await createSchedule({
            pod_name: pod.name,
            frequency: 'daily',
            time: '09:00',
            timezone: 'UTC',
            custom_message: 'Check the following add account error',
            is_active: false,
          })
        }
      }
    } else {
      results.push({
        type: 'Ad Errors',
        sent: true,
        preview: 'No unresolved ad account errors',
      })
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
