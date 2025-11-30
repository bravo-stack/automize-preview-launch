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

function mapAutomationToRecord(
  automation: OmnisendAutomation,
): RecordWithMetricsInput {
  return {
    external_id: automation.id,
    name: automation.name || undefined,
    status: automation.status || undefined,
    record_date: automation.createdAt || undefined,
    // Only storing ID, name, and status as requested
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

export async function POST() {
  try {
    const data =
      await OmnisendClient.request<OmnisendAutomationsResponse>(
        '/v5/automations',
      )

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

    const records = data.automations.map(mapAutomationToRecord)
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
      totalAutomations: data.automations.length,
      savedRecords: result.saved,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
