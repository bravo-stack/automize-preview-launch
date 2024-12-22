'use client'

import { updateItem } from '@/lib/actions/db'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function OnboarderForm({ client, email }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    shopify_access: 'No',
    fb_access: 'No',
    discord_id: '',
    education_info: '',
    organic_notes: '',
    // special_request: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const onboardedData = {
      ...formData,
      shopify_access: formData.shopify_access === 'Yes',
      fb_access: formData.fb_access === 'Yes',
      onboarded: true,
    }

    const { error } = await updateItem('clients', onboardedData, email, 'email')

    alert(
      error
        ? 'Error submitting onboarding information.'
        : 'Successfully updated client.',
    )

    router.push('/dashboard/onboarding')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl divide-y divide-neutral-300 rounded-md bg-neutral-100 text-night-twilight"
    >
      <div className="p-5">
        <h1 className="text-2xl font-semibold">ONBOARDER FORM</h1>
        <p className="font-medium text-neutral-600">
          Currently onboarding {client}, {email}
        </p>
      </div>

      <div className="space-y-3.5 p-5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1.5 block text-neutral-500">
              Shopify Access?
            </label>
            <select
              name="shopify_access"
              value={formData.shopify_access}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-neutral-500">
              Facebook Access?
            </label>
            <select
              name="fb_access"
              value={formData.fb_access}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-neutral-500">
            If Discord access, enter Discord ID
          </label>
          <input
            type="text"
            name="discord_id"
            placeholder="E.g. 10204210123104"
            value={formData.discord_id}
            onChange={handleChange}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-neutral-500">
            Small Education Info
          </label>
          <textarea
            name="education_info"
            value={formData.education_info}
            onChange={handleChange}
            rows={2}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-neutral-500">
            Onboarded Organic Consultation
          </label>
          <textarea
            name="organic_notes"
            value={formData.organic_notes}
            onChange={handleChange}
            rows={2}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
          />
        </div>

        {/* <div>
          <label className="mb-1.5 block text-neutral-500">
            Any special requests? If none, leave blank
          </label>
          <textarea
            name="special_request"
            value={formData.special_request}
            onChange={handleChange}
            rows={2}
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
          />
        </div> */}
      </div>

      <div className="flex justify-between p-5">
        <Link
          href={'/dashboard/onboarding'}
          className="block rounded-md  bg-neutral-300 px-3 py-1.5 font-medium text-neutral-600"
        >
          Cancel Onboarding
        </Link>

        <button
          type="submit"
          className="block rounded-md bg-green-700 px-3 py-1.5 font-medium text-white"
        >
          Submit
        </button>
      </div>
    </form>
  )
}
