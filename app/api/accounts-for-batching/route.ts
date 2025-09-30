import { createClient } from '@/lib/db/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { status } = await request.json()

    const db = createClient()

    // Fetch accounts based on status - using 'clients' table to match existing API behavior
    const { data: accounts, error } = await db
      .from('clients')
      .select('id, brand, pod, fb_key, store_id, shopify_key, rebill_date')
      .order('brand')
      .neq('store_id', null)
      .eq('status', status || 'active')

    if (error || !accounts) {
      console.error('Error fetching accounts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch accounts data' },
        { status: 500 },
      )
    }

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
