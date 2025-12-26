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

interface OmnisendProduct {
  productID: string
  title: string
  status: string
  description: string
  currency: string
  images?: Array<{
    imageID: string
    url: string
    isDefault: boolean
    variantIDs: string[]
  }>
  productUrl: string
  vendor: string
  type: string
  categoryIDs?: string[]
  tags?: string[]
  createdAt: string
  updatedAt: string
  variants: Array<{
    variantID: string
    title: string
    sku: string
    price: number
    oldPrice: number
    productUrl: string
    status: string
    imageID: string
  }>
}

interface OmnisendProductsResponse {
  products: OmnisendProduct[]
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

function mapProductToRecord(product: OmnisendProduct): RecordWithMetricsInput {
  return {
    external_id: product.productID,
    name: product.title || undefined,
    status: product.status || undefined,
    category: product.type || undefined,
    tags: product.tags?.length ? product.tags : undefined,
    record_date: product.createdAt || undefined,
    attributes: [
      { attribute_name: 'description', attribute_value: product.description },
      { attribute_name: 'vendor', attribute_value: product.vendor },
      { attribute_name: 'currency', attribute_value: product.currency },
      { attribute_name: 'productUrl', attribute_value: product.productUrl },
      { attribute_name: 'categoryIDs', attribute_value: product.categoryIDs },
      { attribute_name: 'images', attribute_value: product.images },
      { attribute_name: 'variants', attribute_value: product.variants },
      { attribute_name: 'updatedAt', attribute_value: product.updatedAt },
    ].filter((attr) => attr.attribute_value != null),
  }
}

async function getOrCreateSource() {
  let source = await getSource('omnisend', 'products')

  if (!source) {
    source = await createSource({
      provider: 'omnisend',
      endpoint: 'products',
      display_name: 'Omnisend Products',
      description: 'Product catalog from Omnisend',
      refresh_interval_minutes: 60,
      is_active: true,
    })
  }

  return source
}

// --- Sync Logic (Per Client) ---

async function syncProducts(
  apiKey: string,
  clientId: number,
  brandName: string,
) {
  try {
    const data = await OmnisendClient.request<OmnisendProductsResponse>(
      apiKey,
      '/v3/products',
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

    const records = data.products.map(mapProductToRecord)
    const result = await saveRecordsWithMetrics(snapshot.id, records, clientId)

    if (result.error) {
      return { success: false, error: 'Failed to save records' }
    }

    return {
      success: true,
      clientId,
      brand: brandName,
      snapshotId: snapshot.id,
      totalProducts: data.products.length,
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
          return await syncProducts(apiKey, client.id, client.brand)
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
