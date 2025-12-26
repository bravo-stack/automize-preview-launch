import { sendDiscordMessage } from '@/lib/actions/discord'
import { sendAndLogWhatsAppMessage } from '@/lib/actions/whatsapp'
import { createAdminClient } from '@/lib/db/admin'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// MAIN GET
export async function GET(req: NextRequest) {
  const _cookies = cookies()

  const query = req.nextUrl.searchParams
  const key = query.get('key')

  if (!key || key !== process.env.IXMBOT_CRON) {
    return NextResponse.json({ error: 'Unauthorized' })
  }

  const db = createAdminClient()

  // Include whatsapp_number for WhatsApp notifications
  const { data: accounts } = (await db
    .from('clients')
    .select('brand, fb_key, pod (discord_id, name, whatsapp_number)')
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

  try {
    const adInsights = await fetchAllInsights()

    // Organize results by pod
    const pods: Record<
      string,
      { accounts: any[]; discord_id: string; whatsapp_number?: string }
    > = {}

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
            whatsapp_number: account.pod.whatsapp_number,
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
      const { accounts, discord_id, whatsapp_number } = pods[pod]

      // Discord message (with markdown)
      const discordMessage = [
        `**DAILY LOW ROAS CHECK**\n`,
        ...accounts.map(
          (acc) =>
            `**${acc.name}**:\n- ROAS: **${acc.roas}**\n- SPEND: **${acc.spend}**\n- CPA: **${acc.cpa}**`,
        ),
        `\n<@${discord_id}> <@989529544702689303> <@1293941738666197064>`, // pod, ismail, zain
      ].join('\n')

      await sendDiscordMessage(channel, discordMessage, {
        sourceFeature: 'daily_summary',
        podName: pod,
      })

      // WhatsApp message (plain text, no markdown)
      if (whatsapp_number) {
        const whatsappMessage = [
          `📊 DAILY LOW ROAS CHECK\n`,
          ...accounts.map(
            (acc) =>
              `${acc.name}:\n• ROAS: ${acc.roas}\n• SPEND: ${acc.spend}\n• CPA: ${acc.cpa}`,
          ),
        ].join('\n')

        await sendAndLogWhatsAppMessage(
          whatsapp_number,
          whatsappMessage,
          pod,
          'daily_summary',
        )
      }
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
