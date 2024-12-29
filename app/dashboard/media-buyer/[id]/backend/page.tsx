import Table from '@/components/common/table'
import { createClient } from '@/lib/db/server'
import EditBackendButton from './edit-backend'

export default async function BackendPage({ params }) {
  const { id } = params
  const db = createClient()

  const { data } = await db
    .from('backend_table')
    .select('*')
    .eq('user_id', id)
    .order('brand')

  const accounts = data?.map(({ user_id: _, client_id, ...rest }) => ({
    edit: <EditBackendButton client={{ ...rest }} client_id={client_id} />,
    ...rest,
  }))

  return (
    <main className="space-y-7 p-7">
      <Table data={accounts} />
    </main>
  )
}
