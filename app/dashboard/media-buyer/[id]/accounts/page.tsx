import { createAdminClient } from '@/lib/db/admin'
import Section from '@/components/common/section'
import Table from '@/components/common/table'
import EditPodAccountButton from './editPodAccount'
import Link from 'next/link'

export default async function NotificationPage({ params }) {
  const { id } = params
  const db = createAdminClient()

  const { data, error } = await db
    .from('pod_table')
    .select('client_id, brand, notes, drop_day, drive, website, insta')
    .eq('user_id', id)
    .order('brand')

  if (error || !data) {
    return (
      <main className="space-y-7 p-7">
        <Section title="Accounts">
          <div className="p-5">No accounts assigned for this pod.</div>
        </Section>
      </main>
    )
  }

  const accounts = data.map(({ client_id, ...client }) => ({
    edit: <EditPodAccountButton client={{ client_id, ...client }} />,
    ...client,
    details: (
      <Link
        href={`/dashboard/notes/${client_id}`}
        className="block w-fit rounded-md border border-zinc-800 bg-night-dusk px-1.5 py-0.5 text-neutral-400 transition-colors hover:border-zinc-700"
      >
        View Details
      </Link>
    ),
  }))

  return (
    <main className="space-y-7 p-7">
      <Table data={accounts} />
    </main>
  )
}
