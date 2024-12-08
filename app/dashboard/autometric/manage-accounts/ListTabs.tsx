'use client'

import AccountList from '@/components/AccountList'
import { useState } from 'react'

export default function ListTabs({ active, left }) {
  const [list, setList] = useState('active')

  const toggleList = () => setList(list === 'active' ? 'churned' : 'active')

  return (
    <div>
      <header className="mb-10 text-center">
        <h1 className="bg-gradient-to-b from-white via-zinc-500/90 to-white/60 bg-clip-text text-4xl tracking-wide text-transparent">
          Manage Accounts
        </h1>
        <h2 className="text-lg text-white/70">
          Currently viewing {list === 'active' ? active.length : left.length}{' '}
          {list} accounts.{' '}
          <button className="underline" onClick={toggleList}>
            View {list === 'active' ? 'churned' : 'active'}
          </button>
        </h2>
      </header>

      {list === 'active' && <AccountList accounts={active} />}
      {list === 'churned' && <AccountList accounts={left} />}
    </div>
  )
}
