import { getServerSession } from 'next-auth/next'

export default async function LoginPage() {
  const session = await getServerSession()
  console.log(session)

  return (
    <main className="p-24">
      <h1>Login</h1>
    </main>
  )
}
