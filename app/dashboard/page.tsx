'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const userName = 'Zain'
  const userApps = ['Auto-Metric', 'Fortnite']

  //   const { data: session, status } = useSession()
  //   const router = useRouter()

  //   if (status === 'loading') {
  //     return <p>Loading...</p>
  //   }

  //   if (!session) {
  //     signIn()
  //     return <p>Redirecting...</p>
  //   }

  //   console.log(session.user?.name)

  return (
    <main className="p-24">
      <section>
        <hgroup className="mb-10">
          <h1>Welcome, {userName}.</h1>
          <h2>Your apps</h2>
        </hgroup>

        <ul className="grid grid-cols-8">
          {userApps.map((app, index) => {
            return <li key={app}>{app}</li>
          })}
        </ul>
      </section>
    </main>
  )
}
