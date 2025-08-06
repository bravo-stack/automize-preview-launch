import { createAdminClient } from '@/lib/db/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportDate = searchParams.get('report_date')
    const guildId = searchParams.get('guild_id')

    if (!reportDate) {
      return NextResponse.json(
        { error: 'report_date parameter is required' },
        { status: 400 },
      )
    }

    const db = await createAdminClient()

    let query = db
      .from('communication_reports')
      .select('*')
      .eq('report_date', reportDate)
      .order('channel_name')

    if (guildId && guildId !== 'all') {
      query = query.eq('guild_id', guildId)
    }

    const { data: reports, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch communication reports' },
        { status: 500 },
      )
    }

    return NextResponse.json({ data: reports })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
