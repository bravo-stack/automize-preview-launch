import { getRole } from '@/lib/actions'
import { createClient } from '@/lib/db/server'
import EditClientPortfolio from './edit-full-portfolio'

export default async function EditNotes({ params }) {
  const db = createClient()
  const { id } = params

  const { data: client } = await db
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  const role = await getRole()

  return (
    <main className="space-y-7 p-7">
      <header>
        <h1 className="text-2xl font-bold tracking-tighter">
          Editing {client.brand}
        </h1>
      </header>

      <EditClientPortfolio role={role} client={client} />
    </main>
  )
}
