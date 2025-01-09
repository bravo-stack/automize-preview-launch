'use client'

import Section from '@/components/common/section'
import { updateItem } from '@/lib/actions/db'
import { textFromSQL } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'

export default function EditClientPortfolio({ role, client }) {
  let details, access, links, rebill, metrics, other

  if (role === 'exec') {
    details = [
      'full_name',
      'email',
      'phone_number',
      'address',
      'discord_id',
      'starting_mrr',
    ]
    access = ['fb_key', 'store_id']
    links = ['website', 'instagram', 'whimsicals', 'drive']
    rebill = ['rebill_amt', 'rebill_date']
    metrics = ['margins', 'cogs', 'break_even_roas', 'bc_review']
    other = [
      'drop_day',
      'client_reports',
      'closed_by',
      'closed_at',
      'outside_issues',
      'team',
    ]
  } else {
    access = ['store_id']
    links = ['website', 'instagram', 'whimsicals', 'drive']
    metrics = [
      'margins',
      'cogs',
      'break_even_roas',
      'bc_review',
      'passed_bcr',
      'starting_mrr',
    ]
    other = [
      'drop_day',
      'client_reports',
      'closed_by',
      'closed_at',
      'outside_issues',
      'team',
    ]
  }

  const allProperties = { details, access, links, rebill, metrics, other }
  const [formData, setFormData] = useState({ ...client })

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    const { error } = await updateItem('clients', formData, client.id)

    if (error) {
      alert('Error updating client')
    } else {
      alert('Client updated successfully!')
    }
  }

  const getInputType = (key) => {
    if (key === 'drop_day' || key === 'rebill_date' || key === 'closed_at')
      return 'date'
    if (
      key === 'cogs' ||
      key === 'break_even_roas' ||
      key === 'starting_mrr' ||
      key === 'rebill_amt'
    )
      return 'number'
    if (key.toLowerCase().includes('email')) return 'email'
    if (key.toLowerCase().includes('phone')) return 'tel'
    // if (typeof formData[key] === 'boolean') return 'checkbox' TODO
    return 'text'
  }

  const renderInputs = (properties) =>
    properties.map((key) => (
      <div key={key} className="flex flex-col space-y-1">
        <label className="font-medium">{textFromSQL(key)}</label>
        <input
          type={getInputType(key)}
          value={formData[key] || ''}
          onChange={(e) => handleInputChange(key, e.target.value)}
          className="rounded border border-zinc-800 bg-night-starlit px-2 py-0.5"
        />
        {/* {
        TODO: CHECKBOX FOR ACCESS/BOOLEAN FIELDS
        getInputType(key) === 'checkbox' ? (
          <input
            type="checkbox"
            checked={!!formData[key]}
            onChange={(e) => handleInputChange(key, e.target.checked)}
            className="rounded border border-zinc-800 bg-night-starlit px-2 py-0.5"
          />
        ) : (
          <input
            type={getInputType(key)}
            value={formData[key] || ''}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="rounded border border-zinc-800 bg-night-starlit px-2 py-0.5"
          />
        )} */}
      </div>
    ))

  return (
    <Section
      title="Edit Client Portfolio"
      actions={
        <div className="flex gap-3">
          <Link
            href={`/dashboard/notes/${client.id}`}
            className="rounded-md border border-white px-3 py-1.5 font-medium"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            className="rounded-md border border-white bg-white px-3 py-1.5 font-medium text-black"
          >
            Save Changes
          </button>
        </div>
      }
    >
      <form className="grid grid-cols-2 gap-5 p-5">
        {Object.entries(allProperties).map(([section, properties]) => (
          <div
            key={section}
            className="space-y-3 rounded-md border border-zinc-900 bg-night-starlit p-5"
          >
            <h3 className="font-bold">{textFromSQL(section)}</h3>
            {renderInputs(properties)}
          </div>
        ))}
      </form>
    </Section>
  )
}
