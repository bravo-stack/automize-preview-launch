'use client'

import { updateItem } from '@/lib/actions/db'
import { useMemo, useState } from 'react'

interface InputField {
  name: string
  label: string
  type: 'text' | 'textbox'
  placeholder?: string
  required?: boolean
}

interface AddButtonProps {
  id: string | number
  inputs: InputField[]
  data: any
}

export default function UpdateItem({ id, inputs, data = {} }: AddButtonProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({
    ...data,
    servers: Array.isArray(data?.servers) ? data.servers : [],
  })

  const [serverIdInput, setServerIdInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const serverIds: string[] = useMemo(
    () => (Array.isArray(formData.servers) ? formData.servers : []),
    [formData.servers],
  )

  const isValidSnowflake = (v: string) => /^\d{5,20}$/.test(v.trim())
  const setServerIds = (next: string[]) =>
    setFormData((p) => ({ ...p, servers: next }))

  const addServerIds = (raw: string) => {
    setError(null)
    const parts = raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length === 0) return
    const invalid = parts.filter((p) => !isValidSnowflake(p))
    if (invalid.length)
      setError(
        `Invalid ID${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}`,
      )
    const valid = parts.filter(isValidSnowflake)
    if (valid.length === 0) return
    setServerIds(Array.from(new Set([...serverIds, ...valid])))
  }

  const removeId = (id: string) =>
    setServerIds(serverIds.filter((x) => x !== id))
  const clearAll = () => setServerIds([])

  const handleChange = (name: string, value: any) =>
    setFormData((prev) => ({ ...prev, [name]: value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await updateItem('pod', formData, id)
      setOpen(false)
      alert(res ? 'Successfully updated item.' : 'Error updating item.')
    } catch {
      alert('Error updating item.')
    }
  }

  const renderInput = (field: InputField) => {
    if (field.type === 'text') {
      return (
        <div key={field.name} className="space-y-1">
          <label className="block text-sm font-medium">{field.label}</label>
          <input
            type="text"
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full rounded-lg border border-black/25 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>
      )
    }
    if (field.type === 'textbox') {
      return (
        <div key={field.name} className="space-y-1">
          <label className="block text-sm font-medium">{field.label}</label>
          <textarea
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full rounded-lg border border-black/25 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>
      )
    }
    return null
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-300 hover:text-neutral-500"
      >
        Update
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 text-black shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Update Item</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md border border-black/20 bg-white px-2 py-1 text-sm hover:bg-black/5"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                {inputs.map((f) => renderInput(f))}
              </div>

              <div className="rounded-xl border border-black/15 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold">Server IDs</label>
                  <span className="text-xs text-neutral-500">
                    {serverIds.length} selected
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    placeholder="(comma/space separated is legible)"
                    value={serverIdInput}
                    onChange={(e) => setServerIdInput(e.target.value)}
                    className="w-full rounded-lg border border-black/25 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!serverIdInput.trim()) return
                      addServerIds(serverIdInput)
                      setServerIdInput('')
                    }}
                    className="rounded-lg border border-black/25 bg-white px-3 py-2 text-sm hover:bg-black/5"
                  >
                    Add
                  </button>
                </div>

                {error && (
                  <div className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                {serverIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {serverIds.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-2 rounded-full border border-black/20 bg-white px-3 py-1 text-xs"
                      >
                        {id}
                        <button
                          type="button"
                          onClick={() => removeId(id)}
                          aria-label={`Remove ${id}`}
                          className="rounded-full border border-black/20 bg-white px-2 py-0.5 hover:bg-black/5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-neutral-700 underline-offset-2 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-black/25 bg-white px-4 py-2 shadow-sm hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black px-4 py-2 text-white shadow-sm hover:opacity-90"
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
