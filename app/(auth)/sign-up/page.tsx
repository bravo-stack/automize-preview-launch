'use client'

import NotificationModal from '@/components/NotificationModal'
import { createUser } from '@/lib/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)

  const router = useRouter()

  const formFields = [
    {
      label: 'Company',
      type: 'text',
      id: 'company',
      name: 'company',
      placeholder: 'Your company name',
      required: true,
      value: company,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setCompany(e.target.value),
    },
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
      placeholder: 'Choose a strong password',
      required: true,
      value: password,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setPassword(e.target.value),
    },
  ]

  const handleSignUp = async (event: any) => {
    event.preventDefault()

    if (!company || !email || !password) {
      setShowModal(true)
      return
    }

    setLoading(true)

    try {
      const { error } = await createUser(email, password, company)

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
      <header className="mb-20 text-center">
        <h2 className="text-xps-orange text-lg font-semibold tracking-wide">
          A New Beginning
        </h2>
        <h1 className="mb-3 text-4xl font-semibold tracking-wide">Sign Up</h1>
      </header>

      <>
        <form
          onSubmit={handleSignUp}
          className="border-xps-deepBlue bg-xps-blue w-full rounded-xl border px-7 py-7 md:w-96"
        >
          {formFields.map((field) => (
            <div
              className="text-xps-deepBlue caret-xps-deepBlue mb-3"
              key={field.id}
            >
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
                className="focus:ring-xps-blue w-full rounded-md border border-gray-300 bg-black px-1.5 py-1.5 focus:outline-none focus:ring-2"
                placeholder={field.placeholder}
                onChange={field.onChange}
                value={field.value}
                required={field.required}
              />
            </div>
          ))}

          <button
            type="submit"
            className="border-xps-orange bg-xps-orange/10 text-xps-orange hover:border-xps-accentBlue hover:bg-xps-deepBlue/60 mt-3 w-full rounded-md border px-3 py-1.5 font-semibold tracking-wide shadow-md transition-all hover:text-white"
          >
            Submit
          </button>
        </form>

        {(loading || success || error) && (
          <NotificationModal
            state={loading ? 'loading' : success ? 'signup' : 'error'}
            onClose={() => {
              setLoading(false)
              setSuccess(false)
              setError(false)
            }}
          />
        )}

        {showModal && (
          <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center p-3 sm:p-0">
            <div className="flex flex-col justify-center rounded-md border-2 bg-white p-5 shadow-lg">
              <p>Please fill out all required fields, thank you.</p>
              <button
                className="bg-purple-pale mt-3 rounded-md px-4 py-2 text-white transition-colors hover:saturate-150"
                onClick={() => setShowModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </>
    </main>
  )
}
