import {
  formatSummaryMessage,
  sendWhatsAppMessage,
} from '@/lib/actions/whatsapp'
import { createAdminClient } from '@/lib/db/admin'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// GET /api/whatsapp/scheduled-summary
// ============================================================================
// Cron endpoint that sends scheduled WhatsApp summaries to media buyers
// Lists clients that need to be responded to based on communication_reports
//
// Called by: Private server cron job (hourly)
// Auth: Cron secret key in query params
// ============================================================================

export async function GET(request: NextRequest) {
  // Validate cron secret
  const cronKey = request.nextUrl.searchParams.get('key')
  if (!cronKey || cronKey !== process.env.WHATSAPP_CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()

  try {
    // Get current time info for schedule matching
    // Note: Comparing UTC time to schedule.time since DB default timezone is UTC
    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()
    const currentDay = now.getUTCDay() // 0 = Sunday

    // Fetch active schedules with pod info
    const { data: schedules, error: scheduleError } = await db
      .from('whatsapp_schedules')
      .select('*, pod:pod_name(name, whatsapp_number, servers)')
      .eq('is_active', true)

    if (scheduleError) {
      console.error('Error fetching schedules:', scheduleError)
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 },
      )
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ message: 'No active schedules found' })
    }

    // Get today's date for communication reports
    const today = now.toISOString().split('T')[0]

    // Process each schedule
    const results: {
      pod: string
      sent: boolean
      clientCount: number
      error?: string
    }[] = []

    for (const schedule of schedules) {
      // Skip if no WhatsApp number configured
      if (!schedule.pod?.whatsapp_number) {
        results.push({
          pod: schedule.pod?.name || 'Unknown',
          sent: false,
          clientCount: 0,
          error: 'No WhatsApp number configured',
        })
        continue
      }

      // Check if this schedule should run now
      // Parse schedule time (e.g., "09:00")
      const [scheduleHour, scheduleMinute] = (schedule.time || '09:00')
        .split(':')
        .map(Number)

      // Simple time check (within 30-minute window)
      const hourMatches = currentHour === scheduleHour
      const minuteMatches = Math.abs(currentMinute - scheduleMinute) < 30

      if (!hourMatches || !minuteMatches) {
        continue // Skip, not time for this schedule
      }

      // Check day of week for weekly schedules
      if (schedule.frequency === 'weekly' || schedule.frequency === 'custom') {
        const daysOfWeek = schedule.days_of_week || [1, 2, 3, 4, 5] // Default Mon-Fri
        if (!daysOfWeek.includes(currentDay)) {
          continue // Skip, not the right day
        }
      }

      // Fetch clients needing response for this pod's servers
      const serverIds = schedule.pod?.servers || []

      const { data: reports } = await db
        .from('communication_reports')
        .select('channel_name, days_since_ixm_message, guild_name')
        .eq('report_date', today)
        .in('guild_id', serverIds)
        .gt('days_since_ixm_message', 1) // More than 1 day since team response
        .order('days_since_ixm_message', { ascending: false })

      const clientsNeedingResponse = (reports || []).map(
        (r) => `${r.channel_name} (${r.days_since_ixm_message}d)`,
      )

      // Format and send the message
      const message = formatSummaryMessage(
        schedule.custom_message || 'Clients needing response:',
        clientsNeedingResponse,
      )

      const sendResult = await sendWhatsAppMessage(
        schedule.pod.whatsapp_number,
        message,
      )

      results.push({
        pod: schedule.pod.name,
        sent: sendResult.success,
        clientCount: clientsNeedingResponse.length,
        error: sendResult.error,
      })

      // Update last_sent_at on the schedule
      await db
        .from('whatsapp_schedules')
        .update({ last_sent_at: now.toISOString() })
        .eq('id', schedule.id)
    }

    return NextResponse.json({
      message: 'Scheduled summaries processed',
      results,
    })
  } catch (error) {
    console.error('Scheduled summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
