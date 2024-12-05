'use client'

import { createItem } from '@/lib/actions/db'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface InputField {
  name: string
  label: string
  type: 'text' | 'textbox' | 'select' | 'date' | 'number' | 'time'
  options?: string[]
  placeholder?: string
  required?: boolean
}

interface AddButtonProps {
  buttonText: string
  styles?: { button: string }
  inputs: InputField[]
  //   onSubmit: Function
}

export default function AddButton({
  buttonText,
  styles,
  inputs,
  //   onSubmit,
}: AddButtonProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log(formData)
    const { error } = await createItem('pod', formData)
    setOpen(false)
    alert(error ? 'Error adding item.' : 'Successfully added item.')
  }

  const renderInput = (field: InputField) => {
    switch (field.type) {
      case 'text':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium">{field.label}</label>
            <input
              type="text"
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        )
      case 'textbox':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium">{field.label}</label>
            <textarea
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        )
      case 'select':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium">{field.label}</label>
            <select
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full rounded border px-3 py-2"
            >
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )
      case 'date':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium">{field.label}</label>
            <input
              type="date"
              name={field.name}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        )
      case 'number':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium">{field.label}</label>
            <input
              type="number"
              name={field.name}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        )
      case 'time':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium">{field.label}</label>
            <input
              type="time"
              name={field.name}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'rounded-md bg-white px-3 py-1.5 font-medium text-black',
          styles && styles.button,
        )}
      >
        {buttonText}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Form</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {inputs.map((field) => renderInput(field))}

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
