'use client'

import { createAccount } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CreateAccount() {
  const [name, setName] = useState('')
  const [account_id, setAccount_Id] = useState('')
  const [pod, setPod] = useState('none')
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    const response = await createAccount({
      name,
      account_id: `act_${account_id}`,
      pod,
    })

    if (!response) {
      console.error('Error creating account.')
    } else {
      router.refresh()
    }

    setShowModal(false)
    setName('')
    setAccount_Id('')
    setPod('')
  }

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-md bg-white px-3 py-1.5 font-medium text-black"
      >
        New&nbsp;Account&nbsp;+
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Create New Sheet</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    Account Name
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
                  <label className="block text-sm font-medium">
                    Account ID
                  </label>
                  <input
                    type="text"
                    value={account_id}
                    onChange={(e) => setAccount_Id(e.target.value)}
                    required
                    placeholder="E.g. 1234567890..."
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Pod</label>
                <select
                  value={pod}
                  onChange={(e) => setPod(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="none">None</option>
                  <option value="maps">Maps</option>
                  <option value="justin">Justin</option>
                  <option value="ray">Ray</option>
                  <option value="zain">Zain</option>
                  <option value="kelsey">Kelsey</option>
                  <option value="shalin">Shalin</option>
                  <option value="kyrillos">Kyrillos</option>
                  <option value="gabe">Gabe</option>
                  <option value="inti">Inti</option>
                  <option value="aun">Aun</option>
                </select>
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
