'use server'

import { createClient } from './server'

export type RefreshType = 'financialx' | 'autometric'
export type RefreshStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface SnapshotMetric {
  account_name: string
  pod?: string
  is_monitored?: boolean
  ad_spend_timeframe?: number
  roas_timeframe?: number
  fb_revenue_timeframe?: number
  shopify_revenue_timeframe?: number
  orders_timeframe?: number
  ad_spend_rebill?: number
  roas_rebill?: number
  fb_revenue_rebill?: number
  shopify_revenue_rebill?: number
  orders_rebill?: number
  rebill_status?: string
  last_rebill_date?: string
  cpa_purchase?: number
  cpc?: number
  cpm?: number
  ctr?: number
  quality_ranking?: string
  engagement_rate_ranking?: string
  conversion_rate_ranking?: string
  impressions?: number
  hook_rate?: number
  atc_rate?: number
  ic_rate?: number
  purchase_rate?: number
  bounce_rate?: number
}

export interface CreateSnapshotParams {
  sheetId: number
  refreshType: RefreshType
  datePreset?: string
  metadata?: Record<string, any>
}

export interface SaveMetricsParams {
  snapshotId: string
  metrics: SnapshotMetric[]
}

export async function createRefreshSnapshot({
  sheetId,
  refreshType,
  datePreset,
  metadata = {},
}: CreateSnapshotParams) {
  const db = createClient()

  const { data: existingSnapshot } = await db
    .from('sheet_refresh_snapshots')
    .select('id, refresh_status, snapshot_date')
    .eq('sheet_id', sheetId)
    .eq('refresh_type', refreshType)
    .eq('date_preset', datePreset || '')
    .gte('snapshot_date', new Date().toISOString().split('T')[0])
    .single()

  if (existingSnapshot) {
    const { error: deleteMetricsError } = await db
      .from('refresh_snapshot_metrics')
      .delete()
      .eq('snapshot_id', existingSnapshot.id)

    if (deleteMetricsError) {
      return { success: false, error: deleteMetricsError.message }
    }

    const { error: updateError } = await db
      .from('sheet_refresh_snapshots')
      .update({
        refresh_status: 'in_progress',
        updated_at: new Date().toISOString(),
        metadata,
      })
      .eq('id', existingSnapshot.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return {
      success: true,
      snapshotId: existingSnapshot.id,
      isUpdate: true,
    }
  }

  const { data, error } = await db
    .from('sheet_refresh_snapshots')
    .insert({
      sheet_id: sheetId,
      refresh_type: refreshType,
      date_preset: datePreset || null,
      refresh_status: 'in_progress',
      metadata,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, snapshotId: data.id }
}

export async function updateSnapshotStatus(
  snapshotId: string,
  status: RefreshStatus,
  errorMessage?: string,
) {
  const db = createClient()

  const updateData: any = {
    refresh_status: status,
    updated_at: new Date().toISOString(),
  }

  if (errorMessage) {
    updateData.metadata = { error: errorMessage }
  }

  const { error } = await db
    .from('sheet_refresh_snapshots')
    .update(updateData)
    .eq('id', snapshotId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function saveSnapshotMetrics({
  snapshotId,
  metrics,
}: SaveMetricsParams) {
  const db = createClient()

  const metricsToInsert = metrics.map((metric) => ({
    snapshot_id: snapshotId,
    ...metric,
  }))

  const { error } = await db
    .from('refresh_snapshot_metrics')
    .insert(metricsToInsert)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getLatestSnapshot(
  sheetId: number,
  refreshType: RefreshType,
) {
  const db = createClient()

  const { data, error } = await db
    .from('sheet_refresh_snapshots')
    .select(
      `
      *,
      refresh_snapshot_metrics (*)
    `,
    )
    .eq('sheet_id', sheetId)
    .eq('refresh_type', refreshType)
    .eq('refresh_status', 'completed')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getSnapshotHistory(
  sheetId: number,
  refreshType: RefreshType,
  limit = 30,
) {
  const db = createClient()

  const { data, error } = await db
    .from('sheet_refresh_snapshots')
    .select('id, snapshot_date, refresh_status, date_preset, metadata')
    .eq('sheet_id', sheetId)
    .eq('refresh_type', refreshType)
    .order('snapshot_date', { ascending: false })
    .limit(limit)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function compareSnapshots(
  snapshotId1: string,
  snapshotId2: string,
) {
  const db = createClient()

  const { data: snapshot1Metrics } = await db
    .from('refresh_snapshot_metrics')
    .select('*')
    .eq('snapshot_id', snapshotId1)

  const { data: snapshot2Metrics } = await db
    .from('refresh_snapshot_metrics')
    .select('*')
    .eq('snapshot_id', snapshotId2)

  if (!snapshot1Metrics || !snapshot2Metrics) {
    return { success: false, error: 'Failed to fetch snapshot metrics' }
  }

  const comparison = snapshot1Metrics.map((m1) => {
    const m2 = snapshot2Metrics.find((m) => m.account_name === m1.account_name)

    return {
      account_name: m1.account_name,
      pod: m1.pod,
      shopify_revenue_change:
        m2 && m1.shopify_revenue_timeframe && m2.shopify_revenue_timeframe
          ? m1.shopify_revenue_timeframe - m2.shopify_revenue_timeframe
          : null,
      roas_change:
        m2 && m1.roas_timeframe && m2.roas_timeframe
          ? m1.roas_timeframe - m2.roas_timeframe
          : null,
      spend_change:
        m2 && m1.ad_spend_timeframe && m2.ad_spend_timeframe
          ? m1.ad_spend_timeframe - m2.ad_spend_timeframe
          : null,
    }
  })

  return { success: true, data: comparison }
}
