'use client'

import { createSheet } from '@/lib/actions'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CreateJobProps {
  user: User
}

export default function CreatePodSheet({ user }: CreateJobProps) {
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [pod, setPod] = useState('')
  const [frequency, setFrequency] = useState('none')
  const [templateId, setTemplateId] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const templates = [
    {
      id: 1,
      name: 'Insight Pro',
      description:
        'Insight Pro includes advanced analytics and detailed insights for your business.',
    },
    {
      id: 2,
      name: 'Essential',
      description:
        'Essential includes basic analytics and essential insights for your business.',
    },
  ]

  const handleTemplateSelect = (templateId: number) => {
    setTemplateId(templateId)
  }

  const handleSave = async () => {
    const status = await createSheet(
      title,
      email,
      {
        user_id: user.id,
        frequency,
        templateId,
      },
      pod,
    )

    if (!status) {
      console.error('Error creating sheet.')
    } else {
      router.refresh()
    }

    setShowModal(false)
    setTitle('')
    setTemplateId(1)
  }

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-md bg-white px-3 py-1.5 font-medium text-black"
      >
        New&nbsp;Sheet&nbsp;+
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Create New Sheet</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    Sheet Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="E.g. Maps Sheet"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Owner Email
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="E.g. email@yourdomain.com"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Pod</label>
                <input
                  type="text"
                  value={pod}
                  onChange={(e) => setPod(e.target.value.toLowerCase())}
                  required
                  placeholder="E.g. maps"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Refresh Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="none">None</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_3d">Last 3 Days</option>
                  <option value="last_7d">Last 7 Days</option>
                  <option value="last_14d">Last 14 Days</option>
                  <option value="last_30d">Last 30 Days</option>
                  <option value="this_month">This Month</option>
                  <option value="maximum">Maximum Duration</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Choose a template
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`cursor-pointer rounded border px-3 py-2 text-center ${
                        templateId === template.id
                          ? 'border-zinc-900/20 bg-zinc-800/10'
                          : ''
                      }`}
                    >
                      {template.name}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-gray-700">
                  {
                    templates.find((template) => template.id === templateId)
                      ?.description
                  }
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
