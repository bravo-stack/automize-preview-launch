'use server'

import { createAdminClient } from '@/lib/db/admin'
import {
  formatAdErrorMessage,
  formatSummaryMessage,
} from '@/lib/utils/whatsapp-formatters'
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
      .select('channel_name, days_since_ixm_message, guild_name')
      .eq('report_date', today)
      .in('guild_id', serverIds)
      .gt('days_since_ixm_message', 1) // More than 1 day since team response
      .order('days_since_ixm_message', { ascending: false })

    console.log('📊 Debug - Communication Reports:', {
      today,
      serverIds,
      totalReports: reports?.length || 0,
      reports: reports?.slice(0, 5), // Show first 5
    })

    const clientsNeedingResponse = (reports || []).map(
      (r) => `${r.channel_name} (${r.days_since_ixm_message}d)`,
    )

    const summaryMessage = formatSummaryMessage(
      '📋 DAILY SUMMARY - Clients needing response:',
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

    // Fetch clients associated with this pod
    const { data: clients } = await db
      .from('client')
      .select('id, brand, phone_number')
      .eq('pod', podName)

    const clientIds = (clients || []).map((c) => c.id)

    if (clientIds.length > 0) {
      // Fetch unresolved ad errors for these clients
      const { data: errors } = await db
        .from('ad_account_errors')
        .select(
          `
          *,
          client:client_id(
            id,
            brand,
            phone_number,
            pod
          )
        `,
        )
        .in('client_id', clientIds)
        .eq('is_resolved', false)

      if (errors && errors.length > 0) {
        const now = new Date()

        for (const error of errors) {
          const client = error.client
          if (!client) continue

          const firstDetected = new Date(error.first_detected_at)
          const daysSinceDetected = Math.floor(
            (now.getTime() - firstDetected.getTime()) / (1000 * 60 * 60 * 24),
          )

          const errorMessage = formatAdErrorMessage(
            client.brand,
            error.error_type,
            daysSinceDetected,
          )

          const errorResult = await sendWhatsAppMessage(
            TEST_NUMBER,
            errorMessage,
          )
          results.push({
            type: `Ad Error - ${client.brand}`,
            sent: errorResult.success,
            preview:
              errorMessage.substring(0, 100) +
              (errorMessage.length > 100 ? '...' : ''),
            error: errorResult.error,
          })
          if (errorResult.success) messagesSent++
        }
      } else {
        results.push({
          type: 'Ad Errors',
          sent: true,
          preview: '✅ No unresolved ad account errors',
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
