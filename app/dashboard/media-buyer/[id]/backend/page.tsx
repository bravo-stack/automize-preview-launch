import Table from '@/components/common/table'
import { createClient } from '@/lib/db/server'

export default async function BackendPage({ params }) {
  const { id } = params
  const db = createClient()

  const { data } = await db.from('backend_table').select()

  return (
    <main className="space-y-7 p-7">
      <Table data={[]} />
    </main>
  )
}
