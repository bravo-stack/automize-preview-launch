'use client'

import { createItem } from '@/lib/actions/db'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ClosingForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    brand: '',
    closed_by: '',
    close_amt: undefined,
    team: '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      Object.values(formData).some(
        (value) => value === '' || value === null || value === undefined,
      )
    ) {
      alert('Please fill out all fields before submitting.')
      return
    }
    
    const closedClient = {
      brand: formData.brand,
      closed_by: formData.closedBy,
	rebill_amt: formData.close_amt,
      team: formData.team.toUpperCase(),
      rebill_date: (() => {
        const today = new Date()
        const thirtyDaysAhead = new Date(today)
        thirtyDaysAhead.setDate(today.getDate() + 30)
        return thirtyDaysAhead
      })(),
    }
    
    const { data, error } = await createItem('clients', closedClient)

    if (error) {
      alert(
        'Error adding client. Please try again and ensure correct information.',
      )
    } else {
      setLink(`https://automize.vercel.app/onboarding-form/${data.id}`)
    }

    // alert('Successfully added client.')
    router.refresh()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-white px-3 py-1.5 font-medium text-black"
      >
        Add&nbsp;Client&nbsp;+
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Add New Client</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {!link && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      required
                      placeholder="E.g. InsightX Media"
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Who Closed Them?
                    </label>
                    <input
                      type="text"
                      name="closed_by"
                      value={formData.closed_by}
                      onChange={handleChange}
                      required
                      placeholder="E.g. Samir"
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Retainer Amount
                    </label>
                    <input
                      type="number"
                      name="close_amt"
                      value={formData.close_amt}
                      onChange={handleChange}
                      required
                      placeholder="Please enter a numeric value"
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Team A or B?
                    </label>
                    <input
                      type="text"
                      name="team"
                      required
                      value={formData.team}
                      onChange={handleChange}
                      placeholder="Please enter either 'A' or 'B'"
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                </>
              )}

              {link && (
                <div className="space-y-1.5">
                  <p className="text-neutral-600">
                    Client successfully added to database! Please send the
                    following link for the client to fill out the onboarding
                    form:
                  </p>
                  <p
                    className="cursor-pointer"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(
                          `Onboarding link for ${formData.brand}: ${link}`,
                        )
                        .then(() => {
                          alert('Text copied to clipboard!')
                        })
                        .catch((err) => {
                          alert(
                            'Error copying text. Please try again or copy manually.',
                          )
                        })
                    }}
                  >
                    <strong>Click to copy: </strong>
                    {link}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setLink(null)
                    setFormData({
                      brand: '',
                      closed_by: '',
                      close_amt: undefined,
                      team: '',
                    })
                  }}
                  className="rounded-md bg-black px-4 py-2 text-white shadow-sm transition-colors"
                >
                  {link === null ? 'Cancel' : 'Close'}
                </button>

                {!link && (
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-800 px-4 py-2 shadow-sm transition-colors hover:bg-zinc-800/10"
                  >
                    Save
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
