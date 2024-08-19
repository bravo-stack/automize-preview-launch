import AddStore from '@/components/AddStore'
import FinancialX from '@/components/FinancialX'
import StoreList from '@/components/StoreList'
import { createClient } from '@/lib/db/server'

export default async function FinancialXPage() {
  const db = createClient()
  const { data: allStores } = await db.from('store').select('*').order('name')

  return (
    <main className="gap-10 px-6 py-28 lg:px-12 lg:py-12">
      <div className="rounded-md-md space-y-10 bg-night-starlit p-5 lg:p-10">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">Shopify Store List</h2>

          <div className="space-x-2">
            <a
              className="underline"
              href="https://docs.google.com/spreadsheets/d/19lCLSuG9cU7U0bL1DiqWUd-QbfBGPEQgG7joOnu9gyY/"
              target="_blank"
              rel="noopener"
            >
              Visit Financials Sheet
            </a>
            <FinancialX stores={allStores ?? []} />
            <AddStore />
          </div>
        </div>

        <StoreList stores={allStores ?? []} />
      </div>
    </main>
  )
}
