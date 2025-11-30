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

export async function POST() {
  try {
    const data =
      await OmnisendClient.request<OmnisendOrdersResponse>('/v3/orders')

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

    const records = data.orders.map(mapOrderToRecord)
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
      totalOrders: data.orders.length,
      savedRecords: result.saved,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
