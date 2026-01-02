import {
  ClientsHub,
  type ClientDataAvailability,
  type HubClient,
} from '@/components/media-buyer/hub'
import { createAdminClient } from '@/lib/db/admin'
import { createClient } from '@/lib/db/server'
import { Users } from 'lucide-react'
import { unstable_noStore } from 'next/cache'

interface PageProps {
  searchParams: Promise<{ view?: string }>
}

export default async function MediaBuyerClientsPage({
  searchParams,
}: PageProps) {
  unstable_noStore()

  const { view } = await searchParams

  // Get current user and their pod
  const authDb = createClient()
  const {
    data: { user },
  } = await authDb.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
        <div className="mx-auto max-w-[1800px]">
          <div className="flex min-h-[400px] flex-col items-center justify-center">
            <p className="text-white/60">Please sign in to view clients.</p>
          </div>
        </div>
      </main>
    )
  }

  const db = await createAdminClient()
  const role = user.user_metadata?.role ?? 'exec'

  // Get the user's pod (for non-exec users)
  const { data: pod, error: podError } = await db
    .from('pod')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  // Muhammad (pod id: 34) with view=full gets exec-level access
  const isMuhammadFullView = pod?.id === 34 && view === 'full'
  const isExec = role === 'exec' || isMuhammadFullView

  // For non-exec users without a pod, show empty state
  if (!isExec && (podError || !pod)) {
    return (
      <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
        <div className="mx-auto max-w-[1800px]">
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-white/5 p-6">
              <Users className="h-12 w-12 text-white/30" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-medium text-white">
                No Clients Assigned
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/60">
                Your pod doesn&apos;t have any clients assigned yet. Please
                contact your team lead.
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Fetch ALL clients for user's scope (single query)
  let clientsQuery = db
    .from('clients')
    .select('id, brand, full_name, website, status, is_monitored')
    .in('status', ['active', 'inactive'])
    .order('brand', { ascending: true })

  if (!isExec && pod?.name) {
    clientsQuery = clientsQuery.eq('pod', pod.name)
  }

  const { data: clients, error } = await clientsQuery

  if (error) {
    console.error('Error fetching clients:', error)
    return (
      <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
        <div className="mx-auto max-w-[1800px]">
          <div className="flex min-h-[400px] flex-col items-center justify-center">
            <p className="text-red-400">
              Failed to load clients. Please try again.
            </p>
          </div>
        </div>
      </main>
    )
  }

  const typedClients: HubClient[] =
    clients?.map((c) => ({
      id: String(c.id),
      brand: c.brand,
      full_name: c.full_name,
      website: c.website,
      status: c.status,
      is_monitored: c.is_monitored,
    })) || []

  // Calculate stats
  const stats = {
    total: typedClients.length,
    active: typedClients.filter((c) => c.status === 'active').length,
    inactive: typedClients.filter((c) => c.status !== 'active').length,
    monitored: typedClients.filter((c) => c.is_monitored).length,
  }

  // Fetch data availability for all clients
  const clientIds = typedClients.map((c) => parseInt(c.id, 10)).filter(Boolean)

  const { data: snapshotData } =
    clientIds.length > 0
      ? await db
          .from('api_snapshots')
          .select('client_id, total_records, source:api_sources(provider)')
          .in('client_id', clientIds)
          .eq('status', 'completed')
          .gt('total_records', 0)
      : { data: null }

  // Build data availability map
  const dataAvailabilityMap: Record<string, ClientDataAvailability> = {}

  if (snapshotData) {
    const clientDataMap = new Map<
      number,
      { themeRecords: number; omnisendRecords: number; totalRecords: number }
    >()

    snapshotData.forEach((snapshot) => {
      if (!snapshot.client_id || !snapshot.total_records) return

      const existing = clientDataMap.get(snapshot.client_id) || {
        themeRecords: 0,
        omnisendRecords: 0,
        totalRecords: 0,
      }

      const provider = (
        snapshot.source as { provider?: string } | null
      )?.provider?.toLowerCase()

      if (provider === 'shopify') {
        existing.themeRecords += snapshot.total_records
      } else if (provider === 'omnisend') {
        existing.omnisendRecords += snapshot.total_records
      }
      existing.totalRecords += snapshot.total_records

      clientDataMap.set(snapshot.client_id, existing)
    })

    clientDataMap.forEach((data, clientId) => {
      dataAvailabilityMap[String(clientId)] = {
        hasThemes: data.themeRecords > 0,
        hasOmnisend: data.omnisendRecords > 0,
        totalRecords: data.totalRecords,
      }
    })
  }

  return (
    <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
      <div className="mx-auto max-w-[1800px]">
        <ClientsHub
          clients={typedClients}
          dataAvailabilityMap={dataAvailabilityMap}
          stats={stats}
        />
      </div>
    </main>
  )
}
