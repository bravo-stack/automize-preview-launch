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

interface OmnisendContact {
  email: string
  contactID: string
  createdAt: string
  firstName: string
  lastName: string
  country: string
  countryCode: string
  state: string
  city: string
  postalCode: string
  address: string
  gender: string
  phone?: string[]
  birthdate: string
  status: string
  tags: string[]
  segments?: string[]
  statuses?: Array<{ channel: string; status: string; date: string }>
  optIns?: Array<{ channel: string; date: string }>
  consents?: Array<{
    channel: string
    source: string
    ip: string
    userAgent: string
    createdAt: string
  }>
  customProperties: Record<string, unknown>
  identifiers: Array<{
    id: string
    type: string
    channels: {
      email?: { status: string; statusDate: string }
      sms?: { status: string; statusDate: string }
    }
  }>
}

interface OmnisendContactsResponse {
  contacts: OmnisendContact[]
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

function mapContactToRecord(contact: OmnisendContact): RecordWithMetricsInput {
  return {
    external_id: contact.contactID,
    name:
      [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
      undefined,
    email: contact.email || undefined,
    status: contact.status || undefined,
    tags: contact.tags?.length ? contact.tags : undefined,
    record_date: contact.createdAt || undefined,
    attributes: [
      // Personal info
      { attribute_name: 'firstName', attribute_value: contact.firstName },
      { attribute_name: 'lastName', attribute_value: contact.lastName },
      { attribute_name: 'gender', attribute_value: contact.gender },
      { attribute_name: 'birthdate', attribute_value: contact.birthdate },
      { attribute_name: 'phone', attribute_value: contact.phone },
      { attribute_name: 'address', attribute_value: contact.address },
      { attribute_name: 'city', attribute_value: contact.city },
      { attribute_name: 'state', attribute_value: contact.state },
      { attribute_name: 'postalCode', attribute_value: contact.postalCode },
      { attribute_name: 'country', attribute_value: contact.country },
      { attribute_name: 'countryCode', attribute_value: contact.countryCode },
      // Subscription data
      { attribute_name: 'statuses', attribute_value: contact.statuses },
      { attribute_name: 'optIns', attribute_value: contact.optIns },
      { attribute_name: 'consents', attribute_value: contact.consents },
      // Segments & custom
      { attribute_name: 'segments', attribute_value: contact.segments },
      {
        attribute_name: 'customProperties',
        attribute_value: contact.customProperties,
      },
      // Identifiers
      { attribute_name: 'identifiers', attribute_value: contact.identifiers },
    ].filter((attr) => attr.attribute_value != null),
  }
}

async function getOrCreateSource() {
  let source = await getSource('omnisend', 'contacts')

  if (!source) {
    source = await createSource({
      provider: 'omnisend',
      endpoint: 'contacts',
      display_name: 'Omnisend Contacts',
      description: 'Contact data from Omnisend',
      refresh_interval_minutes: 60,
      is_active: true,
    })
  }

  return source
}

// --- Sync Logic (Per Client) ---

async function syncContacts(
  apiKey: string,
  clientId: number,
  brandName: string,
) {
  try {
    const data = await OmnisendClient.request<OmnisendContactsResponse>(
      apiKey,
      '/v3/contacts',
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

    const records = data.contacts.map(mapContactToRecord)
    const result = await saveRecordsWithMetrics(snapshot.id, records, clientId)

    if (result.error) {
      return { success: false, error: 'Failed to save records' }
    }

    return {
      success: true,
      clientId,
      brand: brandName,
      snapshotId: snapshot.id,
      totalContacts: data.contacts.length,
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
          return await syncContacts(apiKey, client.id, client.brand)
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
