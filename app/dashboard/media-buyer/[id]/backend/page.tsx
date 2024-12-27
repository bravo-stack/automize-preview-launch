import Table from '@/components/common/table'
import { createClient } from '@/lib/db/server'
import EditBackendButton from './edit-backend'

export default async function BackendPage({ params }) {
  const { id } = params
  const db = createClient()

  const { data } = await db.from('backend_table').select('*').eq('user_id', id)

  const accounts = data?.map(({ user_id: _, ...rest }) => ({
    ...rest,
    action: <EditBackendButton client={{ ...rest }} />,
  }))

  return (
    <main className="space-y-7 p-7">
      <Table data={accounts} />
    </main>
  )
}
