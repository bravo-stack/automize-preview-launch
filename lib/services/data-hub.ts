import type {
  ApiDataCategoryStats,
  ApiRecord,
  ApiSnapshot,
  ApiSource,
  DataHubOverview,
  DayDropRequest,
  FacebookCategoryStats,
  FacebookMetricsAggregates,
  FinanceCategoryStats,
  FinanceMetricsAggregates,
  FormsCategoryStats,
  FormSubmission,
  PaginatedResponse,
  PaginationParams,
  RefreshSnapshotMetric,
  SheetRefreshSnapshot,
  WatchtowerAlert,
  WatchtowerRule,
  WebsiteRevampRequest,
} from '@/types/data-hub'
import { createAdminClient } from '../db/admin'

// ============================================================================
// Overview Stats - Enhanced with category breakdown
// ============================================================================

export async function getDataHubOverview(): Promise<DataHubOverview> {
  const db = createAdminClient()

  const [
    sourcesRes,
    apiSnapshotsRes,
    apiRecordsRes,
    alertsRes,
    formsRes,
    sheetSnapshotsRes,
    facebookSnapshotsRes,
    financeSnapshotsRes,
    facebookMetricsRes,
    financeMetricsRes,
    dayDropRes,
    websiteRevampRes,
  ] = await Promise.all([
    db.from('api_sources').select('id, is_active', { count: 'exact' }),
    db.from('api_snapshots').select('id, status', { count: 'exact' }),
    db.from('api_records').select('id', { count: 'exact', head: true }),
    db
      .from('watchtower_alerts')
      .select('id, severity, is_acknowledged', { count: 'exact' }),
    db
      .from('form_submissions')
      .select('id, status, form_type', { count: 'exact' }),
    db
      .from('sheet_refresh_snapshots')
      .select('id, refresh_status', { count: 'exact' }),
    db
      .from('sheet_refresh_snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('refresh_type', 'autometric'),
    db
      .from('sheet_refresh_snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('refresh_type', 'financialx'),
    db
      .from('refresh_snapshot_metrics')
      .select('id, snapshot:sheet_refresh_snapshots!inner(refresh_type)', {
        count: 'exact',
        head: true,
      })
      .eq('snapshot.refresh_type', 'autometric'),
    db
      .from('refresh_snapshot_metrics')
      .select('id, snapshot:sheet_refresh_snapshots!inner(refresh_type)', {
        count: 'exact',
        head: true,
      })
      .eq('snapshot.refresh_type', 'financialx'),
    db
      .from('form_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('form_type', 'day_drop_request'),
    db
      .from('form_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('form_type', 'website_revamp'),
  ])

  const sources = sourcesRes.data || []
  const apiSnapshots = apiSnapshotsRes.data || []
  const sheetSnapshots = sheetSnapshotsRes.data || []
  const alerts = alertsRes.data || []
  const forms = formsRes.data || []

  return {
    // API Data Stats
    totalSources: sourcesRes.count || 0,
    activeSources: sources.filter((s) => s.is_active).length,
    totalApiSnapshots: apiSnapshotsRes.count || 0,
    completedApiSnapshots: apiSnapshots.filter((s) => s.status === 'completed')
      .length,
    failedApiSnapshots: apiSnapshots.filter((s) => s.status === 'failed')
      .length,
    totalApiRecords: apiRecordsRes.count || 0,
    // Sheet Data Stats
    totalSheetSnapshots: sheetSnapshotsRes.count || 0,
    completedSheetSnapshots: sheetSnapshots.filter(
      (s) => s.refresh_status === 'completed',
    ).length,
    totalSheetMetrics:
      (facebookMetricsRes.count || 0) + (financeMetricsRes.count || 0),
    // Facebook (Autometric) Stats
    facebookSnapshots: facebookSnapshotsRes.count || 0,
    facebookMetrics: facebookMetricsRes.count || 0,
    // Finance (FinancialX) Stats
    financeSnapshots: financeSnapshotsRes.count || 0,
    financeMetrics: financeMetricsRes.count || 0,
    // Watchtower Stats
    totalAlerts: alertsRes.count || 0,
    unacknowledgedAlerts: alerts.filter((a) => !a.is_acknowledged).length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
    // Form Stats
    totalFormSubmissions: formsRes.count || 0,
    pendingSubmissions: forms.filter((f) => f.status === 'pending').length,
    dayDropRequests: dayDropRes.count || 0,
    websiteRevampRequests: websiteRevampRes.count || 0,
  }
}

// ============================================================================
// Facebook (Autometric) Category Functions
// ============================================================================

export async function getFacebookCategoryStats(): Promise<FacebookCategoryStats> {
  const db = createAdminClient()

  const [snapshotsRes, metricsRes, latestRes, podsRes, errorsRes] =
    await Promise.all([
      db
        .from('sheet_refresh_snapshots')
        .select('id, refresh_status', { count: 'exact' })
        .eq('refresh_type', 'autometric'),
      db
        .from('refresh_snapshot_metrics')
        .select('id, snapshot:sheet_refresh_snapshots!inner(refresh_type)', {
          count: 'exact',
          head: true,
        })
        .eq('snapshot.refresh_type', 'autometric'),
      db
        .from('sheet_refresh_snapshots')
        .select('snapshot_date')
        .eq('refresh_type', 'autometric')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single(),
      db
        .from('refresh_snapshot_metrics')
        .select('pod, snapshot:sheet_refresh_snapshots!inner(refresh_type)')
        .eq('snapshot.refresh_type', 'autometric')
        .not('pod', 'is', null),
      db
        .from('refresh_snapshot_metrics')
        .select('id, snapshot:sheet_refresh_snapshots!inner(refresh_type)', {
          count: 'exact',
          head: true,
        })
        .eq('snapshot.refresh_type', 'autometric')
        .eq('is_error', true),
    ])

  const snapshots = snapshotsRes.data || []
  const pods = podsRes.data || []
  const uniquePods = Array.from(
    new Set(pods.map((p) => p.pod).filter(Boolean)),
  ) as string[]

  return {
    totalSnapshots: snapshotsRes.count || 0,
    completedSnapshots: snapshots.filter(
      (s) => s.refresh_status === 'completed',
    ).length,
    totalMetrics: metricsRes.count || 0,
    latestSnapshotDate: latestRes.data?.snapshot_date || null,
    uniquePods,
    accountsWithErrors: errorsRes.count || 0,
  }
}

export async function getFacebookMetrics(
  params: PaginationParams & {
    snapshotId?: string
    pod?: string
    datePreset?: string
  },
): Promise<PaginatedResponse<RefreshSnapshotMetric>> {
  const db = createAdminClient()
  const { page, pageSize, snapshotId, pod, datePreset } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = db
    .from('refresh_snapshot_metrics')
    .select(
      `
      *,
      snapshot:sheet_refresh_snapshots!inner (
        id,
        refresh_type,
        refresh_status,
        date_preset,
        snapshot_date,
        sheet:sheets (
          id,
          title,
          pod,
          is_finance
        )
      )
    `,
      { count: 'exact' },
    )
    .eq('snapshot.refresh_type', 'autometric')
    .order('created_at', { ascending: false })

  if (snapshotId) query = query.eq('snapshot_id', snapshotId)
  if (pod) query = query.eq('pod', pod)
  if (datePreset) query = query.eq('snapshot.date_preset', datePreset)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching Facebook metrics:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

export async function getFacebookAggregates(
  snapshotId?: string,
): Promise<FacebookMetricsAggregates> {
  const db = createAdminClient()

  let query = db
    .from('refresh_snapshot_metrics')
    .select('*, snapshot:sheet_refresh_snapshots!inner(refresh_type)')
    .eq('snapshot.refresh_type', 'autometric')

  if (snapshotId) {
    query = query.eq('snapshot_id', snapshotId)
  }

  const { data, error } = await query

  if (error || !data) {
    return {
      totalAccounts: 0,
      totalAdSpend: 0,
      avgRoas: 0,
      totalOrders: 0,
      totalFbRevenue: 0,
      totalShopifyRevenue: 0,
      accountsWithErrors: 0,
    }
  }

  const metrics = data as RefreshSnapshotMetric[]
  const totalAdSpend = metrics.reduce(
    (sum, m) => sum + (m.ad_spend_timeframe || 0),
    0,
  )
  const totalRoas = metrics.reduce((sum, m) => sum + (m.roas_timeframe || 0), 0)
  const roasCount = metrics.filter((m) => m.roas_timeframe !== null).length

  return {
    totalAccounts: metrics.length,
    totalAdSpend,
    avgRoas: roasCount > 0 ? totalRoas / roasCount : 0,
    totalOrders: metrics.reduce((sum, m) => sum + (m.orders_timeframe || 0), 0),
    totalFbRevenue: metrics.reduce(
      (sum, m) => sum + (m.fb_revenue_timeframe || 0),
      0,
    ),
    totalShopifyRevenue: metrics.reduce(
      (sum, m) => sum + (m.shopify_revenue_timeframe || 0),
      0,
    ),
    accountsWithErrors: metrics.filter((m) => m.is_error).length,
  }
}

// ============================================================================
// Finance (FinancialX) Category Functions
// ============================================================================

export async function getFinanceCategoryStats(): Promise<FinanceCategoryStats> {
  const db = createAdminClient()

  const [snapshotsRes, metricsRes, latestRes, rebillRes] = await Promise.all([
    db
      .from('sheet_refresh_snapshots')
      .select('id, refresh_status', { count: 'exact' })
      .eq('refresh_type', 'financialx'),
    db
      .from('refresh_snapshot_metrics')
      .select('id, snapshot:sheet_refresh_snapshots!inner(refresh_type)', {
        count: 'exact',
        head: true,
      })
      .eq('snapshot.refresh_type', 'financialx'),
    db
      .from('sheet_refresh_snapshots')
      .select('snapshot_date')
      .eq('refresh_type', 'financialx')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single(),
    db
      .from('refresh_snapshot_metrics')
      .select(
        'id, rebill_status, snapshot:sheet_refresh_snapshots!inner(refresh_type)',
        { count: 'exact' },
      )
      .eq('snapshot.refresh_type', 'financialx')
      .not('rebill_status', 'is', null),
  ])

  const snapshots = snapshotsRes.data || []

  return {
    totalSnapshots: snapshotsRes.count || 0,
    completedSnapshots: snapshots.filter(
      (s) => s.refresh_status === 'completed',
    ).length,
    totalMetrics: metricsRes.count || 0,
    latestSnapshotDate: latestRes.data?.snapshot_date || null,
    accountsInRebill: rebillRes.count || 0,
  }
}

export async function getFinanceMetrics(
  params: PaginationParams & { snapshotId?: string; rebillStatus?: string },
): Promise<PaginatedResponse<RefreshSnapshotMetric>> {
  const db = createAdminClient()
  const { page, pageSize, snapshotId, rebillStatus } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = db
    .from('refresh_snapshot_metrics')
    .select(
      `
      *,
      snapshot:sheet_refresh_snapshots!inner (
        id,
        refresh_type,
        refresh_status,
        date_preset,
        snapshot_date,
        sheet:sheets (
          id,
          title,
          pod,
          is_finance
        )
      )
    `,
      { count: 'exact' },
    )
    .eq('snapshot.refresh_type', 'financialx')
    .order('created_at', { ascending: false })

  if (snapshotId) query = query.eq('snapshot_id', snapshotId)
  if (rebillStatus) query = query.eq('rebill_status', rebillStatus)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching Finance metrics:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

export async function getFinanceAggregates(
  snapshotId?: string,
): Promise<FinanceMetricsAggregates> {
  const db = createAdminClient()

  let query = db
    .from('refresh_snapshot_metrics')
    .select('*, snapshot:sheet_refresh_snapshots!inner(refresh_type)')
    .eq('snapshot.refresh_type', 'financialx')

  if (snapshotId) {
    query = query.eq('snapshot_id', snapshotId)
  }

  const { data, error } = await query

  if (error || !data) {
    return {
      totalAccounts: 0,
      totalRebillSpend: 0,
      avgRebillRoas: 0,
      totalRebillOrders: 0,
      accountsInRebill: 0,
    }
  }

  const metrics = data as RefreshSnapshotMetric[]
  const totalRebillSpend = metrics.reduce(
    (sum, m) => sum + (m.ad_spend_rebill || 0),
    0,
  )
  const totalRebillRoas = metrics.reduce(
    (sum, m) => sum + (m.roas_rebill || 0),
    0,
  )
  const roasCount = metrics.filter((m) => m.roas_rebill !== null).length

  return {
    totalAccounts: metrics.length,
    totalRebillSpend,
    avgRebillRoas: roasCount > 0 ? totalRebillRoas / roasCount : 0,
    totalRebillOrders: metrics.reduce(
      (sum, m) => sum + (m.orders_rebill || 0),
      0,
    ),
    accountsInRebill: metrics.filter((m) => m.rebill_status !== null).length,
  }
}

// ============================================================================
// API Data Category Functions
// ============================================================================

export async function getApiDataCategoryStats(): Promise<ApiDataCategoryStats> {
  const db = createAdminClient()

  const [sourcesRes, snapshotsRes, recordsRes, latestRes] = await Promise.all([
    db
      .from('api_sources')
      .select('id, provider, is_active', { count: 'exact' }),
    db.from('api_snapshots').select('id', { count: 'exact', head: true }),
    db.from('api_records').select('id', { count: 'exact', head: true }),
    db
      .from('api_snapshots')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  const sources = sourcesRes.data || []
  const sourcesByProvider: Record<string, number> = {}
  sources.forEach((s) => {
    sourcesByProvider[s.provider] = (sourcesByProvider[s.provider] || 0) + 1
  })

  return {
    totalSources: sourcesRes.count || 0,
    activeSources: sources.filter((s) => s.is_active).length,
    sourcesByProvider,
    totalSnapshots: snapshotsRes.count || 0,
    totalRecords: recordsRes.count || 0,
    latestSnapshotDate: latestRes.data?.created_at || null,
  }
}

// ============================================================================
// Forms Category Functions
// ============================================================================

export async function getFormsCategoryStats(): Promise<FormsCategoryStats> {
  const db = createAdminClient()

  const { data, error, count } = await db
    .from('form_submissions')
    .select('id, status, form_type', { count: 'exact' })

  if (error || !data) {
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      dayDropCount: 0,
      websiteRevampCount: 0,
    }
  }

  return {
    total: count || 0,
    pending: data.filter((f) => f.status === 'pending').length,
    processing: data.filter((f) => f.status === 'processing').length,
    completed: data.filter((f) => f.status === 'completed').length,
    cancelled: data.filter((f) => f.status === 'cancelled').length,
    dayDropCount: data.filter((f) => f.form_type === 'day_drop_request').length,
    websiteRevampCount: data.filter((f) => f.form_type === 'website_revamp')
      .length,
  }
}

export async function getDayDropRequests(
  params: PaginationParams & { status?: string },
): Promise<PaginatedResponse<DayDropRequest>> {
  const db = createAdminClient()
  const { page, pageSize, status } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = db
    .from('day_drop_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching Day Drop requests:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

export async function getWebsiteRevampRequests(
  params: PaginationParams & { status?: string },
): Promise<PaginatedResponse<WebsiteRevampRequest>> {
  const db = createAdminClient()
  const { page, pageSize, status } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = db
    .from('website_revamp_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching Website Revamp requests:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

// ============================================================================
// API Sources (root table - no FK joins needed)
// ============================================================================

export async function getApiSources(
  params: PaginationParams,
): Promise<PaginatedResponse<ApiSource>> {
  const db = createAdminClient()
  const { page, pageSize } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await db
    .from('api_sources')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching API sources:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

// ============================================================================
// API Snapshots (FK: source_id -> api_sources)
// ============================================================================

export async function getApiSnapshots(
  params: PaginationParams & { sourceId?: string; status?: string },
): Promise<PaginatedResponse<ApiSnapshot>> {
  const db = createAdminClient()
  const { page, pageSize, sourceId, status } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Join with api_sources to get source details
  let query = db
    .from('api_snapshots')
    .select(
      `
      *,
      source:api_sources (
        id,
        provider,
        endpoint,
        display_name,
        is_active
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (sourceId) query = query.eq('source_id', sourceId)
  if (status) query = query.eq('status', status)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching API snapshots:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

// ============================================================================
// API Records (FK: snapshot_id -> api_snapshots)
// Also fetches related metrics and attributes
// ============================================================================

export async function getApiRecords(
  params: PaginationParams & {
    snapshotId?: string
    category?: string
    status?: string
  },
): Promise<PaginatedResponse<ApiRecord>> {
  const db = createAdminClient()
  const { page, pageSize, snapshotId, category, status } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Join with snapshot -> source chain, plus metrics and attributes
  let query = db
    .from('api_records')
    .select(
      `
      *,
      snapshot:api_snapshots (
        id,
        snapshot_type,
        status,
        created_at,
        source:api_sources (
          id,
          provider,
          display_name
        )
      ),
      metrics:api_record_metrics (
        id,
        metric_name,
        metric_value,
        metric_unit
      ),
      attributes:api_record_attributes (
        id,
        attribute_name,
        attribute_value
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (snapshotId) query = query.eq('snapshot_id', snapshotId)
  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching API records:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

// ============================================================================
// Sheet Refresh Snapshots (FK: sheet_id -> sheets)
// ============================================================================

export async function getSheetSnapshots(
  params: PaginationParams & { refreshType?: string; status?: string },
): Promise<PaginatedResponse<SheetRefreshSnapshot>> {
  const db = createAdminClient()
  const { page, pageSize, refreshType, status } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Join with sheets table to get sheet details
  let query = db
    .from('sheet_refresh_snapshots')
    .select(
      `
      *,
      sheet:sheets (
        id,
        sheet_id,
        title,
        pod,
        is_finance,
        refresh
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (refreshType) query = query.eq('refresh_type', refreshType)
  if (status) query = query.eq('refresh_status', status)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching sheet snapshots:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

// ============================================================================
// Refresh Snapshot Metrics (FK: snapshot_id -> sheet_refresh_snapshots)
// ============================================================================

export async function getRefreshSnapshotMetrics(
  params: PaginationParams & { snapshotId?: string; pod?: string },
): Promise<PaginatedResponse<RefreshSnapshotMetric>> {
  const db = createAdminClient()
  const { page, pageSize, snapshotId, pod } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Join with sheet_refresh_snapshots -> sheets chain
  let query = db
    .from('refresh_snapshot_metrics')
    .select(
      `
      *,
      snapshot:sheet_refresh_snapshots (
        id,
        refresh_type,
        refresh_status,
        date_preset,
        snapshot_date,
        sheet:sheets (
          id,
          title,
          pod,
          is_finance
        )
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (snapshotId) query = query.eq('snapshot_id', snapshotId)
  if (pod) query = query.eq('pod', pod)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching refresh snapshot metrics:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

// ============================================================================
// Watchtower Rules (FK: source_id -> api_sources, parent_rule_id -> self)
// ============================================================================

export async function getWatchtowerRules(
  params: PaginationParams & { isActive?: boolean },
): Promise<PaginatedResponse<WatchtowerRule>> {
  const db = createAdminClient()
  const { page, pageSize, isActive } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Join with api_sources
  let query = db
    .from('watchtower_rules')
    .select(
      `
      *,
      source:api_sources (
        id,
        provider,
        display_name
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (isActive !== undefined) query = query.eq('is_active', isActive)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching watchtower rules:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

// ============================================================================
// Watchtower Alerts (FK: rule_id -> watchtower_rules, snapshot_id -> api_snapshots, record_id -> api_records)
// ============================================================================

export async function getWatchtowerAlerts(
  params: PaginationParams & {
    severity?: string
    isAcknowledged?: boolean
  },
): Promise<PaginatedResponse<WatchtowerAlert>> {
  const db = createAdminClient()
  const { page, pageSize, severity, isAcknowledged } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Join with rule, snapshot -> source, and optionally record
  let query = db
    .from('watchtower_alerts')
    .select(
      `
      *,
      rule:watchtower_rules (
        id,
        name,
        severity,
        field_name,
        condition,
        threshold_value,
        source:api_sources (
          id,
          provider,
          display_name
        )
      ),
      snapshot:api_snapshots (
        id,
        snapshot_type,
        status,
        created_at,
        source:api_sources (
          id,
          display_name
        )
      ),
      record:api_records (
        id,
        external_id,
        name,
        category
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (severity) query = query.eq('severity', severity)
  if (isAcknowledged !== undefined)
    query = query.eq('is_acknowledged', isAcknowledged)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching watchtower alerts:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

// ============================================================================
// Form Submissions (FK: client_id -> clients)
// Also fetches related detail tables based on form_type
// ============================================================================

export async function getFormSubmissions(
  params: PaginationParams & { formType?: string; status?: string },
): Promise<PaginatedResponse<FormSubmission>> {
  const db = createAdminClient()
  const { page, pageSize, formType, status } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Join with detail tables (day_drop_request_details, website_revamp_request_details)
  let query = db
    .from('form_submissions')
    .select(
      `
      *,
      day_drop_details:day_drop_request_details (
        id,
        drop_name,
        collection_name,
        drop_date,
        timezone_and_time,
        offers,
        sms_required
      ),
      website_revamp_details:website_revamp_request_details (
        id,
        media_buyer_name,
        home_page,
        collection_page,
        product_pages
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (formType) query = query.eq('form_type', formType)
  if (status) query = query.eq('status', status)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching form submissions:', error)
    return createEmptyPaginatedResponse(page, pageSize)
  }

  return createPaginatedResponse(data || [], count || 0, page, pageSize)
}

// ============================================================================
// Helpers
// ============================================================================

function createPaginatedResponse<T>(
  data: T[],
  totalCount: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalCount / pageSize)
  return {
    data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }
}

function createEmptyPaginatedResponse<T>(
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  return {
    data: [],
    pagination: {
      page,
      pageSize,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  }
}
