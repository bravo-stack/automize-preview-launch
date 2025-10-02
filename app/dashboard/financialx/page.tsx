import AddStore from '@/components/AddStore'
import SheetCard from '@/components/SheetCard'
import StoreList from '@/components/StoreList'
import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'

export const maxDuration = 60

export default async function FinancialXPage() {
  const db = createClient()

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: stores } = await db
    .from('clients')
    .select(
      'id, brand, pod, fb_key, store_id, shopify_key, rebill_date, is_monitored',
    )
    .order('brand')
    .neq('store_id', null)
    .eq('status', 'active')

  const { data: sheets } = await db
    .from('sheets')
    .select('*')
    .eq('is_finance', true)

  return (
    <main className="gap-10 px-6 py-28 lg:px-12 lg:py-12">
      <div className="space-y-10 rounded-2xl border bg-night-starlit p-5 lg:p-10">
        <div className="flex justify-between">
          <h2 className="text-2xl font-semibold">FinanceX Overview</h2>

          <div className="flex items-center gap-2">
            {/* <a
              className="rounded px-2 py-1.5 underline"
              href="https://docs.google.com/spreadsheets/d/19lCLSuG9cU7U0bL1DiqWUd-QbfBGPEQgG7joOnu9gyY/"
              target="_blank"
              rel="noopener"
            >
              Visit Main Financials Sheet
            </a>
            <FinancialX stores={stores ?? []} batchStores main /> */}
            <AddStore />
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 flex gap-3">
            <div className="flex w-full items-center gap-2 border-b-2 border-zinc-800 bg-night-starlit py-1 text-lg font-medium">
              Finance Time Frames
            </div>

            {/* <CreateSheet user={user} finance={true} /> */}
          </div>

          <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {sheets
              ?.sort((a, b) => {
                // Define order for time periods
                const timeOrder = {
                  today: 1,
                  yesterday: 2,
                  last_3d: 3,
                  last_7d: 4,
                  last_14d: 5,
                  last_30d: 6,
                  this_month: 7,
                  maximum: 8,
                }

                // Sort by the predefined order
                return (
                  timeOrder[a.refresh.toLowerCase()] -
                  timeOrder[b.refresh.toLowerCase()]
                )
              })
              .map((sheet, index) => {
                return (
                  <SheetCard key={index} sheet={sheet} stores={stores ?? []} />
                )
              })}
          </ul>
        </div>

        <StoreList stores={stores ?? []} />
      </div>
    </main>
  )
}
