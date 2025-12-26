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
import pLimit from 'p-limit' // 1. Import concurrency controller

interface OrderAddress {
  firstName: string
  lastName: string
  country: string
  countryCode: string
  state: string
  stateCode: string
  city: string
  address: string
  address2: string
  company: string
  postalCode: string
  phone: string
}

interface OrderProduct {
  productID: string
  variantID: string
  title: string
  variantTitle: string
  quantity: number
  price: number
  discount: number
  weight: number
  sku: string
  vendor: string
  productUrl: string
  imageUrl: string
  categoryIDs: string[] | null
  tags: string[] | null
}

interface OmnisendOrder {
  orderID: string
  email: string
  phone: string
  contactID: string
  cartID: string
  attributionID: string
  trackingCode: string
  courierTitle: string
  courierUrl: string
  orderUrl: string
  source: string
  tags: string[]
  currency: string
  orderSum: number
  subTotalSum: number
  subTotalTaxIncluded: boolean
  discountSum: number
  taxSum: number
  createdAt: string
  updatedAt: string
  paymentMethod: string
  paymentStatus: string
  billingAddress: OrderAddress
  shippingAddress: OrderAddress
  canceledDate: string | null
  cancelReason: string
  orderNumber: number
  contactNote: string
  discountCode: string
  discountType: string
  discountValue: number
  shippingSum: number
  shippingMethod: string
  fulfillmentStatus: string
  products: OrderProduct[]
  depersonalized: boolean
}

interface OmnisendOrdersResponse {
  orders: OmnisendOrder[]
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

// Replace this with your actual DB client (Supabase, Prisma, Drizzle, etc.)
async function getClientsWithKeys(): Promise<ClientWithKey[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('clients')
    .select('id, brand, omni_keys')
    .not('omni_keys', 'is', null)
    .eq('status', 'active')
  return data || []
}

function mapOrderToRecord(order: OmnisendOrder): RecordWithMetricsInput {
  return {
    external_id: order.orderID,
    name: `Order #${order.orderNumber}`,
    email: order.email || undefined,
    status: order.fulfillmentStatus || undefined,
    tags: order.tags?.length ? order.tags : undefined,
    amount: order.orderSum || undefined,
    record_date: order.createdAt || undefined,
    attributes: [
      // Identity & Source
      { attribute_name: 'orderNumber', attribute_value: order.orderNumber },
      { attribute_name: 'contactID', attribute_value: order.contactID },
      { attribute_name: 'phone', attribute_value: order.phone },
      { attribute_name: 'source', attribute_value: order.source },
      { attribute_name: 'attributionID', attribute_value: order.attributionID },
      { attribute_name: 'trackingCode', attribute_value: order.trackingCode },
      // Financial & Payment
      { attribute_name: 'currency', attribute_value: order.currency },
      { attribute_name: 'subTotalSum', attribute_value: order.subTotalSum },
      { attribute_name: 'discountSum', attribute_value: order.discountSum },
      { attribute_name: 'taxSum', attribute_value: order.taxSum },
      { attribute_name: 'shippingSum', attribute_value: order.shippingSum },
      { attribute_name: 'paymentStatus', attribute_value: order.paymentStatus },
      { attribute_name: 'paymentMethod', attribute_value: order.paymentMethod },
      { attribute_name: 'discountCode', attribute_value: order.discountCode },
      { attribute_name: 'discountType', attribute_value: order.discountType },
      { attribute_name: 'discountValue', attribute_value: order.discountValue },
      // Timestamps
      { attribute_name: 'updatedAt', attribute_value: order.updatedAt },
      { attribute_name: 'canceledDate', attribute_value: order.canceledDate },
      { attribute_name: 'cancelReason', attribute_value: order.cancelReason },
      // Addresses
      {
        attribute_name: 'billingAddress',
        attribute_value: order.billingAddress,
      },
      {
        attribute_name: 'shippingAddress',
        attribute_value: order.shippingAddress,
      },
      // Fulfillment & Shipping
      {
        attribute_name: 'shippingMethod',
        attribute_value: order.shippingMethod,
      },
      { attribute_name: 'courierTitle', attribute_value: order.courierTitle },
      { attribute_name: 'courierUrl', attribute_value: order.courierUrl },
      { attribute_name: 'orderUrl', attribute_value: order.orderUrl },
      // Products
      { attribute_name: 'products', attribute_value: order.products },
      // Misc
      { attribute_name: 'contactNote', attribute_value: order.contactNote },
      {
        attribute_name: 'depersonalized',
        attribute_value: order.depersonalized,
      },
    ].filter((attr) => attr.attribute_value != null),
  }
}

async function getOrCreateSource() {
  let source = await getSource('omnisend', 'orders')

  if (!source) {
    source = await createSource({
      provider: 'omnisend',
      endpoint: 'orders',
      display_name: 'Omnisend Orders',
      description: 'Order data from Omnisend',
      refresh_interval_minutes: 60,
      is_active: true,
    })
  }

  return source
}

async function syncOrders(apiKey: string, clientId: number, brandName: string) {
  try {
    const data = await OmnisendClient.request<OmnisendOrdersResponse>(
      apiKey,
      '/v3/orders',
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

    const records = data.orders.map(mapOrderToRecord)
    const result = await saveRecordsWithMetrics(snapshot.id, records, clientId)

    if (result.error) {
      return { success: false, error: 'Failed to save records' }
    }

    return {
      success: true,
      clientId,
      brand: brandName,
      snapshotId: snapshot.id,
      totalOrders: data.orders.length,
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

export async function POST(req: Request) {
  try {
    // 1. Fetch all active clients with keys from DB
    const clients = await getClientsWithKeys()

    if (!clients.length) {
      return NextResponse.json({
        message: 'No active clients with Omnisend keys found.',
      })
    }

    // 2. Set Concurrency Limit (e.g., process 5 clients at a time)
    const limit = pLimit(5)

    // 3. Map clients to rate-limited promises
    const tasks = clients.map((client) =>
      limit(async () => {
        try {
          // Decrypt ON SERVER side
          const apiKey = decrypt(client.omni_keys)

          // Execute sync
          return await syncOrders(apiKey, client.id, client.brand)
        } catch (err) {
          // Catch decryption errors specifically
          return {
            success: false,
            clientId: client.id,
            brand: client.brand,
            error: 'Decryption failed',
          }
        }
      }),
    )

    // 4. Wait for all to finish (Promise.allSettled ensures one crash doesn't stop the others)
    const results = await Promise.allSettled(tasks)

    // 5. Aggregate Results for the Response
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
