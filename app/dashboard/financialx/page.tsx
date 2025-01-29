import AddStore from '@/components/AddStore'
import FinancialX from '@/components/FinancialX'
import StoreList from '@/components/StoreList'
import { createClient } from '@/lib/db/server'

export const maxDuration = 30

export default async function FinancialXPage() {
  const db = createClient()

  const { data: stores } = await db
    .from('clients')
    .select('id, brand, fb_key, store_id, shopify_key, rebill_date')
    .order('brand')
    .neq('store_id', null)
    .eq('status', 'active')

  return (
    <main className="gap-10 px-6 py-28 lg:px-12 lg:py-12">
      <div className="space-y-10 rounded-md bg-night-starlit p-5 lg:p-10">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">Shopify Store List</h2>

          <div className="flex items-center gap-2">
            <a
              className="underline"
              href="https://docs.google.com/spreadsheets/d/19lCLSuG9cU7U0bL1DiqWUd-QbfBGPEQgG7joOnu9gyY/"
              target="_blank"
              rel="noopener"
            >
              Visit Financials Sheet
            </a>
            <FinancialX stores={stores ?? []} />
            <AddStore />
          </div>
        </div>

        <StoreList stores={stores ?? []} />
      </div>
    </main>
  )
}
