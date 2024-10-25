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
// import { revenue } from '@/lib/actions'

// MAIN GET
export async function POST(request: NextRequest) {
  const db = createClient()
  const { data: accounts } = await db
    .from('account')
    .select('name, account_id, pod')
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

  const { sheetID, datePreset } = await request.json()

  const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN
  const fields = `actions,cost_per_action_type,impressions,spend,cpc,cpm,ctr,quality_ranking,engagement_rate_ranking,conversion_rate_ranking,purchase_roas`
  const actions = `'omni_add_to_cart','omni_initiated_checkout','link_click','purchase','landing_page_view','video_view'`

  async function fetchInsights(accountId: string, name: string, pod: string) {
    const url = `https://graph.facebook.com/v11.0/${accountId}/insights?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=${fields}&date_preset=${datePreset}&filtering=[{"field":"action_type","operator":"IN","value":[${actions}]}]`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.error(`Status for "${name}": ${response.status}`)
        return {
          name,
          pod: 'Missing Permissions or Incorrect ID',
          insights: emptyInsights,
        }
      }

      const data = await response.json()
      if (!data.data || data.data.length === 0) {
        // console.error('No insights for ', name)
        return {
          name,
          pod: `No data for ${datePreset}`,
          insights: emptyInsights,
        }
      }

      const insights = data.data[0]
      return { name, pod, insights }
    } catch (error) {
      console.error('Error fetching insights:', error)
      return { name, pod: 'Missing Permissions', insights: emptyInsights }
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

    // if (datePreset === 'last_7d' && allStores) {
    //   console.log(allStores)
    //   await revenue(allStores)
    // }

    if (adInsights) {
      const sheetData = adInsights.map(({ name, pod, insights: i }) => {
        const {
          purchase,
          link_click,
          omni_add_to_cart,
          omni_initiated_checkout,
          landing_page_view,
          video_view,
        } = getActions(i.actions)

        const CPA = getCPA(i.cost_per_action_type)

        return [
          name,
          pod,
          CPA.purchase ?? '',
          i.spend,
          i.cpc,
          i.cpm,
          i.ctr,
          i.quality_ranking,
          i.engagement_rate_ranking,
          i.conversion_rate_ranking,
          i.purchase_roas ? i.purchase_roas[0].value : '',
          getHookRate(video_view, i.impressions),
          getPercentage(omni_add_to_cart, link_click),
          getPercentage(omni_initiated_checkout, omni_add_to_cart),
          getPercentage(purchase, omni_initiated_checkout),
          getBounceRate(landing_page_view, link_click),
        ]
      })

      await appendDataToSheet(sheetID, sheetData)

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
