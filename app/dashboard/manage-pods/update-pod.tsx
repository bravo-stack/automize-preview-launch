'use client'

import { updateItem } from '@/lib/actions/db'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function UpdateClientPod({ client, pods }) {
  const [open, setOpen] = useState(false)
  const [pod, setPod] = useState(client.pod || 'none')
  const router = useRouter()

  const handleSave = async () => {
    const { error } = await updateItem('clients', { pod }, client.id)

    if (error) {
      alert('Error updating pod.')
    } else {
      router.refresh()
      alert('Pod updated successfully.')
    }

    setPod('')
  }

  return (
    <>
      <h4
        onClick={() => setOpen(true)}
        className="inline-flex w-44 cursor-pointer items-center truncate whitespace-nowrap p-2.5 text-sm font-medium transition-colors hover:bg-night-dusk"
      >
        {client.brand}
      </h4>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">
              Update Pod for {client.brand}
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Pod</label>
                <select
                  value={pod}
                  onChange={(e) => setPod(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="none">None</option>
                  {pods.map((pod, index) => (
                    <option key={index} value={pod.name}>
                      {pod.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
