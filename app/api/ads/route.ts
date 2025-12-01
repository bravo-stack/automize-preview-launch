import { emptyInsights } from '@/content/accounts'
import { appendDataToSheet } from '@/lib/api'
import { createClient } from '@/lib/db/server'
import {
  getActions,
  getBounceRate,
  getCPA,
  getHookRate,
  getPercentage,
} from '@/lib/insights'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

// MAIN GET
export async function POST(request: NextRequest) {
  const db = createClient()
  const { sheetID, datePreset, status, snapshotId } = await request.json()

  const { data: accounts } = await db
    .from('clients')
    .select('brand, fb_key, pod, is_monitored')

    .order('brand', { ascending: true })
    .eq('status', 'active')

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
  const fields = `actions,cost_per_action_type,impressions,spend,cpc,cpm,ctr,quality_ranking,engagement_rate_ranking,conversion_rate_ranking,purchase_roas`
  const actions = `'omni_add_to_cart','omni_initiated_checkout','link_click','purchase','landing_page_view','video_view'`

  async function fetchInsights(
    accountId: string,
    name: string,
    pod: string,
    isMonitored: boolean,
  ) {
    const url = `https://graph.facebook.com/v11.0/${accountId}/insights?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=${fields}&date_preset=${datePreset}&filtering=[{"field":"action_type","operator":"IN","value":[${actions}]}]`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.error(`Status for "${name}": ${response.status}`)
        return {
          name,
          pod: 'Missing Permissions or Incorrect ID',
          insights: emptyInsights,
          isMonitored,
        }
      }

      const data = await response.json()
      if (!data.data || data.data.length === 0) {
        // console.error('No insights for ', name)
        return {
          name,
          pod: `No data for ${datePreset}`,
          insights: emptyInsights,
          isMonitored,
        }
      }

      const insights = data.data[0]
      return { name, pod, insights, isMonitored }
    } catch (error) {
      console.error('Error fetching insights:', error)
      return {
        name,
        pod: 'Missing Permissions',
        insights: emptyInsights,
        isMonitored,
      }
    }
  }

  async function fetchAllInsights() {
    if (accounts !== null) {
      const fetchPromises = accounts.map((account: any) =>
        fetchInsights(
          account.fb_key,
          account.brand,
          account.pod,
          account.is_monitored,
        ),
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

      if (validROASB !== validROASA) {
        return validROASB - validROASA
      }

      const spendA = parseFloat(a.insights.spend || '0')
      const spendB = parseFloat(b.insights.spend || '0')
      return spendB - spendA
    })

    if (adInsights) {
      const enrichedData = adInsights.map(
        ({ name, pod, insights: i, isMonitored }) => {
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

          const spend = parseFloat(i.spend || '0')
          const fbRevenue = spend * validROAS

          return {
            name,
            pod,
            roas: validROAS,
            isMonitored,
            metrics: {
              cpa_purchase: CPA.purchase ? parseFloat(CPA.purchase) : undefined,
              cpc: i.cpc ? parseFloat(i.cpc) : undefined,
              cpm: i.cpm ? parseFloat(i.cpm) : undefined,
              ctr: i.ctr ? parseFloat(i.ctr) : undefined,
              quality_ranking: i.quality_ranking,
              engagement_rate_ranking: i.engagement_rate_ranking,
              conversion_rate_ranking: i.conversion_rate_ranking,
              ad_spend_timeframe: spend,
              roas_timeframe: validROAS,
              fb_revenue_timeframe: fbRevenue,
              impressions: i.impressions ? parseInt(i.impressions) : undefined,
              hook_rate: getHookRate(video_view, i.impressions)
                ? parseFloat(getHookRate(video_view, i.impressions))
                : undefined,
              atc_rate: getPercentage(omni_add_to_cart, link_click)
                ? parseFloat(getPercentage(omni_add_to_cart, link_click))
                : undefined,
              ic_rate: getPercentage(omni_initiated_checkout, omni_add_to_cart)
                ? parseFloat(
                    getPercentage(omni_initiated_checkout, omni_add_to_cart),
                  )
                : undefined,
              purchase_rate: getPercentage(purchase, omni_initiated_checkout)
                ? parseFloat(getPercentage(purchase, omni_initiated_checkout))
                : undefined,
              bounce_rate: getBounceRate(landing_page_view, link_click)
                ? parseFloat(getBounceRate(landing_page_view, link_click))
                : undefined,
            },
            data: [
              name,
              pod,
              isMonitored ? 'Yes' : 'No',
              CPA.purchase ?? '',
              i.cpc,
              i.cpm,
              i.ctr,
              i.quality_ranking,
              i.engagement_rate_ranking,
              i.conversion_rate_ranking,
              i.spend,
              i.purchase_roas ? i.purchase_roas[0].value : '',
              fbRevenue.toFixed(2),
              getHookRate(video_view, i.impressions),
              getPercentage(omni_add_to_cart, link_click),
              getPercentage(omni_initiated_checkout, omni_add_to_cart),
              getPercentage(purchase, omni_initiated_checkout),
              getBounceRate(landing_page_view, link_click),
            ],
          }
        },
      )

      const sheetData = enrichedData
        .sort((a, b) => b.roas - a.roas)
        .map((item) => item.data)

      await appendDataToSheet(sheetID, sheetData)

      if (snapshotId) {
        console.log('[/api/ads] snapshotId received:', snapshotId)

        const { saveSnapshotMetrics, updateSnapshotStatus } = await import(
          '@/lib/db/refresh-snapshots'
        )

        // Error patterns that indicate a failed data fetch
        const errorPatterns = [
          /missing permissions/i,
          /incorrect id/i,
          /no data for/i,
          /log in/i,
          /access token/i,
          /error/i,
          /invalid/i,
          /expired/i,
        ]

        const isErrorPod = (pod: string): boolean => {
          return errorPatterns.some((pattern) => pattern.test(pod))
        }

        const metricsToSave = enrichedData.map((item) => {
          const errors: Array<{
            field: string
            message: string
            raw_value?: string | number | null
          }> = []
          const hasErrorPod = isErrorPod(item.pod)

          if (hasErrorPod) {
            errors.push({
              field: 'api_response',
              message: item.pod,
              raw_value: item.pod,
            })
          }

          // Check for missing/empty metrics that indicate errors
          const metricsToCheck: Array<{
            key: keyof typeof item.metrics
            label: string
          }> = [
            { key: 'ad_spend_timeframe', label: 'Ad Spend' },
            { key: 'roas_timeframe', label: 'ROAS' },
            { key: 'fb_revenue_timeframe', label: 'FB Revenue' },
            { key: 'impressions', label: 'Impressions' },
          ]

          for (const { key, label } of metricsToCheck) {
            const value = item.metrics[key]
            if (hasErrorPod && (value === undefined || value === 0)) {
              errors.push({
                field: key,
                message: `${label} unavailable due to API error`,
                raw_value: value,
              })
            }
          }

          return {
            account_name: item.name,
            pod: hasErrorPod ? undefined : item.pod, // Don't store error message as pod
            is_monitored: item.isMonitored,
            ...item.metrics,
            is_error: errors.length > 0,
            error_detail:
              errors.length > 0
                ? { errors, error_count: errors.length }
                : undefined,
          }
        })

        console.log('[/api/ads] Saving metrics count:', metricsToSave.length)

        const metricsResult = await saveSnapshotMetrics({
          snapshotId,
          metrics: metricsToSave,
        })

        console.log('[/api/ads] saveSnapshotMetrics result:', metricsResult)

        // Update snapshot status to completed
        const statusResult = await updateSnapshotStatus(snapshotId, 'completed')
        console.log('[/api/ads] updateSnapshotStatus result:', statusResult)
      } else {
        console.log('[/api/ads] No snapshotId provided, skipping metrics save')
      }

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
