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

export async function POST() {
  try {
    // Fetch contacts from Omnisend
    const data =
      await OmnisendClient.request<OmnisendContactsResponse>('/v3/contacts')

    // Get or create the source
    const source = await getOrCreateSource()
    if (!source) {
      return NextResponse.json(
        { success: false, error: 'Failed to get or create source' },
        { status: 500 },
      )
    }

    // Create snapshot
    const snapshot = await createSnapshot(source.id, 'manual')
    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: 'Failed to create snapshot' },
        { status: 500 },
      )
    }

    await updateSnapshotStatus(snapshot.id, 'processing')

    // Map and save records
    const records = data.contacts.map(mapContactToRecord)
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
      totalContacts: data.contacts.length,
      savedRecords: result.saved,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
