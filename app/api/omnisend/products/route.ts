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

export async function POST() {
  try {
    const data =
      await OmnisendClient.request<OmnisendProductsResponse>('/v3/products')

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

    const records = data.products.map(mapProductToRecord)
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
      totalProducts: data.products.length,
      savedRecords: result.saved,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
