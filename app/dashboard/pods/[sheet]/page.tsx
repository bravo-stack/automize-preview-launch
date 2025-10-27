import FinancialX from '@/components/FinancialX'
import { createClient } from '@/lib/db/server'
import SheetInfo from './SheetInfo'

export async function generateMetadata({ params, searchParams }) {
  const db = createClient()

  const { data: pod } = await db
    .from('sheets')
    .select('pod')
    .eq('sheet_id', params.sheet)
    .single()

  const podName = pod?.pod
    ? pod.pod.charAt(0).toUpperCase() + pod.pod.slice(1)
    : 'Pod'

  return {
    title: `${podName} Pod - Automize`,
  }
}

export default async function Sheet({ params }: { params: { sheet: string } }) {
  const db = createClient()

  const { data: sheet } = await db
    .from('sheets')
    .select('*')
    .eq('sheet_id', params.sheet)
    .single()

  const { data: stores } = await db
    .from('clients')
    .select('id, brand, pod, fb_key, store_id, shopify_key, rebill_date')
    .order('brand')
    .eq('pod', sheet.pod)
    .neq('store_id', null)
    .eq('status', 'active')

  const links = ['Sheet', 'Automations', 'History', 'Settings']
  const lastRefresh = new Date(sheet.last_refresh).toLocaleString()
  const pod = sheet.pod as string

  return (
    <main className="flex flex-col justify-center space-y-10 p-24">
      <section className="rounded-2xl border border-zinc-800 bg-night-starlit p-6">
        <header className="mb-6 flex justify-between border-b border-zinc-800 pb-3">
          <h2 className="border-zinc-800 text-3xl font-medium tracking-wide">
            {sheet.title}
          </h2>

          <div className="space-x-3">
            <FinancialX stores={stores || []} sheetId={sheet.sheet_id} />

            <a
              href={`https://docs.google.com/spreadsheets/d/${sheet.sheet_id}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-white px-3 py-2 font-medium text-black"
            >
              Visit
            </a>
          </div>
        </header>

        <SheetInfo links={links} data={{ sheet, lastRefresh }} pod={pod} />
      </section>
    </main>
  )
}
