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

    adInsights?.sort((a, b) => {
      const roasA = parseFloat(
        a.insights.purchase_roas ? a.insights.purchase_roas[0].value : '0',
      )
      const roasB = parseFloat(
        b.insights.purchase_roas ? b.insights.purchase_roas[0].value : '0',
      )
      const validROASA = isNaN(roasA) ? 0 : roasA
      const validROASB = isNaN(roasB) ? 0 : roasB

      // Primary sorting by ROAS if both have non-zero ROAS
      if (validROASB !== validROASA) {
        return validROASB - validROASA
      }

      // Secondary sorting by spend when ROAS values are equal or zero
      const spendA = parseFloat(a.insights.spend || '0')
      const spendB = parseFloat(b.insights.spend || '0')
      return spendB - spendA
    })

    if (adInsights) {
      const sheetData = adInsights
        .map(({ name, pod, insights: i }) => {
          const roas = parseFloat(
            i.purchase_roas ? i.purchase_roas[0].value : '0',
          )
          const validROAS = isNaN(roas) ? 0 : roas

          const {
            purchase,
            link_click,
            omni_add_to_cart,
            omni_initiated_checkout,
            landing_page_view,
            video_view,
          } = getActions(i.actions)

          const CPA = getCPA(i.cost_per_action_type)

          return {
            name,
            pod,
            roas: validROAS,
            data: [
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
            ],
          }
        })
        .sort((a, b) => b.roas - a.roas)
        .map((item) => item.data)

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
