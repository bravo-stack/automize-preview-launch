import { createClient } from '@/lib/db/server'
import SheetInfo from './SheetInfo'

export default async function Sheet({ params }: { params: { sheet: string } }) {
  const db = createClient()

  const {
    data: { user },
  } = await db.auth.getUser()

  const role = user?.user_metadata?.role ?? 'exec'

  const { data: sheet } = await db
    .from('sheets')
    .select('*')
    .eq('sheet_id', params.sheet)
    .single()

  const execLinks = ['Sheet', 'Automations', 'History', 'Settings']
  const podLinks = ['Sheet', 'Automations', 'History']
  const lastRefresh = new Date(sheet?.last_refresh).toLocaleString()

  return (
    <main className="flex flex-col justify-center space-y-10 p-24">
      <section className="rounded-2xl border border-zinc-800 bg-night-starlit p-6">
        <header className="mb-6 flex justify-between border-b border-zinc-800 pb-3">
          <h2 className="border-zinc-800 text-3xl font-medium tracking-wide">
            {sheet.title}
          </h2>

          <a
            href={`https://docs.google.com/spreadsheets/d/${sheet?.sheet_id}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-white px-3 py-2 font-medium text-black"
          >
            Visit
          </a>
        </header>

        <SheetInfo
          links={role === 'exec' ? execLinks : podLinks}
          data={{ sheet, lastRefresh }}
          role={role}
        />
      </section>
    </main>
  )
}
