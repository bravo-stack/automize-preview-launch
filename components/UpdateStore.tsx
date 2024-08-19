'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStore } from '@/lib/actions'

export default function UpdateStore({ store }: any) {
  const [name, setName] = useState(store.name)
  const [store_id, setStoreId] = useState(store.store_id)
  const [key, setKey] = useState(store.key)
  const [last_rebill, setLastRebill] = useState(store.last_rebill || '')
  const [account_id, setAccountId] = useState(store.account_id || '')
  const [open, setShow] = useState(false)

  const router = useRouter()

  const handleSave = async () => {
    const response = await updateStore({
      id: store.id,
      name,
      store_id,
      key,
      last_rebill,
      account_id,
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
    setName(store.name)
    setStoreId(store.store_id)
    setKey(store.key)
    setAccountId(store.account_id)
    setShow(false)
  }

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="text-indigo-600 hover:text-indigo-900"
      >
        Update Rebilling
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Create New Sheet</h2>
            <form className="space-y-4">
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
                  disabled
                  placeholder="E.g. 1234567890..."
                  className="w-full rounded border bg-gray-500/30 px-3 py-2"
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
                  disabled
                  required
                  className="w-full rounded border bg-gray-500/30 px-3 py-2"
                />
                <p className="mt-1 text-wrap text-xs text-gray-600">
                  Note: This is a secret token that grants access to the
                  store&apos;s data, be careful in handling it. Automize will
                  safely encrypt the keys upon processing.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md bg-black px-4 py-2 text-white shadow-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSave}
                  className="rounded-md border border-zinc-800 px-4 py-2 shadow-sm transition-colors hover:bg-zinc-800/10"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
