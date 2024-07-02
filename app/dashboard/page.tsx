import Link from 'next/link'
import UserApps from '@/components/UserApps'
import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const db = createClient()

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    console.error('Could not find user.')
    redirect('/login')
  }

  const userApps = [
    { name: 'Auto-Metric', link: '/dashboard/autometric' },
    { name: 'AI Consultant', link: '' },
    { name: 'Triple Whale', link: '' },
  ]

  return (
    <main className="px-24 pb-24 pt-10">
      <section>
        <hgroup className="mb-10">
          <h1 className="w-fit bg-gradient-to-b from-white via-zinc-500/90 to-white/70 bg-clip-text text-4xl tracking-wide text-transparent">
            Welcome, {user?.user_metadata.company ?? 'User'}.
          </h1>
          <h2 className="text-4xl text-white/70">View your applications</h2>
        </hgroup>

        <UserApps userApps={userApps} />
      </section>
    </main>
  )
}
