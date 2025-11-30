import {
  createSnapshot,
  createSource,
  getSource,
  saveRecordsWithMetrics,
  updateSnapshotStatus,
} from '@/lib/actions/api-storage'
import { OmnisendClient } from '@/lib/services/omnisend-client'
import type { RecordWithMetricsInput } from '@/types/api-storage'
import { NextResponse } from 'next/server'

interface DeviceStats {
  mobile: number
  tablet: number
  desktop: number
}

interface OmnisendCampaign {
  campaignID: string
  name: string
  status: string
  type: string
  fromName: string
  subject: string
  createdAt: string
  updatedAt: string
  startDate?: string
  endDate?: string
  sent: number
  clicked: number
  bounced: number
  complained: number
  opened: number
  unsubscribed: number
  allContacts: boolean
  segments?: string[]
  excludedSegments?: string[]
  byDevices: {
    opened: DeviceStats
    clicked: DeviceStats
  }
}

interface OmnisendCampaignsResponse {
  campaign: OmnisendCampaign[]
  paging: {
    previous: string | null
    next: string | null
    offset: number
    limit: number
  }
}

function mapCampaignToRecord(
  campaign: OmnisendCampaign,
): RecordWithMetricsInput {
  return {
    external_id: campaign.campaignID,
    name: campaign.name || undefined,
    status: campaign.status || undefined,
    record_date: campaign.createdAt || undefined,
    // Performance metrics (numeric)
    metrics: [
      {
        metric_name: 'sent',
        metric_value: campaign.sent,
        metric_unit: 'count',
      },
      {
        metric_name: 'opened',
        metric_value: campaign.opened,
        metric_unit: 'count',
      },
      {
        metric_name: 'clicked',
        metric_value: campaign.clicked,
        metric_unit: 'count',
      },
      {
        metric_name: 'bounced',
        metric_value: campaign.bounced,
        metric_unit: 'count',
      },
      {
        metric_name: 'unsubscribed',
        metric_value: campaign.unsubscribed,
        metric_unit: 'count',
      },
      {
        metric_name: 'complained',
        metric_value: campaign.complained,
        metric_unit: 'count',
      },
      // Device breakdown - opened
      {
        metric_name: 'opened_mobile',
        metric_value: campaign.byDevices?.opened?.mobile ?? 0,
        metric_unit: 'count',
      },
      {
        metric_name: 'opened_tablet',
        metric_value: campaign.byDevices?.opened?.tablet ?? 0,
        metric_unit: 'count',
      },
      {
        metric_name: 'opened_desktop',
        metric_value: campaign.byDevices?.opened?.desktop ?? 0,
        metric_unit: 'count',
      },
      // Device breakdown - clicked
      {
        metric_name: 'clicked_mobile',
        metric_value: campaign.byDevices?.clicked?.mobile ?? 0,
        metric_unit: 'count',
      },
      {
        metric_name: 'clicked_tablet',
        metric_value: campaign.byDevices?.clicked?.tablet ?? 0,
        metric_unit: 'count',
      },
      {
        metric_name: 'clicked_desktop',
        metric_value: campaign.byDevices?.clicked?.desktop ?? 0,
        metric_unit: 'count',
      },
    ],
    // Non-numeric attributes
    attributes: [
      { attribute_name: 'fromName', attribute_value: campaign.fromName },
      { attribute_name: 'subject', attribute_value: campaign.subject },
      { attribute_name: 'type', attribute_value: campaign.type },
      { attribute_name: 'startDate', attribute_value: campaign.startDate },
      { attribute_name: 'endDate', attribute_value: campaign.endDate },
      { attribute_name: 'updatedAt', attribute_value: campaign.updatedAt },
    ].filter((attr) => attr.attribute_value != null),
  }
}

async function getOrCreateSource() {
  let source = await getSource('omnisend', 'campaigns')

  if (!source) {
    source = await createSource({
      provider: 'omnisend',
      endpoint: 'campaigns',
      display_name: 'Omnisend Campaigns',
      description: 'Email campaigns from Omnisend',
      refresh_interval_minutes: 60,
      is_active: true,
    })
  }

  return source
}

export async function POST() {
  try {
    const data =
      await OmnisendClient.request<OmnisendCampaignsResponse>('/v3/campaigns')

    const source = await getOrCreateSource()
    if (!source) {
      return NextResponse.json(
        { success: false, error: 'Failed to get or create source' },
        { status: 500 },
      )
    }

    const snapshot = await createSnapshot(source.id, 'manual')
    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: 'Failed to create snapshot' },
        { status: 500 },
      )
    }

    await updateSnapshotStatus(snapshot.id, 'processing')

    const records = data.campaign.map(mapCampaignToRecord)
    const result = await saveRecordsWithMetrics(snapshot.id, records)

    if (result.error) {
      return NextResponse.json(
        { success: false, error: 'Failed to save records' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      snapshotId: snapshot.id,
      totalCampaigns: data.campaign.length,
      savedRecords: result.saved,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
