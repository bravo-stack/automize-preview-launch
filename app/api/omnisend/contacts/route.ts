import {
  createSnapshot,
  getSource,
  saveRecordsWithMetrics,
  updateSnapshotStatus,
} from '@/lib/actions/api-storage'
import { OmnisendClient } from '@/lib/services/omnisend-client'
import type { RecordWithMetricsInput } from '@/types/api-storage'
import { NextResponse } from 'next/server'

// Response types from Omnisend API
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

/**
 * Maps an Omnisend contact to the API storage record format
 */
function mapContactToRecord(contact: OmnisendContact): RecordWithMetricsInput {
  // Get email and SMS status from identifiers
  const emailIdentifier = contact.identifiers?.find((i) => i.channels?.email)
    ?.channels?.email
  const smsIdentifier = contact.identifiers?.find((i) => i.channels?.sms)
    ?.channels?.sms

  // Count subscribed channels
  const subscribedChannels =
    contact.statuses?.filter((s) => s.status === 'subscribed').length ?? 0

  // Count opt-ins
  const optInCount = contact.optIns?.length ?? 0

  // Count consents
  const consentCount = contact.consents?.length ?? 0

  return {
    external_id: contact.contactID,
    name:
      [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
      undefined,
    email: contact.email || undefined,
    status: contact.status || undefined,
    category: contact.gender || undefined,
    tags: contact.tags?.length ? contact.tags : undefined,
    record_date: contact.createdAt || undefined,
    extra: {
      country: contact.country,
      countryCode: contact.countryCode,
      state: contact.state,
      city: contact.city,
      postalCode: contact.postalCode,
      address: contact.address,
      phone: contact.phone,
      birthdate: contact.birthdate,
      segments: contact.segments,
      customProperties: contact.customProperties,
      emailStatus: emailIdentifier?.status,
      smsStatus: smsIdentifier?.status,
    },
    metrics: [
      {
        metric_name: 'subscribed_channels',
        metric_value: subscribedChannels,
        metric_unit: 'count',
      },
      {
        metric_name: 'opt_in_count',
        metric_value: optInCount,
        metric_unit: 'count',
      },
      {
        metric_name: 'consent_count',
        metric_value: consentCount,
        metric_unit: 'count',
      },
      {
        metric_name: 'tag_count',
        metric_value: contact.tags?.length ?? 0,
        metric_unit: 'count',
      },
      {
        metric_name: 'segment_count',
        metric_value: contact.segments?.length ?? 0,
        metric_unit: 'count',
      },
    ],
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
      ? parseInt(searchParams.get('clientId')!, 10)
      : undefined
    const store = searchParams.get('store') === 'true'

    // Fetch contacts from Omnisend
    const data =
      await OmnisendClient.request<OmnisendContactsResponse>('/v3/contacts')

    // If store flag is not set, just return the raw data
    if (!store) {
      return NextResponse.json({ success: true, data })
    }

    // Get or validate the source exists
    const source = await getSource('omnisend', 'contacts')
    if (!source) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Source "omnisend/contacts" not found. Please seed the database first.',
        },
        { status: 404 },
      )
    }

    // Create a new snapshot
    const snapshot = await createSnapshot(source.id, 'manual', clientId)
    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: 'Failed to create snapshot' },
        { status: 500 },
      )
    }

    try {
      // Update snapshot to processing
      await updateSnapshotStatus(snapshot.id, 'processing')

      // Map contacts to records
      const records = data.contacts.map(mapContactToRecord)

      // Save records with metrics
      const result = await saveRecordsWithMetrics(
        snapshot.id,
        records,
        clientId,
      )

      if (result.error) {
        return NextResponse.json(
          { success: false, error: 'Failed to save records' },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          snapshotId: snapshot.id,
          totalContacts: data.contacts.length,
          savedRecords: result.saved,
          paging: data.paging,
        },
      })
    } catch (err) {
      // Update snapshot to failed on error
      await updateSnapshotStatus(
        snapshot.id,
        'failed',
        0,
        err instanceof Error ? err.message : 'Unknown error',
      )
      throw err
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
