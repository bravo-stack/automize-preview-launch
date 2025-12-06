import {
  calculateCVRAggregates,
  calculateComparisonRange,
  calculateDateRange,
  fetchCVRMetricsWithComparison,
} from '@/lib/services/cvr-hub'
import type { CVRHubResponse } from '@/types/cvr-hub'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { period, clientId, pod, accountName, isMonitored } = body

    if (!period || !period.preset || !period.comparisonMode) {
      return NextResponse.json<CVRHubResponse>(
        {
          success: false,
          error:
            'Missing required parameters: period.preset and period.comparisonMode',
        },
        { status: 400 },
      )
    }

    const metrics = await fetchCVRMetricsWithComparison({
      period,
      clientId,
      pod,
      accountName,
      isMonitored,
    })

    const aggregates = calculateCVRAggregates(metrics)

    const currentRange = calculateDateRange(period.preset, period.customRange)
    const comparisonRange = calculateComparisonRange(
      currentRange,
      period.comparisonMode,
    )

    const response: CVRHubResponse = {
      success: true,
      data: {
        metrics,
        aggregates,
        period,
        dateRanges: {
          current: currentRange,
          comparison: comparisonRange,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching CVR metrics:', error)
    return NextResponse.json<CVRHubResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch CVR metrics',
      },
      { status: 500 },
    )
  }
}
