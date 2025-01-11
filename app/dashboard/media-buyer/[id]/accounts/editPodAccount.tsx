'use client'

import { updateItem } from '@/lib/actions/db'
import { useState } from 'react'

export default function EditPodAccountButton({ client }) {
  const [mb_notes, setNotes] = useState(client.notes ?? '')
  const [drive, setDrive] = useState(client.drive ?? '')
  const [website, setWebsite] = useState(client.website ?? '')
  const [instagram, setInstagram] = useState(client.insta ?? '')
  const [drop_day, setDropDay] = useState(client.drop_day ?? null)
  const [open, setOpen] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()

    const mediaBuyerUpdates = {
      mb_notes,
      drive,
      website,
      instagram,
      drop_day: drop_day ? new Date(drop_day) : null,
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

    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-zinc-800 bg-night-dusk px-1.5 py-0.5 text-neutral-400 transition-colors hover:border-zinc-700"
      >
        Update
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">
              Edit Client - Media Buyer
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Drive Link</label>
                <input
                  type="text"
                  value={drive}
                  onChange={(e) => setDrive(e.target.value)}
                  placeholder="E.g., https://drive.google.com/drive/..."
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium">
                    Website Link
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="E.g., https://arekos.com/"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Instagram Link
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="E.g. https://www.instagram.com/grailsnextdoor/?hl=en"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Drop Day</label>
                <input
                  type="date"
                  value={drop_day}
                  onChange={(e) => setDropDay(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Media Buyer Notes
                </label>
                <textarea
                  value={mb_notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Write notes about the client here"
                  className="w-full rounded border px-3 py-2"
                />
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
