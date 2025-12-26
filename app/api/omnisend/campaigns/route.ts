import {
  createSnapshot,
  createSource,
  getSource,
  saveRecordsWithMetrics,
  updateSnapshotStatus,
} from '@/lib/actions/api-storage'
import { decrypt } from '@/lib/crypto'
import { createAdminClient } from '@/lib/db/admin'
import { OmnisendClient } from '@/lib/services/omnisend-client'
import type { RecordWithMetricsInput } from '@/types/api-storage'
import { NextResponse } from 'next/server'
import pLimit from 'p-limit'

// --- Interfaces ---

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

interface ClientWithKey {
  id: number
  brand: string
  omni_keys: string
}

// --- Helpers ---

// Database fetch helper
async function getClientsWithKeys(): Promise<ClientWithKey[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('clients')
    .select('id, brand, omni_keys')
    .not('omni_keys', 'is', null)
    .eq('status', 'active')
  return data || []
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

// --- Sync Logic (Per Client) ---

async function syncCampaigns(
  apiKey: string,
  clientId: number,
  brandName: string,
) {
  try {
    const data = await OmnisendClient.request<OmnisendCampaignsResponse>(
      apiKey,
      '/v3/campaigns',
    )

    const source = await getOrCreateSource()
    if (!source) {
      return { success: false, error: 'Failed to get or create source' }
    }

    const snapshot = await createSnapshot(source.id, 'manual', clientId)
    if (!snapshot) {
      return { success: false, error: 'Failed to create snapshot' }
    }

    await updateSnapshotStatus(snapshot.id, 'processing')

    const records = data.campaign.map(mapCampaignToRecord)
    const result = await saveRecordsWithMetrics(snapshot.id, records, clientId)

    if (result.error) {
      return { success: false, error: 'Failed to save records' }
    }

    return {
      success: true,
      clientId,
      brand: brandName,
      snapshotId: snapshot.id,
      totalCampaigns: data.campaign.length,
      savedRecords: result.saved,
    }
  } catch (error: any) {
    console.error(
      `Sync failed for ${brandName} (ID: ${clientId}):`,
      error.message,
    )
    return { success: false, clientId, brand: brandName, error: error.message }
  }
}

// --- Batch Route Handler ---

export async function POST(req: Request) {
  try {
    // 1. Fetch all active clients with keys from DB
    const clients = await getClientsWithKeys()

    if (!clients.length) {
      return NextResponse.json({
        message: 'No active clients with Omnisend keys found.',
      })
    }

    // 2. Set Concurrency Limit
    const limit = pLimit(5)

    // 3. Map clients to rate-limited promises
    const tasks = clients.map((client) =>
      limit(async () => {
        try {
          // Decrypt ON SERVER side
          const apiKey = decrypt(client.omni_keys)

          // Execute sync
          return await syncCampaigns(apiKey, client.id, client.brand)
        } catch (err) {
          return {
            success: false,
            clientId: client.id,
            brand: client.brand,
            error: 'Decryption failed',
          }
        }
      }),
    )

    // 4. Wait for all to finish
    const results = await Promise.allSettled(tasks)

    // 5. Aggregate Results
    const successful = results
      .filter((r) => r.status === 'fulfilled' && r.value.success)
      .map((r) => (r as PromiseFulfilledResult<any>).value)

    const failed = results
      .filter(
        (r) =>
          r.status === 'rejected' ||
          (r.status === 'fulfilled' && !r.value.success),
      )
      .map((r) => {
        if (r.status === 'rejected') return { error: r.reason }
        return (r as PromiseFulfilledResult<any>).value
      })

    return NextResponse.json({
      summary: {
        totalProcessed: clients.length,
        successCount: successful.length,
        failCount: failed.length,
      },
      failures: failed,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Batch Error', details: error.message },
      { status: 500 },
    )
  }
}
