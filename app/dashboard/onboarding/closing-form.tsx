'use client'

import { createItem } from '@/lib/actions/db'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ClosingForm() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    brand: '',
    // email: '',
    closed_by: '',
    rebill_date: '',
    // starting_mrr: '',
  })
  const [link, setLink] = useState<string | null>(null)

  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data, error } = await createItem('clients', {
      ...formData,
      rebill_date: formData.rebill_date ?? null,
    })

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

                  {/* <div className="grid grid-cols-2 gap-3"> 
               <div>
                  <label className="block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="E.g. example@domain.com"
                    className="w-full rounded border px-3 py-2"
                  />
                </div> 
              </div> */}

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

                  {/* <div>
                <label className="block text-sm font-medium">
                  How much $/m?
                </label>
                <input
                type="number"
                  name="starting_mrr"
                  value={formData.starting_mrr}
                  onChange={handleChange}
                  required
                  placeholder="E.g. 1000"
                  className="w-full rounded border px-3 py-2"
                  />
                  </div> */}

                  <div>
                    <label className="block text-sm font-medium">
                      Rebill Date
                    </label>
                    <input
                      type="date"
                      name="rebill_date"
                      value={formData.rebill_date}
                      onChange={handleChange}
                      required
                      placeholder="E.g. 2024-01-01"
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
                          `Onboarding link for client ${formData.brand}: ${link}`,
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
                  {/* <p className="text-xs text-neutral-500 2xl:text-sm">
                    Click link to copy
                  </p> */}
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
                      rebill_date: '',
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
