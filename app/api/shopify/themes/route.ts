import {
  createSnapshot,
  createSource,
  getSource,
  updateSnapshotStatus,
} from '@/lib/actions/api-storage'
import { decrypt } from '@/lib/crypto'
import { createAdminClient } from '@/lib/db/admin'
import type { RecordWithMetricsInput } from '@/types/api-storage'
import { NextResponse } from 'next/server'

interface ShopifyTheme {
  id: number
  name: string
  created_at: string
  updated_at: string
  role: string
  theme_store_id: number | null
  previewable: boolean
  processing: boolean
  admin_graphql_api_id: string
}

interface ShopifyThemesResponse {
  themes: ShopifyTheme[]
}

interface Client {
  id: number
  brand: string
  store_id: string
  shopify_key: string
}

function mapThemeToRecord(
  theme: ShopifyTheme,
  client: Client,
): RecordWithMetricsInput {
  return {
    external_id: theme.id.toString(),
    name: theme.name || undefined,
    status: theme.role || undefined,
    category: 'theme',
    record_date: theme.created_at || undefined,
    extra: {
      store_id: client.store_id,
      brand_name: client.brand,
      theme_store_id: theme.theme_store_id,
      previewable: theme.previewable,
      processing: theme.processing,
      admin_graphql_api_id: theme.admin_graphql_api_id,
    },
    attributes: [
      { attribute_name: 'store_id', attribute_value: client.store_id },
      { attribute_name: 'brand_name', attribute_value: client.brand },
      { attribute_name: 'role', attribute_value: theme.role },
      {
        attribute_name: 'theme_store_id',
        attribute_value: theme.theme_store_id,
      },
      { attribute_name: 'previewable', attribute_value: theme.previewable },
      { attribute_name: 'processing', attribute_value: theme.processing },
      {
        attribute_name: 'admin_graphql_api_id',
        attribute_value: theme.admin_graphql_api_id,
      },
      { attribute_name: 'updated_at', attribute_value: theme.updated_at },
    ].filter((attr) => attr.attribute_value != null),
  }
}

async function getOrCreateSource() {
  let source = await getSource('shopify', 'themes')

  if (!source) {
    source = await createSource({
      provider: 'shopify',
      endpoint: 'themes',
      display_name: 'Shopify Themes',
      description: 'Theme configurations from Shopify stores',
      refresh_interval_minutes: 1440,
      is_active: true,
    })
  }

  return source
}

async function fetchShopifyThemes(
  storeId: string,
  accessToken: string,
): Promise<ShopifyTheme[]> {
  // Fetch only main/published themes using role filter
  const url = `https://${storeId}.myshopify.com/admin/api/2025-07/themes.json?role=main`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.statusText}`)
  }

  const data: ShopifyThemesResponse = await response.json()
  return data.themes
}

async function upsertThemeRecord(
  db: ReturnType<typeof createAdminClient>,
  snapshotId: string,
  clientId: number,
  record: RecordWithMetricsInput,
) {
  // Check if record exists for this client and external_id
  const { data: existingRecord } = await db
    .from('api_records')
    .select('id')
    .eq('client_id', clientId)
    .eq('external_id', record.external_id)
    .single()

  if (existingRecord) {
    // Update existing record
    const { error: updateError } = await db
      .from('api_records')
      .update({
        snapshot_id: snapshotId,
        name: record.name || null,
        status: record.status || null,
        category: record.category || null,
        record_date: record.record_date || null,
        extra: record.extra || null,
      })
      .eq('id', existingRecord.id)

    if (updateError) {
      console.error('Error updating record:', updateError)
      return { success: false, recordId: null }
    }

    // Delete old attributes and insert new ones
    await db
      .from('api_record_attributes')
      .delete()
      .eq('record_id', existingRecord.id)

    if (record.attributes && record.attributes.length > 0) {
      const attributesToInsert = record.attributes.map((attr) => ({
        record_id: existingRecord.id,
        attribute_name: attr.attribute_name,
        attribute_value: attr.attribute_value,
      }))

      await db.from('api_record_attributes').insert(attributesToInsert)
    }

    return { success: true, recordId: existingRecord.id }
  } else {
    // Insert new record
    const { data: newRecord, error: insertError } = await db
      .from('api_records')
      .insert({
        snapshot_id: snapshotId,
        client_id: clientId,
        external_id: record.external_id,
        name: record.name || null,
        status: record.status || null,
        category: record.category || null,
        record_date: record.record_date || null,
        extra: record.extra || null,
      })
      .select('id')
      .single()

    if (insertError || !newRecord) {
      console.error('Error inserting record:', insertError)
      return { success: false, recordId: null }
    }

    // Insert attributes
    if (record.attributes && record.attributes.length > 0) {
      const attributesToInsert = record.attributes.map((attr) => ({
        record_id: newRecord.id,
        attribute_name: attr.attribute_name,
        attribute_value: attr.attribute_value,
      }))

      await db.from('api_record_attributes').insert(attributesToInsert)
    }

    return { success: true, recordId: newRecord.id }
  }
}

export async function POST(request: Request) {
  const db = createAdminClient()

  try {
    const source = await getOrCreateSource()
    if (!source) {
      return NextResponse.json(
        { success: false, error: 'Failed to get or create source' },
        { status: 500 },
      )
    }

    // Fetch clients with Shopify credentials
    const { data: clients, error: clientsError } = await db
      .from('clients')
      .select('id, brand, store_id, shopify_key')
      .not('shopify_key', 'is', null)
      .not('store_id', 'is', null)

    if (clientsError || !clients) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clients' },
        { status: 500 },
      )
    }

    // Check if streaming is requested
    const acceptHeader = request.headers.get('accept')
    const isStreaming = acceptHeader?.includes('text/event-stream')

    if (isStreaming) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          let totalThemes = 0
          let savedRecords = 0
          const errors: Array<{ client: string; error: string }> = []

          // Send initial progress
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'init', total: clients.length })}\n\n`,
            ),
          )

          for (let i = 0; i < clients.length; i++) {
            const client = clients[i]

            // Send progress update
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'progress', current: i + 1, total: clients.length, client: client.brand })}\n\n`,
              ),
            )

            try {
              const decryptedKey = decrypt(client.shopify_key)
              const themes = await fetchShopifyThemes(
                client.store_id,
                decryptedKey,
              )

              totalThemes += themes.length

              if (themes.length > 0) {
                const snapshot = await createSnapshot(
                  source.id,
                  'manual',
                  client.id,
                )
                if (snapshot) {
                  await updateSnapshotStatus(snapshot.id, 'processing')

                  for (const theme of themes) {
                    const record = mapThemeToRecord(theme, client)
                    const result = await upsertThemeRecord(
                      db,
                      snapshot.id,
                      client.id,
                      record,
                    )

                    if (result.success) {
                      savedRecords++
                    }
                  }

                  await updateSnapshotStatus(
                    snapshot.id,
                    'completed',
                    themes.length,
                  )
                } else {
                  errors.push({
                    client: client.brand,
                    error: 'Failed to create snapshot',
                  })
                }
              }
            } catch (error: any) {
              errors.push({
                client: client.brand,
                error: error.message,
              })
            }
          }

          // Send final result
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'complete', success: true, totalClients: clients.length, totalThemes, savedRecords, errors: errors.length > 0 ? errors : undefined })}\n\n`,
            ),
          )
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Non-streaming fallback
    let totalThemes = 0
    let savedRecords = 0
    const errors: Array<{ client: string; error: string }> = []

    // Process each client
    for (const client of clients) {
      try {
        const decryptedKey = decrypt(client.shopify_key)
        const themes = await fetchShopifyThemes(client.store_id, decryptedKey)

        totalThemes += themes.length

        if (themes.length === 0) {
          continue
        }

        // Create snapshot for this client
        const snapshot = await createSnapshot(source.id, 'manual', client.id)
        if (!snapshot) {
          errors.push({
            client: client.brand,
            error: 'Failed to create snapshot',
          })
          continue
        }

        await updateSnapshotStatus(snapshot.id, 'processing')

        // Upsert each theme (already filtered to main only from API)
        for (const theme of themes) {
          const record = mapThemeToRecord(theme, client)
          const result = await upsertThemeRecord(
            db,
            snapshot.id,
            client.id,
            record,
          )

          if (result.success) {
            savedRecords++
          }
        }

        // Update snapshot status
        await updateSnapshotStatus(snapshot.id, 'completed', themes.length)
      } catch (error: any) {
        errors.push({
          client: client.brand,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalClients: clients.length,
      totalThemes,
      savedRecords,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
