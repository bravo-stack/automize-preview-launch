'use server'

import { google } from 'googleapis'
import { createClient } from './db/server'
import { authorizeDrive, authorizeSheets } from './google'
import {
  appendDataToSheet,
  appendFinancials,
  createSpreadsheet,
  getPermissionId,
  updatePermission,
} from './api'
import { getTemplateById } from '@/content/templates'
import { decrypt, encrypt } from './crypto'

interface RevenueData {
  name: string
  revenue: number
  lastRebill: string
}

interface FbData {
  name: string
  roas: number
  spend: number
}

interface CombinedData {
  name: string
  revenueLast30?: number
  revenueSinceRebill?: number
  lastRebill?: string
  fbLast30Roas?: number
  fbLast30Spend?: number
  fbSinceRebillRoas?: number
  fbSinceRebillSpend?: number
}

export async function createUser(
  email: string,
  password: string,
  company: string,
) {
  const db = createClient()

  const { data, error } = await db.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        company: company,
      },
    },
  })

  if (data.user && !error) {
    // await db.from('user_detail').insert({ id: data.user.id, company: company })
  } else {
    return {
      error: true,
    }
  }

  return { error: false }
}

export async function signInUser(email: string, password: string) {
  const db = createClient()

  const { error } = await db.auth.signInWithPassword({
    email,
    password,
  })

  return error ? true : false
}

export async function signOutUser() {
  const db = createClient()

  const { error } = await db.auth.signOut()

  return error ? true : false
}

export async function createSheet(
  title: string,
  email: string,
  sheetData: any,
  pod?: string,
) {
  const sheets = google.sheets({ version: 'v4', auth: await authorizeSheets() })
  const drive = google.drive({ version: 'v3', auth: await authorizeDrive() })
  const db = createClient()

  const sheet_id = await createSpreadsheet(sheets, title)
  const permissionId = await getPermissionId(drive, sheet_id, email)
  const res2Data = await updatePermission(drive, sheet_id, permissionId)

  const { user_id, frequency, templateId } = sheetData
  const { data, error } = await db
    .from('sheets')
    .insert({ title, user_id, refresh: frequency, sheet_id, pod: pod || '' })
    .select()

  if (templateId) {
    const template = getTemplateById(templateId)
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheet_id,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: template,
      },
    })
  }

  return true
}

export async function deleteSheet(sheetId: string) {
  const db = createClient()
  const response = await db.from('sheets').delete().eq('sheet_id', sheetId)

  if (!response.error) {
    return true
  }
  return false
}

export async function deleteAccount(accountId: string) {
  const db = createClient()
  const response = await db.from('account').delete().eq('account_id', accountId)

  if (!response.error) {
    return true
  }
  return false
}

export async function createAccount(accountData: any) {
  const db = createClient()
  const { name, account_id, pod } = accountData
  const { data, error } = await db
    .from('account')
    .insert({ name, account_id, pod })
    .select()

  if (data && !error) {
    return true
  } else {
    console.log(error)
    return false
  }
}

export async function updateAccount(accountData: any) {
  const db = createClient()
  const { name, account_id, pod } = accountData

  const { data, error } = await db
    .from('account')
    .update({ name, pod })
    .eq('account_id', account_id)

  if (data && !error) {
    return true
  } else {
    console.log(error)
    return false
  }
}

export async function saveStore(storeData: any) {
  const db = createClient()

  const { data, error } = await db
    .from('store')
    .insert({ ...storeData, key: encrypt(storeData.key) })
    .select()

  if (data && !error) {
    return true
  } else {
    console.log(error)
    return false
  }
}

export async function updateStore(storeData: any) {
  const db = createClient()

  const { error } = await db
    .from('store')
    .update(storeData)
    .eq('id', storeData.id)

  if (!error) {
    return true
  } else {
    console.log(error)
    return false
  }
}

export async function fetchShopify(stores: any[], rebill?: boolean) {
  const fetchOrders = async (
    store_id: string,
    key: string,
    last_rebill?: string,
  ) => {
    const endpoint = `https://${store_id}.myshopify.com/admin/api/2024-07/graphql.json`

    const queryDate = rebill && last_rebill ? new Date(last_rebill) : new Date()
    if (!rebill) {
      queryDate.setDate(queryDate.getDate() - 30)
    }
    const queryDateISO = queryDate.toISOString()

    let hasNextPage = true
    let cursor = null
    let totalAmount = 0
    let totalOrders = 0

    while (hasNextPage) {
      const query: string = `
        {
          orders(first: 250, after: ${cursor ? `"${cursor}"` : null}, query: "created_at:>=${queryDateISO} -status:cancelled -status:returned test:false") {
            edges {
              cursor
              node {
                totalPriceSet {
                  shopMoney {
                    amount
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `

      try {
        const result = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': key,
          } as HeadersInit,
          body: JSON.stringify({ query }),
        })

        const data = await result.json()

        const orders = data.data.orders.edges
        totalOrders += orders.length

        totalAmount += orders.reduce((sum: number, order: any) => {
          return sum + parseFloat(order.node.totalPriceSet.shopMoney.amount)
        }, 0)

        hasNextPage = data.data.orders.pageInfo.hasNextPage
        if (hasNextPage) {
          cursor = orders[orders.length - 1].cursor
        }
      } catch (error) {
        console.error(`Error fetching data for store ${store_id}.`)
        hasNextPage = false
      }
    }

    return { totalOrders, totalAmount }
  }

  const calculateRevenue = async () => {
    const results = await Promise.all(
      stores.map(async (store) => {
        try {
          const { store_id, key, name } = store
          const decryptedKey = decrypt(key)
          // console.log(`Fetching data for store: ${store_id}`)

          let res
          if (rebill) {
            res = await fetchOrders(store_id, decryptedKey, store.last_rebill)
          } else {
            res = await fetchOrders(store_id, decryptedKey)
          }

          const totalOrders = res.totalOrders
          const totalAmount = res.totalAmount

          const AOV = totalOrders > 0 ? totalAmount / totalOrders : 0
          const revenue =
            totalOrders > 0 ? totalOrders * AOV : 'Could not retrieve'

          return { name, revenue, lastRebill: store.last_rebill }
        } catch (error) {
          console.error(`Error processing store ${store.store_id}.`)
          return {
            name: store.name,
            revenue: 'Error fetching data',
            lastRebill: store.last_rebill,
          }
        }
      }),
    )

    return results
  }

  return await calculateRevenue()
}

export async function fetchFacebook(stores: any[], rebill?: boolean) {
  const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN
  const fields = `spend,purchase_roas`

  async function fetchInsights(
    accountId: string,
    name: string,
    rebill?: string,
  ) {
    const dateParam = rebill
      ? `&time_range[since]=${rebill}&time_range[until]=${new Date().toISOString().split('T')[0]}`
      : '&date_preset=last_30d'
    const url = `https://graph.facebook.com/v11.0/${accountId}/insights?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=${fields}${dateParam}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        return {
          name,
          roas: 'Missing Permissions or Incorrect ID',
          spend: 'Missing Permissions or Incorrect ID',
        }
      }

      const data = await response.json()
      if (!data.data || data.data.length === 0) {
        return {
          name,
          roas: 'No Data',
          spend: 'No Data',
        }
      }

      const insights = data.data[0]

      return {
        name,
        roas:
          (insights.purchase_roas && insights.purchase_roas[0].value) || '--',
        spend: insights.spend || '--',
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
      return {
        name,
        roas: 'Missing Permissions or Incorrect ID',
        spend: 'Missing Permissions or Incorrect ID',
      }
    }
  }

  async function fetchAllInsights() {
    if (stores !== null) {
      let fetchPromises
      if (rebill) {
        fetchPromises = stores.map((store: any) =>
          fetchInsights(store.account_id, store.name, store.last_rebill),
        )
      } else {
        fetchPromises = stores.map((store: any) =>
          fetchInsights(store.account_id, store.name),
        )
      }
      return Promise.all(fetchPromises)
    }
  }

  return await fetchAllInsights()
}

export async function financialize(stores: any[]) {
  const [revenueLast30, revenueSinceRebill, fbLast30, fbSinceRebill] =
    await Promise.all([
      fetchShopify(stores),
      fetchShopify(stores, true),
      fetchFacebook(stores),
      fetchFacebook(stores, true),
    ])

  if (!revenueLast30 || !revenueSinceRebill || !fbLast30 || !fbSinceRebill) {
    return false
  }

  const data = combineData(
    revenueLast30 as RevenueData[],
    revenueSinceRebill as RevenueData[],
    fbLast30 as FbData[],
    fbSinceRebill as FbData[],
  )

  const id = '19lCLSuG9cU7U0bL1DiqWUd-QbfBGPEQgG7joOnu9gyY'

  if (revenueLast30 && fbLast30 && fbSinceRebill && revenueSinceRebill) {
    const sheetData = data.map((s: any, index) => {
      const rebillStatus = isRebillable(
        s.revenueSinceRebill,
        s.fbSinceRebillSpend,
        s.fbSinceRebillRoas,
        s.lastRebill,
      )

      return [
        s.name,
        s.revenueLast30,
        s.fbLast30Spend,
        s.revenueSinceRebill,
        s.fbSinceRebillSpend,
        s.fbLast30Roas,
        s.fbSinceRebillRoas,
        rebillStatus,
        s.lastRebill,
        rebillStatus === 'rebillable next date'
          ? addDaysToDate(s.lastRebill)
          : '',
      ]
    })

    await appendDataToSheet(id, sheetData)
  }

  return true
}

export async function revenue(stores: any[]) {
  const revenueLast30 = await fetchShopify(stores)

  const id = '19lCLSuG9cU7U0bL1DiqWUd-QbfBGPEQgG7joOnu9gyY'

  if (revenueLast30) {
    console.log(revenueLast30)
  }
}

function isRebillable(
  revenue: string | number,
  spend: string,
  roas: string,
  lastRebill: string,
) {
  const ROAS = typeof roas === 'string' ? parseFloat(roas) : roas
  const SPEND = typeof spend === 'string' ? parseFloat(spend) : spend
  const REVENUE = typeof revenue === 'string' ? parseFloat(revenue) : revenue

  if (
    isNaN(REVENUE) ||
    isNaN(ROAS) ||
    isNaN(SPEND) ||
    REVENUE === 0 ||
    SPEND === 0 ||
    ROAS === 0
  ) {
    return 'N/A'
  }

  if (
    (REVENUE >= 10000 && ROAS >= 2.7 && SPEND > 3000) ||
    (REVENUE >= 20000 && ROAS >= 2.3 && SPEND > 3000)
  ) {
    const currentDate = new Date()
    const rebillDate = new Date(lastRebill)
    const nextRebillDate = addDaysToDate(lastRebill, 31, true)

    if (currentDate < nextRebillDate) {
      return 'rebillable next date'
    } else if (currentDate === rebillDate) {
      return 'rebillable'
    } else if (currentDate > nextRebillDate) {
      return 'overdue'
    }
  }

  if (REVENUE > 6600) {
    return 'soon to be'
  }

  return 'not rebillable'
}

function addDaysToDate(dateString: string, days = 31, notString = false) {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)

  if (notString) {
    return date
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0') // Months are 0-based
  const dd = String(date.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

function combineData(
  revenueLast30: RevenueData[],
  revenueSinceRebill: RevenueData[],
  fbLast30: FbData[],
  fbSinceRebill: FbData[],
): CombinedData[] {
  const combinedData: Record<string, CombinedData> = {}

  const addRevenueData = (
    data: RevenueData[],
    key: 'revenueLast30' | 'revenueSinceRebill',
  ) => {
    data.forEach(({ name, revenue, lastRebill }) => {
      if (!combinedData[name]) {
        combinedData[name] = { name }
      }
      combinedData[name][key] = revenue
      combinedData[name]['lastRebill'] = lastRebill
    })
  }

  const addFbData = (
    data: FbData[],
    keyRoas: 'fbLast30Roas' | 'fbSinceRebillRoas',
    keySpend: 'fbLast30Spend' | 'fbSinceRebillSpend',
  ) => {
    data.forEach(({ name, roas, spend }) => {
      if (!combinedData[name]) {
        combinedData[name] = { name }
      }
      combinedData[name][keyRoas] = roas
      combinedData[name][keySpend] = spend
    })
  }
  addRevenueData(revenueLast30, 'revenueLast30')
  addRevenueData(revenueSinceRebill, 'revenueSinceRebill')
  addFbData(fbLast30, 'fbLast30Roas', 'fbLast30Spend')
  addFbData(fbSinceRebill, 'fbSinceRebillRoas', 'fbSinceRebillSpend')

  return Object.values(combinedData)
}

export async function changePassword() {
  return
  const db = createClient()

  await db.auth.updateUser({
    password: '',
  })
}
