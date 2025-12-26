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

interface OmnisendAutomation {
  id: string
  name: string
  status: string
  trigger: string
  createdAt: string
  updatedAt?: string
  messages?: Array<{
    id: string
    title: string
    channel: string
  }>
}

interface OmnisendAutomationsResponse {
  automations: OmnisendAutomation[]
}

interface ClientWithKey {
  id: number
  brand: string
  omni_keys: string
}

async function getClientsWithKeys(): Promise<ClientWithKey[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('clients')
    .select('id, brand, omni_keys')
    .not('omni_keys', 'is', null)
    .eq('status', 'active')
  return data || []
}

function mapAutomationToRecord(
  automation: OmnisendAutomation,
): RecordWithMetricsInput {
  return {
    external_id: automation.id,
    name: automation.name || undefined,
    status: automation.status || undefined,
    record_date: automation.createdAt || undefined,
    attributes: [
      { attribute_name: 'trigger', attribute_value: automation.trigger },
      { attribute_name: 'messages', attribute_value: automation.messages },
      { attribute_name: 'updatedAt', attribute_value: automation.updatedAt },
    ].filter((attr) => attr.attribute_value != null),
  }
}

async function getOrCreateSource() {
  let source = await getSource('omnisend', 'automations')

  if (!source) {
    source = await createSource({
      provider: 'omnisend',
      endpoint: 'automations',
      display_name: 'Omnisend Automations',
      description: 'Automation workflows from Omnisend',
      refresh_interval_minutes: 60,
      is_active: true,
    })
  }

  return source
}

async function syncAutomations(
  apiKey: string,
  clientId: number,
  brandName: string,
) {
  try {
    const data = await OmnisendClient.request<OmnisendAutomationsResponse>(
      apiKey,
      '/v5/automations',
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

    const records = data.automations.map(mapAutomationToRecord)
    const result = await saveRecordsWithMetrics(snapshot.id, records, clientId)

    if (result.error) {
      return { success: false, error: 'Failed to save records' }
    }

    return {
      success: true,
      clientId,
      brand: brandName,
      snapshotId: snapshot.id,
      totalAutomations: data.automations.length,
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
          return await syncAutomations(apiKey, client.id, client.brand)
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
