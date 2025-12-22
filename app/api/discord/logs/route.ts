import { createAdminClient } from '@/lib/db/admin'
import { createClient } from '@/lib/db/server'
import type { DiscordMessageLog } from '@/types/discord'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const authDb = createClient()
    const db = await createAdminClient()

    const {
      data: { user },
    } = await authDb.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = user?.user_metadata?.role ?? 'exec'
    const { searchParams } = new URL(request.url)
    const podName = searchParams.get('pod_name')
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const limit = searchParams.get('limit') || '100'

    // Get user's pod if not exec
    let userPodName: string | null = null
    if (role !== 'exec') {
      const { data: pod } = await db
        .from('pod')
        .select('name')
        .eq('user_id', user.id)
        .single()
      userPodName = pod?.name || null
    }

    // Build query
    let query = db
      .from('discord_message_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(parseInt(limit))

    // Filter by pod if user is not exec or if pod_name parameter is provided
    if (role !== 'exec' && userPodName) {
      query = query.eq('pod_name', userPodName)
    } else if (podName) {
      query = query.eq('pod_name', podName)
    }

    // Apply additional filters
    if (status) {
      query = query.eq('delivery_status', status)
    }
    if (source) {
      query = query.eq('source_feature', source)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('Error fetching Discord logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch logs' },
        { status: 500 },
      )
    }

    return NextResponse.json({ logs: logs as DiscordMessageLog[] })
  } catch (error) {
    console.error('Error in Discord logs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
