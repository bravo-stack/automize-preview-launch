import { sendWhatsAppMessage } from '@/lib/actions/whatsapp'
import { createAdminClient } from '@/lib/db/admin'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// GET /api/whatsapp/late-response
// ============================================================================
// Cron endpoint that monitors communication_reports and sends WhatsApp alerts
// for clients that haven't received responses within the configured timeframe
//
// Based on Discord late response implementation with work hours detection
// No separate database table needed - queries communication_reports directly
//
// Called by: Private server cron job (every 15 minutes during work hours)
// Auth: Cron secret key in query params
// ============================================================================

/**
 * Check if current time is within work hours (Monday-Friday, 9 AM - 5 PM UTC)
 */
function isWithinWorkHours(): boolean {
  const now = new Date()
  const hour = now.getUTCHours()
  const dayOfWeek = now.getUTCDay() // 0 = Sunday, 6 = Saturday

  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
  const isWorkHours = hour >= 9 && hour < 17

  return isWeekday && isWorkHours
}

export async function GET(request: NextRequest) {
  // Validate cron secret
  const cronKey = request.nextUrl.searchParams.get('key')
  if (!cronKey || cronKey !== process.env.WHATSAPP_CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if within work hours (skip if outside)
  if (!isWithinWorkHours()) {
    return NextResponse.json({
      message: 'Outside work hours, alerts skipped',
      timestamp: new Date().toISOString(),
    })
  }

  const db = createAdminClient()
  const isTestMode = process.env.NODE_ENV === 'test'
  const config = {
    ALERT_THRESHOLD_HOURS: 1,
    LABELS: {
      DURATION_MESSAGE: '1 hour or more',
    },
  }

  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Fetch communication reports for channels needing response
    // Status "Client responded - awaiting team reply" means client sent a message
    // and team hasn't responded yet
    const { data: reports, error: fetchError } = await db
      .from('communication_reports')
      .select(
        `
        *,
        pod:guild_id(name, whatsapp_number, discord_id)
      `,
      )
      .eq('report_date', today)
      .eq('status', 'Client responded - awaiting team reply')
      .order('days_since_ixm_message', { ascending: false })

    if (fetchError) {
      console.error('Error fetching communication reports:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 },
      )
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({
        message: 'No channels needing response',
        timestamp: now.toISOString(),
      })
    }

    const results: {
      channelName: string
      pod: string
      hoursSinceLastResponse: number
      alertSent: boolean
      reason?: string
    }[] = []

    for (const report of reports) {
      const pod = Array.isArray(report.pod) ? report.pod[0] : report.pod

      if (!pod) {
        results.push({
          channelName: report.channel_name || 'Unknown',
          pod: 'Unknown',
          hoursSinceLastResponse: 0,
          alertSent: false,
          reason: 'No pod configuration found',
        })
        continue
      }

      // Skip if pod doesn't have WhatsApp number configured
      if (!pod.whatsapp_number) {
        results.push({
          channelName: report.channel_name || 'Unknown',
          pod: pod.name || 'Unknown',
          hoursSinceLastResponse: 0,
          alertSent: false,
          reason: 'No WhatsApp number configured for pod',
        })
        continue
      }

      // Calculate hours since last team response
      let hoursSinceResponse = 0

      if (report.last_ixm_message_at) {
        // Calculate based on actual timestamp
        hoursSinceResponse =
          (now.getTime() - new Date(report.last_ixm_message_at).getTime()) /
          (1000 * 60 * 60)
      } else if (report.days_since_ixm_message !== null) {
        // Fallback to days calculation
        hoursSinceResponse = report.days_since_ixm_message * 24
      }

      // Check if threshold exceeded
      if (hoursSinceResponse < config.ALERT_THRESHOLD_HOURS) {
        results.push({
          channelName: report.channel_name || 'Unknown',
          pod: pod.name || 'Unknown',
          hoursSinceLastResponse: hoursSinceResponse,
          alertSent: false,
          reason: `Threshold not exceeded (${hoursSinceResponse.toFixed(2)}h < ${config.ALERT_THRESHOLD_HOURS}h)`,
        })
        continue
      }

      // Build the alert message
      const alertMessage = [
        '🚨 *LATE RESPONSE ALERT*',
        '',
        `*Channel:* ${report.channel_name || 'Unknown'}`,
        `*Server:* ${report.guild_name || 'Unknown'}`,
        `*Client:* ${report.last_client_username || 'Unknown'}`,
        `*Duration:* ${config.LABELS.DURATION_MESSAGE}`,
        `*Hours since last response:* ${hoursSinceResponse.toFixed(1)}h`,
        '',
        `*Pod:* ${pod.name || 'Unknown'}`,
        `Please investigate and respond immediately.`,
        '',
        `_Last client message: ${report.last_client_message_at ? new Date(report.last_client_message_at).toLocaleString('en-US', { timeZone: 'UTC' }) : 'Unknown'}_`,
      ].join('\n')

      // Send WhatsApp alert
      const sendResult = await sendWhatsAppMessage(
        pod.whatsapp_number,
        alertMessage,
      )

      results.push({
        channelName: report.channel_name || 'Unknown',
        pod: pod.name || 'Unknown',
        hoursSinceLastResponse: hoursSinceResponse,
        alertSent: sendResult.success,
        reason: sendResult.error,
      })
    }

    return NextResponse.json({
      message: 'Late response alerts processed',
      mode: isTestMode ? 'TEST' : 'PRODUCTION',
      threshold: `${config.ALERT_THRESHOLD_HOURS}h`,
      workHours: true,
      timestamp: now.toISOString(),
      alertsSent: results.filter((r) => r.alertSent).length,
      totalChecked: results.length,
      results,
    })
  } catch (error) {
    console.error('Late response alert error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
