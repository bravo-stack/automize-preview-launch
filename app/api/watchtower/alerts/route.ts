import {
  acknowledgeAlert,
  bulkAcknowledgeAlerts,
  createAlert,
  deleteAlert,
  getAlertsPaginated,
} from '@/lib/actions/watchtower'
import type { Severity } from '@/types/api-storage'
import type { AlertSortBy } from '@/types/watchtower'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// GET /api/watchtower/alerts - List alerts with pagination and filtering
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const sortBy = (searchParams.get('sortBy') || 'created_desc') as AlertSortBy

    const params = {
      page,
      pageSize,
      sortBy,
      rule_id: searchParams.get('rule_id') || undefined,
      snapshot_id: searchParams.get('snapshot_id') || undefined,
      client_id: searchParams.get('client_id')
        ? parseInt(searchParams.get('client_id')!, 10)
        : undefined,
      severity: (searchParams.get('severity') as Severity) || undefined,
      is_acknowledged: searchParams.has('is_acknowledged')
        ? searchParams.get('is_acknowledged') === 'true'
        : undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
    }

    const { alerts, total } = await getAlertsPaginated(params)

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: alerts,
      pagination: {
        page,
        pageSize,
        totalCount: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch alerts',
      },
      { status: 500 },
    )
  }
}

// ============================================================================
// POST /api/watchtower/alerts - Create a new alert
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { rule_id, snapshot_id, message, severity, ...options } = body

    if (!rule_id || !snapshot_id || !message || !severity) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: rule_id, snapshot_id, message, severity',
        },
        { status: 400 },
      )
    }

    const alert = await createAlert(
      rule_id,
      snapshot_id,
      severity,
      message,
      options.current_value || null,
      {
        previousValue: options.previous_value,
        recordId: options.record_id,
        clientId: options.client_id,
      },
    )

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Failed to create alert' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, data: alert }, { status: 201 })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create alert',
      },
      { status: 500 },
    )
  }
}

// ============================================================================
// PATCH /api/watchtower/alerts - Acknowledge alerts (single or bulk)
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alert_ids, acknowledged_by } = body

    if (!alert_ids || !Array.isArray(alert_ids) || alert_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid alert_ids array' },
        { status: 400 },
      )
    }

    if (alert_ids.length === 1) {
      // Single acknowledgment
      const success = await acknowledgeAlert(alert_ids[0], acknowledged_by)
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to acknowledge alert' },
          { status: 500 },
        )
      }
      return NextResponse.json({ success: true, acknowledged: 1 })
    }

    // Bulk acknowledgment
    const count = await bulkAcknowledgeAlerts(
      alert_ids,
      acknowledged_by || 'system',
    )

    return NextResponse.json({ success: true, acknowledged: count })
  } catch (error) {
    console.error('Error acknowledging alerts:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to acknowledge alerts',
      },
      { status: 500 },
    )
  }
}

// ============================================================================
// DELETE /api/watchtower/alerts - Delete an alert
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'Missing alert id' },
        { status: 400 },
      )
    }

    const success = await deleteAlert(alertId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete alert' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete alert',
      },
      { status: 500 },
    )
  }
}
