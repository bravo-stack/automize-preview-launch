'use client'

import { updateItem } from '@/lib/actions/db'
import { useState } from 'react'

export default function EditNotes({ client }) {
  const [mb_notes, setMBNotes] = useState(client.mb_notes ?? '')
  const [education_info, setEducationInfo] = useState(
    client.education_info ?? '',
  )
  const [organic_notes, setOrganicNotes] = useState(client.organic_notes ?? '')
  const [backend_notes, setBackendNotes] = useState(
    client.backend_notes ?? null,
  )
  const [open, setOpen] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()

    const mediaBuyerUpdates = {
      mb_notes,
      website: education_info,
      instagram: organic_notes,
      drop_day: new Date(backend_notes),
    }

    const { error } = await updateItem(
      'clients',
      mediaBuyerUpdates,
      client.client_id,
    )

    alert(
      error
        ? 'Error submitting onboarding information.'
        : 'Successfully updated client.',
    )

    // Reset the form
    // setNotes('')
    // setDrive('')
    // setWebsite('')
    // setInstagram('daily')
    // setDropDay('12:00')
    // setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-zinc-800 bg-night-dusk px-1.5 py-0.5 text-neutral-400 transition-colors hover:border-zinc-700"
      >
        Update Notes
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">
              Edit Client - Media Buyer
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-sm font-medium">
                    Education Info
                  </label>
                  <textarea
                    value={education_info}
                    onChange={(e) => setEducationInfo(e.target.value)}
                    rows={3}
                    placeholder="Write education info here"
                    className="w-full rounded border border-neutral-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Organic Notes
                  </label>

                  <textarea
                    value={organic_notes}
                    onChange={(e) => setOrganicNotes(e.target.value)}
                    rows={3}
                    placeholder="Write organic notes here"
                    className="w-full rounded border border-neutral-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-sm font-medium">
                    Media Buyer Notes
                  </label>
                  <textarea
                    value={mb_notes}
                    onChange={(e) => setMBNotes(e.target.value)}
                    rows={3}
                    placeholder="Write media buyer notes here"
                    className="w-full rounded border border-neutral-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Backend Notes
                  </label>

                  <textarea
                    value={backend_notes}
                    onChange={(e) => setBackendNotes(e.target.value)}
                    rows={3}
                    placeholder="Write backend notes here"
                    className="w-full rounded border border-neutral-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-black px-4 py-2 text-white shadow-sm"
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
    </>
  )
}
