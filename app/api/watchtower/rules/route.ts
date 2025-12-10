import {
  createCompoundRule,
  createRule,
  deleteRule,
  deleteRuleWithGroup,
  getApiSourcesForRules,
  getAvailableParentRules,
  getRuleById,
  getRulesPaginated,
  toggleRuleActive,
  updateRule,
} from '@/lib/actions/watchtower'
import type { Severity, TargetTable } from '@/types/api-storage'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// ============================================================================
// GET /api/watchtower/rules - List rules with pagination and filtering
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Handle special endpoints
    const action = searchParams.get('action')

    if (action === 'parent-rules') {
      // Get available parent rules
      const excludeId = searchParams.get('exclude') || undefined
      const parentRules = await getAvailableParentRules(excludeId)
      return NextResponse.json({ success: true, data: parentRules })
    }

    if (action === 'sources') {
      // Get available API sources
      const sources = await getApiSourcesForRules()
      return NextResponse.json({ success: true, data: sources })
    }

    if (action === 'single') {
      // Get single rule by ID
      const ruleId = searchParams.get('id')
      if (!ruleId) {
        return NextResponse.json(
          { success: false, error: 'Missing rule id' },
          { status: 400 },
        )
      }
      const rule = await getRuleById(ruleId)
      if (!rule) {
        return NextResponse.json(
          { success: false, error: 'Rule not found' },
          { status: 404 },
        )
      }
      return NextResponse.json({ success: true, data: rule })
    }

    // Default: List rules with pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    const params = {
      page,
      pageSize,
      source_id: searchParams.get('source_id') || undefined,
      client_id: searchParams.get('client_id')
        ? parseInt(searchParams.get('client_id')!, 10)
        : undefined,
      target_table:
        (searchParams.get('target_table') as TargetTable) || undefined,
      is_active: searchParams.has('is_active')
        ? searchParams.get('is_active') === 'true'
        : undefined,
      severity: (searchParams.get('severity') as Severity) || undefined,
      group_id: searchParams.get('group_id') || undefined,
    }

    const { rules, total } = await getRulesPaginated(params)

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: rules,
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
    console.error('Error fetching rules:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rules',
      },
      { status: 500 },
    )
  }
}

// ============================================================================
// POST /api/watchtower/rules - Create a new rule (single or compound)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a compound rule (has clauses array)
    if (
      body.clauses &&
      Array.isArray(body.clauses) &&
      body.clauses.length > 0
    ) {
      // Validate compound rule
      if (!body.name || body.clauses.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Compound rules require a name and at least one clause',
          },
          { status: 400 },
        )
      }

      // Validate each clause
      for (const clause of body.clauses) {
        if (!clause.field_name || !clause.condition) {
          return NextResponse.json(
            {
              success: false,
              error: 'Each clause must have field_name and condition',
            },
            { status: 400 },
          )
        }
      }

      const rules = await createCompoundRule(body)

      if (rules.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Failed to create compound rule' },
          { status: 500 },
        )
      }

      return NextResponse.json(
        { success: true, data: rules, compound: true },
        { status: 201 },
      )
    }

    // Single rule creation
    const { name, field_name, condition } = body

    if (!name || !field_name || !condition) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, field_name, condition',
        },
        { status: 400 },
      )
    }

    const rule = await createRule(body)

    if (!rule) {
      return NextResponse.json(
        { success: false, error: 'Failed to create rule' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { success: true, data: rule, compound: false },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating rule:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create rule',
      },
      { status: 500 },
    )
  }
}

// ============================================================================
// PATCH /api/watchtower/rules - Update a rule or toggle active status
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing rule id' },
        { status: 400 },
      )
    }

    // Handle toggle action
    if (action === 'toggle') {
      const isActive = updates.is_active
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing is_active value for toggle action',
          },
          { status: 400 },
        )
      }

      const success = await toggleRuleActive(id, isActive)

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to toggle rule' },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true, is_active: isActive })
    }

    // Regular update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 },
      )
    }

    const success = await updateRule(id, updates)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update rule' },
        { status: 500 },
      )
    }

    // Fetch updated rule to return
    const updatedRule = await getRuleById(id)

    return NextResponse.json({ success: true, data: updatedRule })
  } catch (error) {
    console.error('Error updating rule:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update rule',
      },
      { status: 500 },
    )
  }
}

// ============================================================================
// DELETE /api/watchtower/rules - Delete a rule (optionally with its group)
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ruleId = searchParams.get('id')
    const deleteGroup = searchParams.get('deleteGroup') === 'true'

    if (!ruleId) {
      return NextResponse.json(
        { success: false, error: 'Missing rule id' },
        { status: 400 },
      )
    }

    const success = deleteGroup
      ? await deleteRuleWithGroup(ruleId, true)
      : await deleteRule(ruleId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete rule' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, deletedGroup: deleteGroup })
  } catch (error) {
    console.error('Error deleting rule:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete rule',
      },
      { status: 500 },
    )
  }
}
