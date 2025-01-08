'use client'

import { saveStore } from '@/lib/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddStore() {
  const [name, setName] = useState('')
  const [store_id, setStoreId] = useState('')
  const [key, setKey] = useState('')
  const [last_rebill, setLastRebill] = useState('')
  const [account_id, setAccountId] = useState('')
  const [open, setShow] = useState(false)

  const router = useRouter()

  const handleSave = async () => {
    const response = await saveStore({
      name,
      account_id: `act_${account_id}`,
      store_id,
      key,
      last_rebill,
    })

    if (!response) {
      alert('There was an error saving the store.')
    } else {
      router.refresh()
      alert('Store saved successfully.')
    }

    setName('')
    setStoreId('')
    setKey('')
    setAccountId('')
    setShow(false)
  }

  const handleCancel = () => {
    setName('')
    setStoreId('')
    setKey('')
    setAccountId('')
    setShow(false)
  }

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 font-medium text-black"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className=" size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
        Add Shopify Access
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">
              How to Add Shopify Access
            </h2>

            <p className="mb-4 leading-loose">
              In the new automize system, clients are entered into the database
              through the onboarding process. To add a clients&apos; access
              keys, please first onboard the client, then visit their portfolio
              and click the &apos;View Private Keys&apos; button. This will let
              you edit the Facebook Key, Shopify Key, and Shopify Store ID. You
              can visit client portfolios{' '}
              <a
                href="https://automize.vercel.app/dashboard/autometric/manage-accounts"
                className="underline"
              >
                here
              </a>
              .
            </p>

            {/* <form className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="E.g. InsightX Media"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Store ID</label>
                  <input
                    type="text"
                    value={store_id}
                    onChange={(e) => setStoreId(e.target.value)}
                    required
                    placeholder="E.g. c2a04d"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Facebook Account ID
                </label>
                <input
                  type="text"
                  value={account_id}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                  placeholder="E.g. 1234567890..."
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Last Rebill Date
                </label>
                <input
                  type="date"
                  value={last_rebill}
                  onChange={(e) => setLastRebill(e.target.value)}
                  required
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Access Token
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Secret Key"
                  required
                  className="w-full rounded border px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Note: This is a secret token that grants access to the
                  store&apos;s data, be careful in handling it. Automize will
                  safely encrypt the keys upon processing.
                </p>
              </div>

              
            </form> */}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md bg-black px-4 py-2 text-white shadow-sm transition-colors"
              >
                Close
              </button>
              {/* <button
                  type="submit"
                  onClick={handleSave}
                  className="rounded-md border border-zinc-800 px-4 py-2 shadow-sm transition-colors hover:bg-zinc-800/10"
                >
                  Save
                </button> */}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
