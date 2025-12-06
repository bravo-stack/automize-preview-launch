import type {
  ApiRecord,
  ApiSnapshot,
  ApiSource,
  DataHubOverview,
  FormSubmission,
  PaginatedResponse,
  PaginationParams,
  RefreshSnapshotMetric,
  SheetRefreshSnapshot,
  WatchtowerAlert,
  WatchtowerRule,
} from '@/types/data-hub'
import { createAdminClient } from '../db/admin'

// ============================================================================
// Overview Stats
// ============================================================================

export async function getDataHubOverview(): Promise<DataHubOverview> {
  const db = createAdminClient()

  const [
    sourcesRes,
    snapshotsRes,
    recordsRes,
    alertsRes,
    formsRes,
    sheetSnapshotsRes,
    sheetMetricsRes,
  ] = await Promise.all([
    db.from('api_sources').select('id, is_active', { count: 'exact' }),
    db.from('api_snapshots').select('id, status', { count: 'exact' }),
    db.from('api_records').select('id', { count: 'exact', head: true }),
    db
      .from('watchtower_alerts')
      .select('id, severity, is_acknowledged', { count: 'exact' }),
    db.from('form_submissions').select('id, status', { count: 'exact' }),
    db
      .from('sheet_refresh_snapshots')
      .select('id', { count: 'exact', head: true }),
    db
      .from('refresh_snapshot_metrics')
      .select('id', { count: 'exact', head: true }),
  ])

  const sources = sourcesRes.data || []
  const snapshots = snapshotsRes.data || []
  const alerts = alertsRes.data || []
  const forms = formsRes.data || []

  return {
    totalSources: sourcesRes.count || 0,
    activeSources: sources.filter((s) => s.is_active).length,
    totalSnapshots: snapshotsRes.count || 0,
    completedSnapshots: snapshots.filter((s) => s.status === 'completed')
      .length,
    failedSnapshots: snapshots.filter((s) => s.status === 'failed').length,
    totalRecords: recordsRes.count || 0,
    totalAlerts: alertsRes.count || 0,
    unacknowledgedAlerts: alerts.filter((a) => !a.is_acknowledged).length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
    totalFormSubmissions: formsRes.count || 0,
    pendingSubmissions: forms.filter((f) => f.status === 'pending').length,
    totalSheetSnapshots: sheetSnapshotsRes.count || 0,
    totalSheetMetrics: sheetMetricsRes.count || 0,
  }
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
