import { createAdminClient } from '@/lib/db/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const db = await createAdminClient()

    // Get all available report dates
    const { data: reportDates } = await db
      .from('communication_reports')
      .select('report_date')
      .order('report_date', { ascending: false })

    const uniqueDates = Array.from(
      new Set(reportDates?.map((r) => r.report_date) || []),
    )

    // Get all available pods/guilds
    const { data: pods } = await db
      .from('communication_reports')
      .select('guild_name, guild_id')
      .not('guild_name', 'is', null)
      .order('guild_name')

    const uniquePods = Array.from(
      new Map(pods?.map((p) => [p.guild_id, p]) || []).values(),
    )

    // Get the latest report date
    const latestDate = uniqueDates.length > 0 ? uniqueDates[0] : null

    return NextResponse.json({
      dates: uniqueDates,
      pods: uniquePods,
      latestDate,
      hasData: uniqueDates.length > 0,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
