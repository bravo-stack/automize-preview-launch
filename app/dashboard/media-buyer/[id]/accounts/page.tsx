import Section from '@/components/common/section'
import Table from '@/components/common/table'
import { createAdminClient } from '@/lib/db/admin'
import EditPodAccountButton from './editPodAccount'

export default async function NotificationPage({ params }) {
  const { id } = params
  const db = createAdminClient()

  const { data, error } = await db
    .from('pod_table')
    .select('client_id, brand, notes, drive, website, insta, drop_day')
    .eq('user_id', id)

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
    ...client,
    action: <EditPodAccountButton client={{ client_id, ...client }} />,
  }))

  return (
    <main className="space-y-7 p-7">
      <Table data={accounts} />
    </main>
  )
}
