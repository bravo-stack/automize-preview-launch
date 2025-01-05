import { createClient } from '@/lib/db/server'
import ListTabs from './ListTabs'

export default async function AccountsPage() {
  const db = createClient()

  const { data: accounts } = await db
    .from('clients')
    .select('id, brand, fb_key, pod, status, closed_at')
  // .is('onboarded', true)

  const { data: pods } = await db.from('pod').select('name')

  const left = accounts?.filter((account) => account.status === 'left')
  const active = accounts?.filter((account) => account.status === 'active')

  return (
    <main className="flex flex-col justify-center space-y-10 px-6 pb-24 pt-10 md:px-24">
      <ListTabs left={left} active={active} pods={pods} />
    </main>
  )
}
