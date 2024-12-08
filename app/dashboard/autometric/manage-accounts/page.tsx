import { createClient } from '@/lib/db/server'
import AccountList from '@/components/AccountList'
import ListTabs from './ListTabs'

export default async function AccountsPage() {
  const db = createClient()

  const { data: accounts } = await db
    .from('accounts')
    .select('id, name, account_id, pod, status, created_at')

  const left = accounts?.filter((account) => account.status === 'left')
  const active = accounts?.filter((account) => account.status === 'active')

  return (
    <main className="flex flex-col justify-center space-y-10 px-6 pb-24 pt-10 md:px-24">
      <ListTabs left={left} active={active} />
    </main>
  )
}
