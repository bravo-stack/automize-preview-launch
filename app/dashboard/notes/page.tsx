import Section from '@/components/common/section'
import Table from '@/components/common/table'
import { createAdminClient } from '@/lib/db/admin'
import EditNotes from './editNotes'

export default async function NotificationPage() {
  const db = createAdminClient()

  const { data, error } = await db
    .from('clients')
    .select(
      'id, brand, drop_day, mb_notes, intro_notes, organic_notes, education_info, whimsicals, client_reports',
    )

  if (error || !data) {
    return (
      <main className="space-y-7 p-7">
        <Section title="Accounts">
          <div className="p-5">No accounts assigned for this pod.</div>
        </Section>
      </main>
    )
  }

  const accounts = data.map(({ id, ...client }) => ({
    ...client,
    action: <EditNotes client={{ id, ...client }} />,
  }))

  return (
    <main className="space-y-7 p-7">
      <Table data={accounts} />
    </main>
  )
}
