import { createAdminClient } from '@/lib/db/admin'
import { createClient } from '@/lib/db/server'
import { NextResponse } from 'next/server'

// ============================================================================
// GET /api/media-buyer/clients
// Fetch all clients for the authenticated pod user
// ============================================================================

export async function GET() {
  const userDb = createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await userDb.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const db = createAdminClient()

  try {
    // Get the pod for this user
    const { data: pod, error: podError } = await db
      .from('pod')
      .select('id, name')
      .eq('user_id', user.id)
      .single()

    if (podError || !pod) {
      // User might be an exec with access to all clients
      // Fetch all active clients
      const { data: allClients, error: clientsError } = await db
        .from('clients')
        .select(
          'id, brand, pod, full_name, email, phone_number, website, status, store_id, is_monitored',
        )
        .in('status', ['active', 'inactive'])
        .order('brand')

      if (clientsError) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch clients' },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          pod: null,
          clients: allClients || [],
          isExec: true,
        },
      })
    }

    // Fetch clients for this pod
    const { data: clients, error: clientsError } = await db
      .from('clients')
      .select(
        'id, brand, pod, full_name, email, phone_number, website, status, store_id, is_monitored',
      )
      .eq('pod', pod.name)
      .in('status', ['active', 'inactive'])
      .order('brand')

    if (clientsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clients' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        pod,
        clients: clients || [],
        isExec: false,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching clients:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
