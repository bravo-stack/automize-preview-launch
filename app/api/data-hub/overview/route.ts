import { getDataHubOverview } from '@/lib/services/data-hub'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const overview = await getDataHubOverview()
    return NextResponse.json({ success: true, data: overview })
  } catch (error) {
    console.error('Error fetching data hub overview:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch overview',
      },
      { status: 500 },
    )
  }
}
