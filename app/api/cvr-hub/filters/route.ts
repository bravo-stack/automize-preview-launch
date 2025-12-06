import { getUniqueAccountNames, getUniquePods } from '@/lib/services/cvr-hub'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [pods, accountNames] = await Promise.all([
      getUniquePods(),
      getUniqueAccountNames(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        pods,
        accountNames,
      },
    })
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch filter options',
      },
      { status: 500 },
    )
  }
}
