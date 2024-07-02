import { createClient } from '@/lib/db/server'
import { accounts } from '@/content/accounts'
import AccountList from '@/components/AccountList'

export default async function AccountsPage() {
  const db = createClient()

  const { data: accounts } = await db.from('account').select('*')

  //   async function insertAccounts() {
  //     const accountData = accounts.map((account) => ({
  //       account_id: account.id,
  //       name: account.name,
  //     }))

  //     const { data, error } = await db.from('account').insert(accountData)

  //     if (error) {
  //       console.error('Error inserting accounts:', error)
  //     } else {
  //       console.log('Successfully inserted accounts:', data)
  //     }
  //   }

  //   insertAccounts()

  //   console.log(accounts)

  return (
    <main className="flex flex-col justify-center space-y-10 px-6 pb-24 pt-10 md:px-24">
      <AccountList accounts={accounts ?? []} />
    </main>
  )
}
