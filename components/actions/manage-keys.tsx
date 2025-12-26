'use client'

import { updateKeys } from '@/lib/actions/db'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ManageKeys({ client }) {
  const [fb_key, setKeyF] = useState('')
  const [shopify_key, setKeyS] = useState('')
  const [store_id, setStoreID] = useState('')
  const [omni_keys, setOmniKeys] = useState('')
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const handleSave = async (e) => {
    e.preventDefault()

    const payload: {
      id: any
      fb_key?: string
      shopify_key?: string
      store_id?: string
      omni_keys?: string
    } = { id: client.id }

    if (fb_key) payload.fb_key = fb_key
    if (shopify_key) payload.shopify_key = shopify_key
    if (store_id) payload.store_id = store_id
    if (omni_keys) payload.omni_keys = omni_keys

    if (Object.keys(payload).length <= 1) {
      alert('No changes to save.')
      return
    }

    const { error } = await updateKeys(payload)

    if (error) {
      alert('Error updating keys.')
    } else {
      router.refresh()
      alert('Successfully updated keys.')
    }
  }

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-md border border-red-500 px-3 py-1.5 font-medium text-red-500"
      >
        View Private Keys
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">
              Private Keys for {client.brand}
            </h2>

            <div className="mb-4">
              <p>Account ID: {client.fb_key ?? 'N/A'}</p>
              <p className="truncate">
                Shopify Key: {client.shopify_key ?? 'N/A'}
              </p>
              <p>Store ID: {client.store_id ?? 'N/A'}</p>
              <p className="truncate">Omni Keys: {client.omni_keys ?? 'N/A'}</p>
            </div>

            <h2 className="mb-4 text-xl font-bold">Edit Keys</h2>

            <form className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Account ID</label>
                <input
                  type="text"
                  value={fb_key}
                  onChange={(e) => setKeyF(e.target.value)}
                  required
                  placeholder="E.g. 1548210302421"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Store ID</label>
                <input
                  type="text"
                  value={store_id}
                  onChange={(e) => setStoreID(e.target.value)}
                  required
                  placeholder="E.g. test-store"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Shopify Access Token
                </label>
                <input
                  type="text"
                  value={shopify_key}
                  onChange={(e) => setKeyS(e.target.value)}
                  required
                  placeholder="E.g. 1234567890..."
                  className="w-full rounded border px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Note: This is a secret token that grants access to the
                  store&apos;s data, be careful in handling it. Automize will
                  safely encrypt the keys upon processing.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium">Omni Keys</label>
                <input
                  type="text"
                  value={omni_keys}
                  onChange={(e) => setOmniKeys(e.target.value)}
                  required
                  placeholder="E.g. 1234567890..."
                  className="w-full rounded border px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Note: This is a secret token that grants access to the Omni
                  services, be careful in handling it. Automize will safely
                  encrypt the keys upon processing.
                </p>
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
    </div>
  )
}
