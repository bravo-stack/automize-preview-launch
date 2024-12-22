'use client'

import NotificationModal from '@/components/NotificationModal'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInUser } from '@/lib/actions'
import { StarsBackground } from '@/components/ui/stars-background'
import { ShootingStars } from '@/components/ui/shooting-stars'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)

  const router = useRouter()

  const formFields = [
    {
      label: 'Email',
      type: 'email',
      id: 'email',
      name: 'email',
      placeholder: 'Enter your email',
      required: true,
      value: email,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setEmail(e.target.value),
    },
    {
      label: 'Password',
      type: 'password',
      id: 'password',
      name: 'password',
      placeholder: 'Enter your password',
      required: true,
      value: password,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setPassword(e.target.value),
    },
  ]

  const handleSignUp = async (event: any) => {
    event.preventDefault()

    if (!email || !password) {
      setShowModal(true)
      return
    }

    setLoading(true)

    try {
      const error = await signInUser(email, password)

      if (!error) {
        setSuccess(true)
        router.push('/dashboard')
      } else {
        setSuccess(false)
        setError(true)
      }
    } catch (error) {
      console.error('Network error:', error)
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-10 md:px-24">
      <>
        <form
          onSubmit={handleSignUp}
          className="z-50 w-full rounded-xl border border-zinc-800 bg-night-starlit px-7 py-7 md:w-96"
        >
          <header className="mb-12 text-center">
            {/* <h2 className="text-xps-orange text-lg font-semibold tracking-wide"></h2> */}
            <h1 className="mb-3 text-3xl font-bold tracking-tighter">
              Automize Login
            </h1>
            {/* <h3 className="text-lg">
          Don&apos;t have an account? Create a new one{' '}
          <Link href="/sign-up" className="text-xps-orange underline">
            here
          </Link>
          .
        </h3> */}
          </header>

          {formFields.map((field) => (
            <div className="mb-3" key={field.id}>
              <label
                htmlFor={field.id}
                className="mb-1.5 block font-semibold tracking-wide text-white"
              >
                {field.label}
              </label>

              <input
                type={field.type}
                id={field.id}
                name={field.name}
                className="w-full rounded-md border border-zinc-800 bg-night-starlit px-1.5 py-1.5 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                placeholder={field.placeholder}
                onChange={field.onChange}
                value={field.value}
                required={field.required}
              />
            </div>
          ))}

          <button
            type="submit"
            className="mt-3 w-full rounded-md border bg-white px-3 py-1.5 font-semibold tracking-wide text-black shadow-md transition-all hover:font-bold"
          >
            Sign In
          </button>
        </form>

        {(loading || error) && (
          <NotificationModal
            state={loading ? 'loading' : success ? 'signin' : 'password'}
            onClose={() => {
              setLoading(false)
              setSuccess(false)
              setError(false)
            }}
          />
        )}

        {showModal && (
          <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center p-3 text-black sm:p-0">
            <div className="flex flex-col justify-center rounded-md border-2 bg-white p-5 shadow-lg">
              <p>Please fill out all required fields, thank you.</p>
              <button
                className="bg-xps-orange mt-3 rounded-md px-4 py-2 text-white transition-colors hover:saturate-150"
                onClick={() => setShowModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </>

      <ShootingStars />
      <StarsBackground />
    </main>
  )
}
