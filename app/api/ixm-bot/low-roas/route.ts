import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/admin'
import { cookies } from 'next/headers'

// MAIN GET
export async function GET(req: NextRequest) {
  const _cookies = cookies()

  const query = req.nextUrl.searchParams
  const key = query.get('key')

  if (!key || key !== process.env.IXMBOT_CRON) {
    return NextResponse.json({ error: 'Unauthorized' })
  }

  const db = createAdminClient()

  const { data: accounts } = (await db
    .from('clients')
    .select('brand, fb_key, pod (discord_id, name)')
    .eq('status', 'active')
    .order('brand', { ascending: true })) as unknown as { data: any[] }

  // console.log(accounts)
  if (!accounts || accounts.length === 0) {
    return NextResponse.json(
      { error: 'No accounts found.' },
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN
  const DISCORD_API_URL = 'https://ixm-bot.onrender.com/api/sendMessage'
  const fields = `cost_per_action_type,spend,purchase_roas`

  async function fetchInsights(accountId: string, name: string) {
    const url = `https://graph.facebook.com/v11.0/${accountId}/insights?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=${fields}&date_preset=last_3d`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.error(`Status for "${name}": ${response.status}`)
        return null
      }

      const data = await response.json()
      if (!data.data || data.data.length === 0) {
        return null
      }

      const insights = data.data[0]
      const roas = parseFloat(
        insights.purchase_roas ? insights.purchase_roas[0].value : '0',
      )
      const cpa = insights.cost_per_action_type?.[0]?.value || 'N/A'
      const spend = insights.spend || 0

      return {
        name,
        roas,
        cpa,
        spend,
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
      return null
    }
  }

  async function fetchAllInsights() {
    const fetchPromises = accounts.map((account: any) =>
      fetchInsights(account.fb_key, account.brand).then((result) => ({
        ...account,
        ...result,
      })),
    )
    return Promise.all(fetchPromises)
  }

  async function sendDiscordMessage(channelName: string, message: string) {
    try {
      const response = await fetch(DISCORD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, message }),
      })

      if (!response.ok) {
        console.error(
          `Failed to send message to Discord channel "${channelName}". Status: ${response.status}`,
        )
      }
    } catch (error) {
      console.error(
        `Error sending message to Discord channel "${channelName}":`,
        error,
      )
    }
  }

  try {
    const adInsights = await fetchAllInsights()

    // Organize results by pod
    const pods: Record<string, { accounts: any[]; discord_id: string }> = {}

    adInsights
      .filter(
        (account) =>
          account && // Exclude null results
          account.roas < 2.4 && // Only include ROAS below 2.4
          account.roas > 0 && // Exclude ROAS of 0
          account.pod, // Only where pod exists
      )
      .forEach((account) => {
        if (!pods[account.pod.name]) {
          pods[account.pod.name] = {
            accounts: [],
            discord_id: account.pod.discord_id,
          }
        }
        pods[account.pod.name].accounts.push({
          name: account.name,
          roas: account.roas.toFixed(2),
          cpa: account.cpa ? parseFloat(account.cpa).toFixed(2) : '--',
          spend: account.spend ? account.spend : '--',
        })
      })

    // Send a message for each pod
    for (const pod in pods) {
      const channel = `${pod}-to-do-list` // `${pod}-test-7861` //
      const { accounts, discord_id } = pods[pod]
      const message = [
        `**DAILY LOW ROAS CHECK**\n`,
        ...accounts.map(
          (acc) =>
            `**${acc.name}**:\n- ROAS: **${acc.roas}**\n- SPEND: **${acc.spend}**\n- CPA: **${acc.cpa}**`,
        ),
        `\n<@${discord_id}> <@989529544702689303> <@1293941738666197064>`, // pod, ismail, zain
      ].join('\n')

      await sendDiscordMessage(channel, message)
    }

    return NextResponse.json({
      message: 'Messages sent successfully.',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', details: error },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
