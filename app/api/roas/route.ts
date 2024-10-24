import { NextRequest, NextResponse } from 'next/server'
import { emptyInsights } from '@/content/accounts'
import { appendDataToSheet } from '@/lib/api'
import {
  getActions,
  getBounceRate,
  getCPA,
  getHookRate,
  getPercentage,
} from '@/lib/insights'
import { createClient } from '@/lib/db/server'

const datePresets = ['yesterday', 'last_3d', 'last_7d', 'last_14d', 'last_30d']

// MAIN GET
export async function POST(request: NextRequest) {
  const db = createClient()
  const { sheetID, datePreset, pod } = await request.json()

  const { data: accounts } = await db
    .from('account')
    .select('name, account_id, pod')
    .eq('pod', pod)
    .order('name', { ascending: true })

  if (accounts === null) {
    return NextResponse.json(
      { error: 'No accounts found.' },
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN

  async function fetchInsights(accountId: string, name: string, pod: string) {
    const batch = datePresets.map((date) => ({
      method: 'GET',
      relative_url: `/${accountId}/insights?fields=spend,purchase_roas&date_preset=${date}`,
    }))

    try {
      const response = await fetch(`https://graph.facebook.com/v11.0/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${FACEBOOK_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch: batch,
        }),
      })

      if (!response.ok) {
        console.error(`Error fetching insights: ${response.statusText}`)
        return { name }
      }

      const data = await response.json()

      if (!data || !Array.isArray(data)) {
        return {
          name,
          pod: 'No Data Returned',
        }
      }

      const formattedResults = data.map((result, index) => {
        const body = JSON.parse(result.body)
        const spend =
          Array.isArray(body.data) && body.data.length > 0
            ? body.data[0].spend
            : '--'
        const roas =
          Array.isArray(body.data) &&
          body.data.length > 0 &&
          body.data[0]?.purchase_roas?.[0]?.value
            ? body.data[0].purchase_roas[0].value
            : '--'

        const datePresetMatch =
          batch[index].relative_url.match(/date_preset=([^&]+)/)
        const datePreset = datePresetMatch ? datePresetMatch[1] : 'unknown'

        return {
          date_preset: datePreset,
          spend: spend || '--',
          roas: roas || '--',
        }
      })

      return { name, data: formattedResults }
    } catch (error) {
      console.error('Error fetching insights:', error)
      return { name }
    }
  }

  async function fetchAllInsights() {
    if (accounts !== null) {
      const fetchPromises = accounts.map((account: any) =>
        fetchInsights(account.account_id, account.name, account.pod),
      )
      return Promise.all(fetchPromises)
    }
  }

  try {
    const adInsights = await fetchAllInsights()

    if (adInsights) {
      const sheetData = adInsights.map(({ name, data }) => {
        const result = data?.flatMap((d) => [d.spend, d.roas])

        if (result) {
          return [name, ...result]
        }

        return [name, 'No data']
      })

      await appendDataToSheet(sheetID, sheetData, 'ROAS')

      return NextResponse.json({
        ok: true,
      })
    }
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error, ok: false },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
