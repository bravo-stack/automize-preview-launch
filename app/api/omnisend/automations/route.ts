import { OmnisendClient } from '@/lib/services/omnisend-client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await OmnisendClient.request('/v5/automations')
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
