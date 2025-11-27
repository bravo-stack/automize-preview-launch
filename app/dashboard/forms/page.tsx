import { createClient } from '@/lib/db/server'
import FormLinks from './form-links'
import RefreshFormBtn from './refresh-forms'

export default async function FormsPage() {
  const db = createClient()

  const { data: clients } = await db
    .from('clients')
    .select('id, brand, email, closed_by, closed_at, drive')
    .order('brand', { ascending: true })

  return (
    <main className="space-y-7 p-7">
      <section className="mx-auto max-w-7xl divide-y divide-zinc-800 overflow-hidden rounded-md border border-zinc-800">
        <div className="flex w-full flex-col items-stretch justify-start md:flex-row md:items-center md:justify-between">
          <div className="bg-night-starlit px-5 py-2.5">
            <h2 className="text-lg font-semibold tracking-tighter">
              Client Forms
            </h2>
            <p className="text-sm text-neutral-400">
              Generate and copy form links for clients
            </p>
          </div>

          <RefreshFormBtn />
        </div>
        <FormLinks clients={clients || []} />
      </section>
    </main>
  )
}
