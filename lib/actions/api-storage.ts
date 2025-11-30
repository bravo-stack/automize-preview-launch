'use server'

import type {
  ApiRecord,
  ApiRecordMetric,
  ApiRecordWithMetrics,
  ApiSnapshot,
  ApiSource,
  ComparisonResult,
  MetricAggregation,
  MetricComparison,
  MetricDefinition,
  MetricInput,
  RecordQueryParams,
  RecordWithMetricsInput,
  SnapshotQueryParams,
  SnapshotType,
} from '@/types/api-storage'
import { createAdminClient } from '../db/admin'

// ============================================================================
// Source Operations
// ============================================================================

export async function getSource(
  provider: string,
  endpoint: string,
): Promise<ApiSource | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('api_sources')
    .select('*')
    .eq('provider', provider)
    .eq('endpoint', endpoint)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}

export async function getSourcesByProvider(
  provider: string,
): Promise<ApiSource[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('api_sources')
    .select('*')
    .eq('provider', provider)
    .eq('is_active', true)

  if (error) return []
  return data || []
}

export async function getAllSources(): Promise<ApiSource[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('api_sources')
    .select('*')
    .eq('is_active', true)
    .order('provider')

  if (error) return []
  return data || []
}

// ============================================================================
// Snapshot Operations
// ============================================================================

export async function createSnapshot(
  sourceId: string,
  snapshotType: SnapshotType = 'manual',
  clientId?: number,
): Promise<ApiSnapshot | null> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('api_snapshots')
    .insert({
      source_id: sourceId,
      client_id: clientId || null,
      snapshot_type: snapshotType,
      status: 'pending',
      total_records: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating snapshot:', error)
    return null
  }
  return data
}

export async function updateSnapshotStatus(
  snapshotId: string,
  status: 'processing' | 'completed' | 'failed',
  totalRecords?: number,
  errorMessage?: string,
): Promise<boolean> {
  const db = createAdminClient()

  const updates: Record<string, unknown> = { status }
  if (totalRecords !== undefined) updates.total_records = totalRecords
  if (errorMessage) updates.error_message = errorMessage
  if (status === 'completed') updates.completed_at = new Date().toISOString()

  const { error } = await db
    .from('api_snapshots')
    .update(updates)
    .eq('id', snapshotId)

  return !error
}

export async function getSnapshots(
  params: SnapshotQueryParams,
): Promise<ApiSnapshot[]> {
  const db = createAdminClient()
  let query = db
    .from('api_snapshots')
    .select('*, source:api_sources(*)')
    .order('created_at', { ascending: false })

  if (params.source_id) query = query.eq('source_id', params.source_id)
  if (params.client_id) query = query.eq('client_id', params.client_id)
  if (params.status) query = query.eq('status', params.status)
  if (params.start_date) query = query.gte('created_at', params.start_date)
  if (params.end_date) query = query.lte('created_at', params.end_date)

  const { data, error } = await query
  if (error) return []
  return data || []
}

export async function getLatestSnapshot(
  sourceId: string,
  clientId?: number,
): Promise<ApiSnapshot | null> {
  const db = createAdminClient()
  let query = db
    .from('api_snapshots')
    .select('*')
    .eq('source_id', sourceId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query.single()

  if (error) return null
  return data
}

export async function getLatestSnapshotForClient(
  clientId: number,
  provider?: string,
  endpoint?: string,
): Promise<ApiSnapshot | null> {
  const db = createAdminClient()

  let query = db
    .from('api_snapshots')
    .select('*, source:api_sources(*)')
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  // If provider/endpoint specified, filter by source
  if (provider || endpoint) {
    const source = await getSource(provider || '', endpoint || '')
    if (source) {
      query = query.eq('source_id', source.id)
    }
  }

  const { data, error } = await query.single()
  if (error) return null
  return data
}

// ============================================================================
// Record Operations with M2M Metrics
// ============================================================================

export async function saveRecordsWithMetrics(
  snapshotId: string,
  records: RecordWithMetricsInput[],
  clientId?: number,
): Promise<{ saved: number; error: boolean }> {
  const db = createAdminClient()

  try {
    // Insert records first
    const recordsToInsert = records.map((r) => ({
      snapshot_id: snapshotId,
      client_id: clientId || null,
      external_id: r.external_id,
      name: r.name || null,
      email: r.email || null,
      status: r.status || null,
      category: r.category || null,
      tags: r.tags || null,
      amount: r.amount || null,
      quantity: r.quantity || null,
      record_date: r.record_date || null,
      extra: r.extra || null,
    }))

    const { data: insertedRecords, error: recordsError } = await db
      .from('api_records')
      .insert(recordsToInsert)
      .select('id')

    if (recordsError || !insertedRecords) {
      throw new Error(recordsError?.message || 'Failed to insert records')
    }

    // Build metrics to insert (M2M)
    const metricsToInsert: Array<{
      record_id: string
      metric_name: string
      metric_value: number
      metric_unit: string | null
    }> = []

    records.forEach((record, index) => {
      if (record.metrics && record.metrics.length > 0) {
        const recordId = insertedRecords[index].id
        for (const metric of record.metrics) {
          metricsToInsert.push({
            record_id: recordId,
            metric_name: metric.metric_name,
            metric_value: metric.metric_value,
            metric_unit: metric.metric_unit || null,
          })
        }
      }
    })

    // Insert metrics if any
    if (metricsToInsert.length > 0) {
      const { error: metricsError } = await db
        .from('api_record_metrics')
        .insert(metricsToInsert)

      if (metricsError) {
        console.error('Error saving metrics:', metricsError)
        // Don't fail completely - records are saved
      }
    }

    // Update snapshot status
    await updateSnapshotStatus(snapshotId, 'completed', records.length)

    return { saved: records.length, error: false }
  } catch (err) {
    console.error('Error saving records:', err)
    await updateSnapshotStatus(
      snapshotId,
      'failed',
      0,
      err instanceof Error ? err.message : 'Unknown error',
    )
    return { saved: 0, error: true }
  }
}

export async function getRecords(
  params: RecordQueryParams,
): Promise<ApiRecord[]> {
  const db = createAdminClient()
  let query = db.from('api_records').select('*')

  if (params.snapshot_id) query = query.eq('snapshot_id', params.snapshot_id)
  if (params.client_id) query = query.eq('client_id', params.client_id)
  if (params.status) query = query.eq('status', params.status)
  if (params.category) query = query.eq('category', params.category)
  if (params.start_date) query = query.gte('record_date', params.start_date)
  if (params.end_date) query = query.lte('record_date', params.end_date)
  if (params.min_amount) query = query.gte('amount', params.min_amount)
  if (params.max_amount) query = query.lte('amount', params.max_amount)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

export async function getRecordsWithMetrics(
  snapshotId: string,
): Promise<ApiRecordWithMetrics[]> {
  const db = createAdminClient()

  // Get records
  const { data: records, error: recordsError } = await db
    .from('api_records')
    .select('*')
    .eq('snapshot_id', snapshotId)

  if (recordsError || !records) return []

  // Get all metrics for these records
  const recordIds = records.map((r) => r.id)
  const { data: metrics } = await db
    .from('api_record_metrics')
    .select('*')
    .in('record_id', recordIds)

  // Group metrics by record_id
  const metricsByRecord = new Map<string, ApiRecordMetric[]>()
  for (const metric of metrics || []) {
    const existing = metricsByRecord.get(metric.record_id) || []
    existing.push(metric)
    metricsByRecord.set(metric.record_id, existing)
  }

  // Combine records with their metrics
  return records.map((record) => ({
    ...record,
    metrics: metricsByRecord.get(record.id) || [],
  }))
}

// ============================================================================
// Metric Operations
// ============================================================================

export async function getMetricsForRecord(
  recordId: string,
): Promise<ApiRecordMetric[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('api_record_metrics')
    .select('*')
    .eq('record_id', recordId)

  if (error) return []
  return data || []
}

export async function addMetricsToRecord(
  recordId: string,
  metrics: MetricInput[],
): Promise<boolean> {
  const db = createAdminClient()

  const metricsToInsert = metrics.map((m) => ({
    record_id: recordId,
    metric_name: m.metric_name,
    metric_value: m.metric_value,
    metric_unit: m.metric_unit || null,
  }))

  const { error } = await db
    .from('api_record_metrics')
    .upsert(metricsToInsert, { onConflict: 'record_id,metric_name' })

  return !error
}

export async function getMetricAggregations(
  snapshotId: string,
): Promise<MetricAggregation[]> {
  const db = createAdminClient()

  // Get all record IDs for this snapshot
  const { data: records } = await db
    .from('api_records')
    .select('id')
    .eq('snapshot_id', snapshotId)

  if (!records || records.length === 0) return []

  const recordIds = records.map((r) => r.id)

  // Get all metrics for these records
  const { data: metrics } = await db
    .from('api_record_metrics')
    .select('metric_name, metric_value')
    .in('record_id', recordIds)

  if (!metrics || metrics.length === 0) return []

  // Aggregate by metric_name
  const aggregations = new Map<
    string,
    { values: number[]; sum: number; count: number }
  >()

  for (const metric of metrics) {
    const existing = aggregations.get(metric.metric_name) || {
      values: [],
      sum: 0,
      count: 0,
    }
    existing.values.push(Number(metric.metric_value))
    existing.sum += Number(metric.metric_value)
    existing.count += 1
    aggregations.set(metric.metric_name, existing)
  }

  // Convert to result format
  const results: MetricAggregation[] = []
  Array.from(aggregations.entries()).forEach(([name, agg]) => {
    results.push({
      metric_name: name,
      count: agg.count,
      sum: agg.sum,
      avg: agg.sum / agg.count,
      min: Math.min(...agg.values),
      max: Math.max(...agg.values),
    })
  })

  return results
}

// ============================================================================
// Comparison Operations
// ============================================================================

export async function compareSnapshots(
  baseSnapshotId: string,
  compareSnapshotId: string,
): Promise<{
  record_comparisons: ComparisonResult[]
  metric_comparisons: MetricComparison[]
}> {
  const baseMetrics = await getMetricAggregations(baseSnapshotId)
  const compareMetrics = await getMetricAggregations(compareSnapshotId)

  // Compare metrics
  const metricComparisons: MetricComparison[] = []
  const allMetricNames = new Set([
    ...baseMetrics.map((m) => m.metric_name),
    ...compareMetrics.map((m) => m.metric_name),
  ])

  for (const metricName of Array.from(allMetricNames)) {
    const base = baseMetrics.find((m) => m.metric_name === metricName)
    const compare = compareMetrics.find((m) => m.metric_name === metricName)

    const baseVal = base?.sum || 0
    const compareVal = compare?.sum || 0
    const changeAbs = compareVal - baseVal
    const changePct = baseVal !== 0 ? (changeAbs / baseVal) * 100 : 0

    metricComparisons.push({
      metric_name: metricName,
      base_value: baseVal,
      compare_value: compareVal,
      change_absolute: changeAbs,
      change_percent: Math.round(changePct * 100) / 100,
    })
  }

  // Compare record-level fields
  const db = createAdminClient()
  const recordComparisons: ComparisonResult[] = []

  for (const field of ['amount', 'quantity'] as const) {
    const { data: baseRecords } = await db
      .from('api_records')
      .select(field)
      .eq('snapshot_id', baseSnapshotId)

    const { data: compareRecords } = await db
      .from('api_records')
      .select(field)
      .eq('snapshot_id', compareSnapshotId)

    const baseVal = (baseRecords || []).reduce(
      (sum, r) => sum + (Number(r[field]) || 0),
      0,
    )
    const compareVal = (compareRecords || []).reduce(
      (sum, r) => sum + (Number(r[field]) || 0),
      0,
    )
    const changeAbs = compareVal - baseVal
    const changePct = baseVal !== 0 ? (changeAbs / baseVal) * 100 : 0

    if (baseVal !== 0 || compareVal !== 0) {
      recordComparisons.push({
        field,
        base_value: baseVal,
        compare_value: compareVal,
        change_absolute: changeAbs,
        change_percent: Math.round(changePct * 100) / 100,
      })
    }
  }

  return {
    record_comparisons: recordComparisons,
    metric_comparisons: metricComparisons,
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export async function deleteOldSnapshots(
  sourceId: string,
  keepDays: number = 90,
): Promise<number> {
  const db = createAdminClient()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - keepDays)

  const { data, error } = await db
    .from('api_snapshots')
    .delete()
    .eq('source_id', sourceId)
    .lt('created_at', cutoffDate.toISOString())
    .select('id')

  if (error) return 0
  return data?.length || 0
}

// ============================================================================
// Metric Definitions Operations
// ============================================================================

export async function getMetricDefinitions(
  provider?: string,
): Promise<MetricDefinition[]> {
  const db = createAdminClient()
  let query = db.from('metric_definitions').select('*').order('metric_name')

  if (provider) {
    // Get provider-specific and universal metrics
    query = query.or(`provider.eq.${provider},provider.is.null`)
  }

  const { data, error } = await query
  if (error) return []
  return data || []
}

export async function getMetricDefinition(
  metricName: string,
): Promise<MetricDefinition | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('metric_definitions')
    .select('*')
    .eq('metric_name', metricName)
    .single()

  if (error) return null
  return data
}

export async function createMetricDefinition(
  definition: Omit<MetricDefinition, 'created_at'>,
): Promise<MetricDefinition | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('metric_definitions')
    .insert(definition)
    .select()
    .single()

  if (error) {
    console.error('Error creating metric definition:', error)
    return null
  }
  return data
}

export async function updateMetricDefinition(
  metricName: string,
  updates: Partial<Omit<MetricDefinition, 'metric_name' | 'created_at'>>,
): Promise<boolean> {
  const db = createAdminClient()
  const { error } = await db
    .from('metric_definitions')
    .update(updates)
    .eq('metric_name', metricName)

  return !error
}

// ============================================================================
// Client-Scoped Convenience Functions
// ============================================================================

export async function getRecordsByClient(
  clientId: number,
  options: {
    sourceId?: string
    status?: string
    limit?: number
  } = {},
): Promise<ApiRecordWithMetrics[]> {
  const db = createAdminClient()

  let query = db
    .from('api_records')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (options.status) query = query.eq('status', options.status)
  if (options.limit) query = query.limit(options.limit)

  // If sourceId is provided, filter by snapshots from that source
  if (options.sourceId) {
    const { data: snapshots } = await db
      .from('api_snapshots')
      .select('id')
      .eq('source_id', options.sourceId)
      .eq('client_id', clientId)

    if (snapshots && snapshots.length > 0) {
      const snapshotIds = snapshots.map((s) => s.id)
      query = query.in('snapshot_id', snapshotIds)
    } else {
      return []
    }
  }

  const { data: records, error } = await query
  if (error || !records) return []

  // Get metrics for these records
  const recordIds = records.map((r) => r.id)
  const { data: metrics } = await db
    .from('api_record_metrics')
    .select('*')
    .in('record_id', recordIds)

  // Group metrics by record_id
  const metricsByRecord = new Map<string, ApiRecordMetric[]>()
  for (const metric of metrics || []) {
    const existing = metricsByRecord.get(metric.record_id) || []
    existing.push(metric)
    metricsByRecord.set(metric.record_id, existing)
  }

  return records.map((record) => ({
    ...record,
    metrics: metricsByRecord.get(record.id) || [],
  }))
}

export async function getClientMetricHistory(
  clientId: number,
  metricName: string,
  options: {
    sourceId?: string
    days?: number
  } = {},
): Promise<Array<{ date: string; value: number }>> {
  const db = createAdminClient()
  const days = options.days ?? 30
  const startDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString()

  // Get snapshots for this client
  let snapshotQuery = db
    .from('api_snapshots')
    .select('id, created_at')
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .order('created_at')

  if (options.sourceId) {
    snapshotQuery = snapshotQuery.eq('source_id', options.sourceId)
  }

  const { data: snapshots } = await snapshotQuery
  if (!snapshots || snapshots.length === 0) return []

  const snapshotIds = snapshots.map((s) => s.id)
  const snapshotDates = new Map(snapshots.map((s) => [s.id, s.created_at]))

  // Get records for these snapshots
  const { data: records } = await db
    .from('api_records')
    .select('id, snapshot_id')
    .in('snapshot_id', snapshotIds)

  if (!records || records.length === 0) return []

  const recordIds = records.map((r) => r.id)
  const recordSnapshots = new Map(records.map((r) => [r.id, r.snapshot_id]))

  // Get metrics
  const { data: metrics } = await db
    .from('api_record_metrics')
    .select('record_id, metric_value')
    .in('record_id', recordIds)
    .eq('metric_name', metricName)

  if (!metrics || metrics.length === 0) return []

  // Aggregate by snapshot date
  const valuesByDate = new Map<string, number[]>()
  for (const metric of metrics) {
    const snapshotId = recordSnapshots.get(metric.record_id)
    if (!snapshotId) continue
    const date = snapshotDates.get(snapshotId)
    if (!date) continue

    const dateKey = date.split('T')[0] // Just the date part
    const existing = valuesByDate.get(dateKey) || []
    existing.push(Number(metric.metric_value))
    valuesByDate.set(dateKey, existing)
  }

  // Calculate average per date
  return Array.from(valuesByDate.entries())
    .map(([date, values]) => ({
      date,
      value: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ============================================================================
// Source Management
// ============================================================================

export async function createSource(
  source: Omit<ApiSource, 'id' | 'created_at' | 'updated_at'>,
): Promise<ApiSource | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('api_sources')
    .insert(source)
    .select()
    .single()

  if (error) {
    console.error('Error creating source:', error)
    return null
  }
  return data
}

export async function updateSource(
  sourceId: string,
  updates: Partial<Omit<ApiSource, 'id' | 'created_at' | 'updated_at'>>,
): Promise<boolean> {
  const db = createAdminClient()
  const { error } = await db
    .from('api_sources')
    .update(updates)
    .eq('id', sourceId)

  return !error
}

export async function deactivateSource(sourceId: string): Promise<boolean> {
  return updateSource(sourceId, { is_active: false })
}
