'use client'

import { signIn } from 'next-auth/react'

export default function LoginPage() {
  return (
    <main className="p-24">
      <h1>Login</h1>
      <button onClick={() => signIn('facebook')}>Login with Facebook</button>
    </main>
  )
}
