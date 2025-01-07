'use client'

import { updateItem, upsertItem } from '@/lib/actions/db'
import { useState } from 'react'

export default function EditBackendButton({ client, client_id }) {
  const [priority, setPriority] = useState(client.priority ?? '')
  const [drop_day, setDropDay] = useState(client.drop_day ?? '')
  const [cvr, setCVR] = useState(client.cvr ?? '')
  const [increase_cvr, setIncreaseCVR] = useState(client.increase_cvr ?? '')
  const [sms_date, setSMSDate] = useState(client.sms_date ?? '')
  const [email_auto, setEmailAuto] = useState(client.email_auto ?? null)
  const [sms_auto, setSMSAuto] = useState(client.sms_auto ?? null)
  const [isOpen, setOpen] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()

    const backendData = {
      client_id,
      priority,
      cvr,
      increase_cvr,
      sms_date: sms_date === '' ? null : new Date(sms_date),
      email_auto,
      sms_auto,
    }

    const { error } = await upsertItem('backend', backendData)

    if (client.drop_day !== drop_day) {
      await updateItem('clients', { drop_day: new Date(drop_day) }, client_id)
    }

    alert(
      error
        ? 'Error submitting information. Please ensure all fields are filled out correctly.'
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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Edit Client - Backend</h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium">CVR</label>
                  <input
                    type="text"
                    value={cvr}
                    onChange={(e) => setCVR(e.target.value)}
                    placeholder=""
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Priority</label>
                  <input
                    type="text"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium">
                    Upcoming Drop Date
                  </label>
                  <input
                    type="date"
                    value={drop_day}
                    onChange={(e) => setDropDay(e.target.value)}
                    placeholder="E.g. https://www.instagram.com/grailsnextdoor/?hl=en"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Upcoming SMS Date
                  </label>
                  <input
                    type="date"
                    value={sms_date}
                    onChange={(e) => setSMSDate(e.target.value)}
                    placeholder="E.g. https://www.instagram.com/grailsnextdoor/?hl=en"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium">
                    Email Automation
                  </label>
                  <input
                    type="text"
                    value={email_auto}
                    onChange={(e) => setEmailAuto(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    SMS Automation
                  </label>
                  <input
                    type="text"
                    value={sms_auto}
                    onChange={(e) => setSMSAuto(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  What to do to increase CVR
                </label>
                <textarea
                  value={increase_cvr}
                  onChange={(e) => setIncreaseCVR(e.target.value)}
                  rows={4}
                  placeholder=""
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
