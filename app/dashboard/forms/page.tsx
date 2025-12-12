import { createClient } from '@/lib/db/server'
import FormLinks from './form-links'
import RefreshFormBtn from './refresh-forms'

export default async function FormsPage() {
  const db = createClient()

  const {
    data: { user },
  } = await db.auth.getUser()

  const role = user?.user_metadata.role ?? 'exec'

  let podData: { id: number; name: string | null } | null = null

  if (role === 'pod' && user) {
    const { data: fetchedPod } = await db
      .from('pod')
      .select('id, name')
      .eq('user_id', user.id)
      .single()
    podData = fetchedPod
  }

  // Build query - filter by pod name for non-exec users
  let query = db
    .from('clients')
    .select('id, brand, email, closed_by, closed_at, drive, pod')
    .order('brand', { ascending: true })

  if (role === 'pod' && podData?.name) {
    query = query.eq('pod', podData.name)
  }

  const { data: clients } = await query

  return (
    <main className="space-y-7 p-7">
      <section className="mx-auto max-w-7xl divide-y divide-zinc-800 overflow-hidden rounded-md border border-zinc-800">
        <div className="flex w-full flex-col items-stretch justify-start md:flex-row md:items-center md:justify-between">
          <div className="bg-night-starlit px-5 py-2.5">
            <h2 className="text-lg font-semibold tracking-tighter">
              Client Forms
            </h2>
            <p className="text-sm text-neutral-400">
              {role === 'pod' && podData?.name
                ? `Generate and copy form links for ${podData.name.charAt(0).toUpperCase() + podData.name.slice(1)} pod clients`
                : 'Generate and copy form links for clients'}
            </p>
          </div>

          <RefreshFormBtn />
        </div>
        <FormLinks clients={clients || []} />
      </section>
    </main>
  )
}
