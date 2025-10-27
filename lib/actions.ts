'use server'

import { getTemplateById } from '@/content/templates'
import { google } from 'googleapis'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  appendDataToSheet,
  createSpreadsheet,
  getPermissionId,
  updatePermission,
} from './api'
import { decrypt, encrypt } from './crypto'
import { createClient } from './db/server'
import { authorizeDrive, authorizeSheets } from './google'
import { toNumber } from './utils'

interface RevenueData {
  name: string
  revenue: number
  orders: number
  lastRebill: string
}

interface FbData {
  name: string
  pod: string
  roas: number
  spend: number
}

interface CombinedData {
  name: string
  pod?: string
  revenueLast30?: number
  ordersLast30?: number
  revenueSinceRebill?: number
  ordersSinceRebill?: number
  lastRebill?: string
  fbLast30Roas?: number
  fbLast30Spend?: number
  fbSinceRebillRoas?: number
  fbSinceRebillSpend?: number
  isMonitored?: boolean
}

export async function refresh(path: string) {
  revalidatePath(path, 'page')
}

export async function getRole(): Promise<string> {
  const db = createClient()

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user || !user.email) redirect('/login')

  return user.user_metadata.role ?? 'exec'
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
  await db.auth.signOut()
  redirect('/login')
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

  const { user_id, frequency, templateId, is_finance } = sheetData
  const { data, error } = await db
    .from('sheets')
    .insert({
      title,
      user_id,
      refresh: frequency,
      sheet_id,
      pod: pod || '',
      is_finance,
    })
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
  const response = await db
    .from('accounts')
    .delete()
    .eq('account_id', accountId)

  if (!response.error) {
    return true
  }
  return false
}

export async function createAccount(accountData: any) {
  const db = createClient()
  const { name, account_id, pod } = accountData
  const { data, error } = await db
    .from('accounts')
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
  const { brand, fb_key, pod, status } = accountData

  const { data, error } = await db
    .from('accounts')
    .update({
      brand,
      pod,
      status,
      churn_date: status === 'left' ? new Date() : null,
    })
    .eq('fb_key', fb_key)

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
    .from('accounts')
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
    .from('accounts')
    .update(storeData)
    .eq('id', storeData.id)

  if (!error) {
    return true
  } else {
    console.log(error)
    return false
  }
}

export async function fetchShopify(
  stores: any[],
  rebill?: boolean,
  datePreset?: string,
) {
  const fetchOrders = async (
    store_id: string,
    key: string,
    last_rebill?: string,
  ) => {
    const endpoint = `https://${store_id}.myshopify.com/admin/api/2024-07/graphql.json`

    function parseRebillDateToDate(dateString: string): Date {
      return new Date(dateString + 'T00:00:00.000Z')
    }

    function getDateFromPreset(preset: string): Date {
      const date = new Date()
      switch (preset) {
        case 'today':
          return date
        case 'yesterday':
          date.setDate(date.getDate() - 1)
          return date
        case 'last_3d':
          date.setDate(date.getDate() - 3)
          return date
        case 'last_7d':
          date.setDate(date.getDate() - 7)
          return date
        case 'last_14d':
          date.setDate(date.getDate() - 14)
          return date
        case 'last_30d':
          date.setDate(date.getDate() - 30)
          return date
        case 'this_month':
          return new Date(date.getFullYear(), date.getMonth(), 1)
        case 'maximum':
          date.setFullYear(date.getFullYear() - 1)
          return date
        default:
          date.setDate(date.getDate() - 30)
          return date
      }
    }

    let queryDate: Date

    if (rebill && last_rebill) {
      queryDate = parseRebillDateToDate(last_rebill)
    } else if (datePreset && datePreset !== 'none') {
      queryDate = getDateFromPreset(datePreset)
    } else {
      queryDate = new Date()
      queryDate.setDate(queryDate.getDate() - 30)
    }

    const queryDateISO = queryDate.toISOString()

    let hasNextPage = true
    let cursor = null
    let totalAmount = 0
    let totalOrders = 0
    let lastError: string | null = null

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

        // Check if there's an error in the response
        if (data.errors) {
          console.error(`Shopify API error for store ${store_id}:`, data.errors)
          lastError = 'API Error'
          hasNextPage = false
          break
        }

        // Check if data structure is as expected
        if (!data.data || !data.data.orders) {
          console.error(`Unexpected data structure for store ${store_id}`)
          lastError = 'Invalid Response'
          hasNextPage = false
          break
        }

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
        console.error(
          `Network error fetching data for store ${store_id}:`,
          error,
        )
        lastError = 'Network Error'
        hasNextPage = false
        break
      }
    }

    return { totalOrders, totalAmount, error: lastError }
  }

  const calculateRevenue = async () => {
    const results = await Promise.all(
      stores.map(async (store) => {
        try {
          const { store_id, shopify_key, brand } = store

          // Check if required fields are present
          if (!store_id || !shopify_key) {
            return {
              name: brand || 'Unknown Store',
              revenue: 'Missing Store Credentials',
              orders: 'Missing Store Credentials',
              lastRebill: store.rebill_date,
            }
          }

          const decryptedKey = decrypt(shopify_key)

          let res
          if (rebill) {
            res = await fetchOrders(store_id, decryptedKey, store.rebill_date)
          } else {
            res = await fetchOrders(store_id, decryptedKey)
          }

          // Handle specific error types
          if (res.error) {
            return {
              name: brand,
              revenue:
                res.error === 'API Error'
                  ? 'Shopify API Error'
                  : res.error === 'Invalid Response'
                    ? 'Invalid Shopify Response'
                    : res.error === 'Network Error'
                      ? 'Network Connection Error'
                      : 'Could Not Retrieve',
              orders:
                res.error === 'API Error'
                  ? 'Shopify API Error'
                  : res.error === 'Invalid Response'
                    ? 'Invalid Shopify Response'
                    : res.error === 'Network Error'
                      ? 'Network Connection Error'
                      : 'Could Not Retrieve',
              lastRebill: store.rebill_date,
            }
          }

          const totalOrders = res.totalOrders
          const totalAmount = res.totalAmount

          // More specific messaging for no data scenarios
          if (totalOrders === 0 && totalAmount === 0) {
            return {
              name: brand,
              revenue: 'No Orders Found',
              orders: 0,
              lastRebill: store.rebill_date,
            }
          }

          const AOV = totalOrders > 0 ? totalAmount / totalOrders : 0
          const revenue =
            totalOrders > 0 ? totalOrders * AOV : 'No Revenue Data'

          return {
            name: brand,
            revenue,
            orders: totalOrders,
            lastRebill: store.rebill_date,
          }
        } catch (error) {
          console.error(
            `Unexpected error processing store ${store.store_id}:`,
            error,
          )
          return {
            name: store.brand,
            revenue: 'Processing Error',
            orders: 'Processing Error',
            lastRebill: store.rebill_date,
          }
        }
      }),
    )

    return results
  }

  return await calculateRevenue()
}

export async function fetchFacebook(
  stores: any[],
  rebill?: boolean,
  datePreset?: string,
) {
  const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN
  const fields = `spend,purchase_roas`

  async function fetchInsights(
    accountId: string,
    name: string,
    pod: string,
    rebill?: string,
  ) {
    let dateParam: string
    if (rebill) {
      dateParam = `&time_range[since]=${rebill}&time_range[until]=${new Date().toISOString().split('T')[0]}`
    } else if (datePreset && datePreset !== 'none') {
      dateParam = `&date_preset=${datePreset}`
    } else {
      dateParam = '&date_preset=last_30d'
    }
    const url = `https://graph.facebook.com/v11.0/${accountId}/insights?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=${fields}${dateParam}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        // More specific error messages based on status codes
        if (response.status === 401) {
          return {
            name,
            pod,
            roas: 'Invalid Access Token',
            spend: 'Invalid Access Token',
          }
        } else if (response.status === 403) {
          return {
            name,
            pod,
            roas: 'Access Forbidden',
            spend: 'Access Forbidden',
          }
        } else if (response.status === 404) {
          return {
            name,
            pod,
            roas: 'Account Not Found',
            spend: 'Account Not Found',
          }
        } else if (response.status === 429) {
          return {
            name,
            pod,
            roas: 'Rate Limit Exceeded',
            spend: 'Rate Limit Exceeded',
          }
        } else {
          return {
            name,
            pod,
            roas: `HTTP Error ${response.status}`,
            spend: `HTTP Error ${response.status}`,
          }
        }
      }

      const data = await response.json()

      // Check for Facebook API errors
      if (data.error) {
        return {
          name,
          pod,
          roas: `FB API Error: ${data.error.message}`,
          spend: `FB API Error: ${data.error.message}`,
        }
      }

      if (!data.data || data.data.length === 0) {
        return {
          name,
          pod,
          roas: 'No Data Available',
          spend: 'No Data Available',
        }
      }

      const insights = data.data[0]

      return {
        name,
        pod,
        roas:
          (insights.purchase_roas && insights.purchase_roas[0].value) ||
          'No ROAS Data',
        spend: insights.spend || 'No Spend Data',
      }
    } catch (error) {
      console.error('Network error fetching Facebook insights:', error)
      return {
        name,
        pod,
        roas: 'Network Connection Error',
        spend: 'Network Connection Error',
      }
    }
  }

  async function fetchAllInsights() {
    if (stores !== null) {
      let fetchPromises
      if (rebill) {
        fetchPromises = stores.map((store: any) =>
          fetchInsights(
            store.fb_key,
            store.brand,
            store.pod,
            store.rebill_date,
          ),
        )
      } else {
        fetchPromises = stores.map((store: any) =>
          fetchInsights(store.fb_key, store.brand, store.pod),
        )
      }
      return Promise.all(fetchPromises)
    }
  }

  return await fetchAllInsights()
}

export async function financialize(
  stores: any[],
  sheetId?: string,
  subsheet = false,
  batch = false,
  datePreset?: string,
) {
  const [revenueLast30, revenueSinceRebill, fbLast30, fbSinceRebill] =
    await Promise.all([
      fetchShopify(stores, false, datePreset),
      fetchShopify(stores, true),
      fetchFacebook(stores, false, datePreset),
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
    stores,
  )

  const id = sheetId ?? '19lCLSuG9cU7U0bL1DiqWUd-QbfBGPEQgG7joOnu9gyY' // '19xIfkTLIQpuY4V00502VijpAIo_UOPLxYron2oFK1Q8' //

  let totalRevenueLast30 = 0
  let totalOrdersLast30 = 0
  let totalFbLast30Spend = 0
  let totalRevenueSinceRebill = 0
  let totalOrdersSinceRebill = 0
  let totalFbSinceRebillSpend = 0
  let fbLast30RoasSum = 0
  let fbSinceRebillRoasSum = 0
  let fbLast30RoasCount = 0
  let fbSinceRebillRoasCount = 0

  if (revenueLast30 && fbLast30 && fbSinceRebill && revenueSinceRebill) {
    const sheetData = data.map((s: any, index) => {
      const rebillStatus = isRebillable(
        s.revenueSinceRebill,
        s.fbSinceRebillSpend,
        s.fbSinceRebillRoas,
        s.lastRebill,
      )

      const revenueLast30 = toNumber(s.revenueLast30)
      const ordersLast30 = toNumber(s.ordersLast30)
      const fbLast30Spend = toNumber(s.fbLast30Spend)
      const revenueSinceRebill = toNumber(s.revenueSinceRebill)
      const ordersSinceRebill = toNumber(s.ordersSinceRebill)
      const fbSinceRebillSpend = toNumber(s.fbSinceRebillSpend)
      const fbLast30Roas = toNumber(s.fbLast30Roas)
      const fbSinceRebillRoas = toNumber(s.fbSinceRebillRoas)

      if (revenueLast30 !== null) totalRevenueLast30 += revenueLast30
      if (ordersLast30 !== null) totalOrdersLast30 += ordersLast30
      if (fbLast30Spend !== null) totalFbLast30Spend += fbLast30Spend
      if (revenueSinceRebill !== null)
        totalRevenueSinceRebill += revenueSinceRebill
      if (ordersSinceRebill !== null)
        totalOrdersSinceRebill += ordersSinceRebill
      if (fbSinceRebillSpend !== null)
        totalFbSinceRebillSpend += fbSinceRebillSpend

      if (fbLast30Roas !== null) {
        fbLast30RoasSum += fbLast30Roas
        fbLast30RoasCount++
      }

      if (fbSinceRebillRoas !== null) {
        fbSinceRebillRoasSum += fbSinceRebillRoas
        fbSinceRebillRoasCount++
      }

      return [
        s.isMonitored ? 'Yes' : 'No', // Monitored
        s.name, // Name
        s.pod, // Pod
        s.fbLast30Spend, // Ad spend (timeframe)
        s.fbLast30Roas, // ROAS (timeframe)
        s.revenueLast30, // Revenue (timeframe)
        s.fbSinceRebillSpend, // Ad spend (rebill)
        s.fbSinceRebillRoas, // ROAS (rebill)
        s.revenueSinceRebill, // Revenue (rebill)
        rebillStatus, // Is rebillable
        s.lastRebill ? s.lastRebill : 'Missing rebill date', // Last rebill date
        s.ordersLast30, // Orders (timeframe)
        s.ordersSinceRebill, // Orders (since rebill)
      ]
    })

    const sortedSheetData = sheetData.sort((a, b) => {
      const revenueA = parseFloat(a[5]) || 0 // Revenue (timeframe) is in column 5 (Monitored, Name, Pod, Ad spend, ROAS, Revenue)
      const revenueB = parseFloat(b[5]) || 0
      const fbSpendA = parseFloat(a[3]) || 0 // Ad spend (timeframe) is in column 3
      const fbSpendB = parseFloat(b[3]) || 0

      // Sort by revenue (timeframe) desc, then by ad spend (timeframe) desc
      return revenueB - revenueA || fbSpendB - fbSpendA
    })

    const averageFbLast30Roas =
      fbLast30RoasCount > 0 ? fbLast30RoasSum / fbLast30RoasCount : 0
    const averageFbSinceRebillRoas =
      fbSinceRebillRoasCount > 0
        ? fbSinceRebillRoasSum / fbSinceRebillRoasCount
        : 0

    if (batch) {
      return sortedSheetData // Return the batch to be written by the caller
    }

    sortedSheetData.push([
      'n/a', // Monitored
      'TOTAL/AVG', // Name
      new Date().toDateString(), // Pod
      totalFbLast30Spend.toLocaleString(), // Ad spend (timeframe)
      averageFbLast30Roas.toFixed(2), // ROAS (timeframe)
      totalRevenueLast30.toLocaleString(), // Revenue (timeframe)
      totalFbSinceRebillSpend.toLocaleString(), // Ad spend (rebill)
      averageFbSinceRebillRoas.toFixed(2), // ROAS (rebill)
      totalRevenueSinceRebill.toLocaleString(), // Revenue (rebill)
      'n/a', // Is rebillable
      'n/a', // Last rebill date
      totalOrdersLast30.toLocaleString(), // Orders (timeframe)
      totalOrdersSinceRebill.toLocaleString(), // Orders (since rebill)
    ])

    subsheet
      ? await appendDataToSheet(id, sortedSheetData, 'Revenue')
      : await appendDataToSheet(id, sortedSheetData)
  }

  return true
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
  stores?: any[],
): CombinedData[] {
  const combinedData: Record<string, CombinedData> = {}

  // Create a mapping of store names to their monitored status
  const monitoredMap: Record<string, boolean> = {}
  if (stores) {
    stores.forEach((store) => {
      monitoredMap[store.brand] = store.is_monitored || false
    })
  }

  const addRevenueData = (
    data: RevenueData[],
    keyRevenue: 'revenueLast30' | 'revenueSinceRebill',
    keyOrders: 'ordersLast30' | 'ordersSinceRebill',
  ) => {
    data.forEach(({ name, revenue, orders, lastRebill }) => {
      if (!combinedData[name]) {
        combinedData[name] = { name }
      }
      combinedData[name][keyRevenue] = revenue
      combinedData[name][keyOrders] = orders
      combinedData[name]['lastRebill'] = lastRebill
      combinedData[name]['isMonitored'] = monitoredMap[name] || false
    })
  }

  const addFbData = (
    data: FbData[],
    keyRoas: 'fbLast30Roas' | 'fbSinceRebillRoas',
    keySpend: 'fbLast30Spend' | 'fbSinceRebillSpend',
  ) => {
    data.forEach(({ name, roas, spend, pod }) => {
      if (!combinedData[name]) {
        combinedData[name] = { name }
      }
      combinedData[name][keyRoas] = roas
      combinedData[name][keySpend] = spend
      combinedData[name]['pod'] = pod
      combinedData[name]['isMonitored'] = monitoredMap[name] || false
    })
  }

  addRevenueData(revenueLast30, 'revenueLast30', 'ordersLast30')
  addRevenueData(revenueSinceRebill, 'revenueSinceRebill', 'ordersSinceRebill')
  addFbData(fbLast30, 'fbLast30Roas', 'fbLast30Spend')
  addFbData(fbSinceRebill, 'fbSinceRebillRoas', 'fbSinceRebillSpend')

  // Add monitored status from stores
  if (stores) {
    stores.forEach((store) => {
      const name = store.brand
      if (combinedData[name]) {
        combinedData[name].isMonitored = store.is_monitored
      }
    })
  }

  return Object.values(combinedData)
}

export async function refreshSheetData(
  sheetId: string,
  datePreset: string,
  status: string,
) {
  const db = createClient()

  // Fetch accounts based on status - using 'clients' table to match existing API behavior
  const { data: accounts, error } = await db
    .from('clients')
    .select(
      'id, brand, pod, fb_key, store_id, shopify_key, rebill_date, is_monitored',
    )
    .order('brand')
    .neq('store_id', null)
    .eq('status', 'active')

  if (error || !accounts) {
    console.error('Error fetching accounts:', error)
    return { success: false, error: 'Failed to fetch accounts data' }
  }

  try {
    const BATCH_SIZE = 75
    const totalBatches = Math.ceil(accounts.length / BATCH_SIZE)
    const allRows: any[][] = []
    let batchNumber = 0

    // Process in batches to avoid rate limits
    for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
      const batch = accounts.slice(i, i + BATCH_SIZE)
      batchNumber++

      // Batch mode: batch = true
      const batchRows = (await financialize(
        batch,
        sheetId,
        sheetId ? true : false,
        true, // batch = true
        datePreset,
      )) as any[][]

      allRows.push(...batchRows)
    }

    // Clean all number fields before sorting
    // New column order: Monitored(0), Name(1), Pod(2), Ad spend timeframe(3), ROAS timeframe(4), Revenue timeframe(5), Ad spend rebill(6), ROAS rebill(7), Revenue rebill(8), Is rebillable(9), Last rebill date(10), Orders timeframe(11), Orders rebill(12)
    for (let row of allRows) {
      for (let i of [3, 4, 5, 6, 7, 8, 11, 12]) {
        const val = row[i]

        if (
          typeof val === 'string' &&
          /^[\d,.\s]+$/.test(val) // Matches numbers with optional commas/decimals
        ) {
          row[i] = parseFloat(val.replace(/,/g, '')) || 0
        }
        // else keep original message like "Could not retrieve"
      }
    }

    // Sort globally by revenue (timeframe) then spend (timeframe)
    allRows.sort((a, b) => {
      const revenueA = typeof a[5] === 'number' ? a[5] : -Infinity // Revenue (timeframe) is column 5
      const revenueB = typeof b[5] === 'number' ? b[5] : -Infinity
      const spendA = typeof a[3] === 'number' ? a[3] : -Infinity // Ad spend (timeframe) is column 3
      const spendB = typeof b[3] === 'number' ? b[3] : -Infinity

      return revenueB - revenueA || spendB - spendA
    })

    // Compute totals & averages
    const totals = allRows.reduce(
      (acc, row) => {
        const toNum = (val: any) => {
          if (
            typeof val === 'string' &&
            /^[\d,.\s]+$/.test(val) // Only parse if it's a numeric-looking string
          ) {
            return parseFloat(val.replace(/,/g, ''))
          } else if (typeof val === 'number') {
            return val
          }
          return null // non-numeric or error string
        }

        // New column order: Monitored(0), Name(1), Pod(2), Ad spend timeframe(3), ROAS timeframe(4), Revenue timeframe(5), Ad spend rebill(6), ROAS rebill(7), Revenue rebill(8), Is rebillable(9), Last rebill date(10), Orders timeframe(11), Orders rebill(12)
        const fbLast30Spend = toNum(row[3]) // Ad spend (timeframe)
        const roas30 = toNum(row[4]) // ROAS (timeframe)
        const revenueLast30 = toNum(row[5]) // Revenue (timeframe)
        const fbSinceRebillSpend = toNum(row[6]) // Ad spend (rebill)
        const roasRebill = toNum(row[7]) // ROAS (rebill)
        const revenueSinceRebill = toNum(row[8]) // Revenue (rebill)
        const ordersLast30 = toNum(row[11]) // Orders (timeframe)
        const ordersSinceRebill = toNum(row[12]) // Orders (rebill)

        if (fbLast30Spend !== null) acc.fbLast30Spend += fbLast30Spend
        if (revenueLast30 !== null) acc.revenueLast30 += revenueLast30
        if (fbSinceRebillSpend !== null)
          acc.fbSinceRebillSpend += fbSinceRebillSpend
        if (revenueSinceRebill !== null)
          acc.revenueSinceRebill += revenueSinceRebill
        if (ordersLast30 !== null) acc.ordersLast30 += ordersLast30
        if (ordersSinceRebill !== null)
          acc.ordersSinceRebill += ordersSinceRebill

        if (roas30 !== null) {
          acc.fbLast30RoasSum += roas30
          acc.fbLast30RoasCount++
        }

        if (roasRebill !== null) {
          acc.fbSinceRebillRoasSum += roasRebill
          acc.fbSinceRebillRoasCount++
        }

        return acc
      },
      {
        revenueLast30: 0,
        fbLast30Spend: 0,
        revenueSinceRebill: 0,
        fbSinceRebillSpend: 0,
        ordersLast30: 0,
        ordersSinceRebill: 0,
        fbLast30RoasSum: 0,
        fbLast30RoasCount: 0,
        fbSinceRebillRoasSum: 0,
        fbSinceRebillRoasCount: 0,
      },
    )

    // Compute average ROAS
    const avgRoas30 =
      totals.fbLast30RoasCount > 0
        ? totals.fbLast30RoasSum / totals.fbLast30RoasCount
        : 0

    const avgRoasRebill =
      totals.fbSinceRebillRoasCount > 0
        ? totals.fbSinceRebillRoasSum / totals.fbSinceRebillRoasCount
        : 0

    // Append totals row
    allRows.push([
      'n/a', // Monitored
      'TOTAL/AVG', // Name
      new Date().toDateString(), // Pod
      totals.fbLast30Spend.toLocaleString(), // Ad spend (timeframe)
      avgRoas30.toFixed(2), // ROAS (timeframe)
      totals.revenueLast30.toLocaleString(), // Revenue (timeframe)
      totals.fbSinceRebillSpend.toLocaleString(), // Ad spend (rebill)
      avgRoasRebill.toFixed(2), // ROAS (rebill)
      totals.revenueSinceRebill.toLocaleString(), // Revenue (rebill)
      'n/a', // Is rebillable
      'n/a', // Last rebill date
      totals.ordersLast30.toLocaleString(), // Orders (timeframe)
      totals.ordersSinceRebill.toLocaleString(), // Orders (rebill)
    ])

    // Write to sheet
    await appendDataToSheet(sheetId, allRows)

    return { success: true }
  } catch (error) {
    console.error('Error in refreshSheetData:', error)
    return { success: false, error: 'Failed to refresh sheet data' }
  }
}

export async function changePassword() {
  const db = createClient()

  await db.auth.updateUser({
    password: '',
  })
}
