'use client'

import { createItem, createUser } from '@/lib/actions/db'
import { generateRandomString } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CreateAccount() {
  const [pod, setPod] = useState('')
  const [discordId, setDiscordId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const email = `${pod}@automize.com`
  const password = generateRandomString(14)

  const handleCopy = () => {
    navigator.clipboard
      .writeText(
        `Email: ${email}, Pass: ${password}, Sign-in: https://automize.vercel.app/login`,
      )
      .then(() => {
        alert('Text copied to clipboard!')
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err)
      })
  }

  const handleSave = async (e) => {
    e.preventDefault()

    const { error } = await createUser(email, password, pod, discordId)

    alert(
      error
        ? 'Error uploading pod to database'
        : 'Successfully created pod and account',
    )

    setShowModal(false)
    setPod('')
    setDiscordId('')

    router.refresh()
  }

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-md bg-white px-3 py-1.5 font-medium text-black"
      >
        Create&nbsp;Account&nbsp;+
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Create New Account</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Pod Name</label>
                <input
                  type="text"
                  value={pod}
                  onChange={(e) => setPod(e.target.value)}
                  required
                  placeholder="E.g. Maps"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Discord ID</label>
                <input
                  type="text"
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                  placeholder="E.g. 1204501213051"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div onClick={handleCopy} className="cursor-pointer">
                <p className="block font-semibold">
                  The following account will be created
                </p>

                <p>Email: {email}</p>
                <p>Password: {password}</p>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md bg-black px-4 py-2 text-white shadow-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-800 px-4 py-2 shadow-sm transition-colors hover:bg-zinc-800/10"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
