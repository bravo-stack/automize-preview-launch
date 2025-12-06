import { saveCVRMetrics } from '@/lib/services/cvr-sheets'
import type { SaveCVRResponse } from '@/types/cvr-hub'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { metrics, aggregates, dateRange, clientId, sheetConfig } = body

    if (!metrics || !aggregates || !dateRange) {
      return NextResponse.json<SaveCVRResponse>(
        {
          success: false,
          error: 'Missing required parameters: metrics, aggregates, dateRange',
        },
        { status: 400 },
      )
    }

    const result = await saveCVRMetrics(
      metrics,
      aggregates,
      dateRange,
      clientId,
      sheetConfig,
    )

    if (!result.success) {
      return NextResponse.json<SaveCVRResponse>(result, { status: 500 })
    }

    return NextResponse.json<SaveCVRResponse>(result)
  } catch (error) {
    console.error('Error in save CVR endpoint:', error)
    return NextResponse.json<SaveCVRResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to save CVR data',
      },
      { status: 500 },
    )
  }
}
