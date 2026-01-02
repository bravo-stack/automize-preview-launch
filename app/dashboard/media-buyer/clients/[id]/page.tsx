import { createAdminClient } from '@/lib/db/admin'
import { createClient } from '@/lib/db/server'
import type {
  CampaignMetricsSummary,
  ClientDataResponse,
  OmnisendAutomationData,
  OmnisendCampaignData,
  OmnisendContactData,
  OmnisendOrderData,
  OmnisendProductData,
  OmnisendRevenueSummary,
  ThemeData,
} from '@/types/media-buyer'
import { notFound, redirect } from 'next/navigation'
import { ClientDetail, ClientDetailError } from './client-detail'

// ============================================================================
// Server-side Data Fetching
// ============================================================================

async function getClientData(clientId: number): Promise<ClientDataResponse> {
  const db = createAdminClient()

  // 1. Fetch client details
  const { data: client, error: clientError } = await db
    .from('clients')
    .select(
      'id, brand, pod, full_name, email, phone_number, website, status, store_id, is_monitored, instagram, rebill_date, drive',
    )
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    throw new Error('Client not found')
  }

  // 2. Get all API sources
  const { data: sources } = await db
    .from('api_sources')
    .select('id, provider, endpoint')
    .eq('is_active', true)

  const sourceMap = new Map<string, string>()
  sources?.forEach((s) => {
    sourceMap.set(`${s.provider}:${s.endpoint}`, s.id)
  })

  // 3. Get latest snapshots for this client from each source
  const snapshotPromises = Array.from(sourceMap.entries()).map(
    async ([key, sourceId]) => {
      const { data: snapshot } = await db
        .from('api_snapshots')
        .select('id, created_at')
        .eq('source_id', sourceId)
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return { key, snapshot }
    },
  )

  const snapshotResults = await Promise.all(snapshotPromises)
  const snapshotMap = new Map<string, { id: string; created_at: string }>()
  snapshotResults.forEach(({ key, snapshot }) => {
    if (snapshot) {
      snapshotMap.set(key, snapshot)
    }
  })

  // 4. Fetch records from each source's latest snapshot
  const recordPromises = Array.from(snapshotMap.entries()).map(
    async ([key, snapshot]) => {
      const { data: records } = await db
        .from('api_records')
        .select('*')
        .eq('snapshot_id', snapshot.id)

      // Get metrics and attributes for these records
      const recordIds = records?.map((r) => r.id) || []

      const [{ data: metrics }, { data: attributes }] = await Promise.all([
        db
          .from('api_record_metrics')
          .select('*')
          .in('record_id', recordIds.length > 0 ? recordIds : ['']),
        db
          .from('api_record_attributes')
          .select('*')
          .in('record_id', recordIds.length > 0 ? recordIds : ['']),
      ])

      // Group metrics and attributes by record_id
      const metricsByRecord = new Map<string, typeof metrics>()
      const attributesByRecord = new Map<string, typeof attributes>()

      metrics?.forEach((m) => {
        const existing = metricsByRecord.get(m.record_id) || []
        existing.push(m)
        metricsByRecord.set(m.record_id, existing)
      })

      attributes?.forEach((a) => {
        const existing = attributesByRecord.get(a.record_id) || []
        existing.push(a)
        attributesByRecord.set(a.record_id, existing)
      })

      // Combine records with their metrics and attributes
      const enrichedRecords = records?.map((r) => ({
        ...r,
        metrics: metricsByRecord.get(r.id) || [],
        attributes: attributesByRecord.get(r.id) || [],
      }))

      return {
        key,
        records: enrichedRecords || [],
        lastUpdated: snapshot.created_at,
      }
    },
  )

  const recordResults = await Promise.all(recordPromises)
  const dataBySource = new Map<
    string,
    { records: (typeof recordResults)[0]['records']; lastUpdated: string }
  >()
  recordResults.forEach(({ key, records, lastUpdated }) => {
    dataBySource.set(key, { records, lastUpdated })
  })

  // 5. Transform data for each source type
  const themeData = dataBySource.get('shopify:themes')
  const ordersData = dataBySource.get('omnisend:orders')
  const automationsData = dataBySource.get('omnisend:automations')
  const campaignsData = dataBySource.get('omnisend:campaigns')
  const contactsData = dataBySource.get('omnisend:contacts')
  const productsData = dataBySource.get('omnisend:products')

  // Transform theme data
  const theme: ThemeData | null = themeData?.records?.[0]
    ? {
        id: themeData.records[0].id,
        external_id: themeData.records[0].external_id,
        name: themeData.records[0].name,
        status: themeData.records[0].status,
        category: themeData.records[0].category,
        record_date: themeData.records[0].record_date,
        extra: themeData.records[0].extra as ThemeData['extra'],
        attributes: themeData.records[0].attributes.map((a) => ({
          attribute_name: a.attribute_name,
          attribute_value: a.attribute_value,
        })),
      }
    : null

  // Transform orders data
  const orders: OmnisendOrderData[] =
    ordersData?.records?.map((r) => ({
      id: r.id,
      external_id: r.external_id,
      name: r.name,
      email: r.email,
      status: r.status,
      tags: r.tags,
      amount: r.amount ? Number(r.amount) : null,
      record_date: r.record_date,
      attributes: r.attributes,
    })) || []

  // Calculate revenue summary
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0)
  const orderCount = orders.length
  const revenueSummary: OmnisendRevenueSummary = {
    totalRevenue,
    orderCount,
    averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
    currency: 'USD',
  }

  // Transform automations data
  const automations: OmnisendAutomationData[] =
    automationsData?.records?.map((r) => ({
      id: r.id,
      external_id: r.external_id,
      name: r.name,
      status: r.status,
      record_date: r.record_date,
    })) || []

  // Transform campaigns data and calculate metrics
  const campaigns: OmnisendCampaignData[] =
    campaignsData?.records?.map((r) => ({
      id: r.id,
      external_id: r.external_id,
      name: r.name,
      status: r.status,
      record_date: r.record_date,
      metrics: r.metrics,
      attributes: r.attributes,
    })) || []

  // Calculate campaign metrics summary
  const campaignMetrics: CampaignMetricsSummary = {
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalBounced: 0,
    totalUnsubscribed: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
  }

  campaigns.forEach((c) => {
    c.metrics.forEach((m) => {
      const value = Number(m.metric_value)
      switch (m.metric_name) {
        case 'sent':
          campaignMetrics.totalSent += value
          break
        case 'opened':
          campaignMetrics.totalOpened += value
          break
        case 'clicked':
          campaignMetrics.totalClicked += value
          break
        case 'bounced':
          campaignMetrics.totalBounced += value
          break
        case 'unsubscribed':
          campaignMetrics.totalUnsubscribed += value
          break
      }
    })
  })

  // Calculate rates
  if (campaignMetrics.totalSent > 0) {
    campaignMetrics.openRate =
      (campaignMetrics.totalOpened / campaignMetrics.totalSent) * 100
    campaignMetrics.clickRate =
      (campaignMetrics.totalClicked / campaignMetrics.totalSent) * 100
    campaignMetrics.bounceRate =
      (campaignMetrics.totalBounced / campaignMetrics.totalSent) * 100
  }

  // Transform contacts data
  const contacts: OmnisendContactData[] =
    contactsData?.records?.map((r) => ({
      id: r.id,
      external_id: r.external_id,
      name: r.name,
      email: r.email,
      status: r.status,
      tags: r.tags,
      record_date: r.record_date,
      attributes: r.attributes,
    })) || []

  // Transform products data
  const products: OmnisendProductData[] =
    productsData?.records?.map((r) => ({
      id: r.id,
      external_id: r.external_id,
      name: r.name,
      status: r.status,
      category: r.category,
      tags: r.tags,
      record_date: r.record_date,
      attributes: r.attributes,
    })) || []

  // 6. Build response
  return {
    client,
    theme,
    omnisend: {
      orders,
      automations,
      campaigns,
      contacts,
      products,
      revenueSummary,
      campaignMetrics,
    },
    lastUpdated: {
      theme: themeData?.lastUpdated || null,
      omnisendOrders: ordersData?.lastUpdated || null,
      omnisendAutomations: automationsData?.lastUpdated || null,
      omnisendCampaigns: campaignsData?.lastUpdated || null,
      omnisendContacts: contactsData?.lastUpdated || null,
      omnisendProducts: productsData?.lastUpdated || null,
    },
  }
}

// ============================================================================
// Page Component (Server Component)
// ============================================================================

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const clientId = parseInt(id, 10)
  const db = createClient()

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user || !user.email) {
    redirect('/login')
  }

  const role = user.user_metadata.role ?? 'exec'

  // Fetch pod to check if user is Muhammad (pod id: 34)
  const adminDb = createAdminClient()
  const { data: pod } = await adminDb
    .from('pod')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Muhammad (pod id: 34) gets exec-level access
  const isMuhammad = pod?.id === 34
  const isExec = role === 'exec' || isMuhammad

  if (isNaN(clientId)) {
    notFound()
  }

  try {
    const data = await getClientData(clientId)
    return <ClientDetail isExec={isExec} initialData={data} />
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load client data'
    return <ClientDetailError error={message} />
  }
}
