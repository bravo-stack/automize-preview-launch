'use client'

import { createItem, updateItem } from '@/lib/actions/db'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { sendDiscordMessage } from '@/lib/actions/discord'

export default function OnboarderForm({ client, id }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    shopify_access: 'No',
    fb_access: 'No',
    discord_id: '',
    education_info: '',
    organic_notes: '',
  })

  const [isSR, setSR] = useState(false)
  const [specialReq, setSpecialReq] = useState({
    package_type: '',
    closed_by: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSRChange = (e) => {
    const { name, value } = e.target
    setSpecialReq((prevData) => ({
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

    const requestData = {
      client_id: id,
      ...specialReq,
    }

    if (isSR) {
      const { error: statusOB } = await updateItem('clients', onboardedData, id)
      const { error: statusSR } = await createItem(
        'special_requests',
        requestData,
      )

      if (!statusSR) {
        const message =
          `**SPECIAL REQUEST FROM ${client || 'Unknown Client'}**\n\n` +
          `Client: ${client || 'N/A'}\n` +
          `Package type: ${specialReq.package_type || 'N/A'}\n` +
          `Closed by: ${specialReq.closed_by || 'N/A'}\n\n` +
          `<@989529544702689303> <@1293941738666197064> <@1061841640379134012> <@1258500284095660059>`

        await sendDiscordMessage('sulaiman-test', message)
        alert(
          statusOB || statusSR
            ? 'Error submitting onboarding information.'
            : 'Successfully updated client.',
        )
      }
    }

    router.push('/dashboard/onboarding')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl divide-y divide-neutral-300 rounded-md bg-neutral-100 text-night-twilight"
    >
      <div className="p-5">
        <h1 className="text-2xl font-semibold">ONBOARDER FORM</h1>
        <p className="font-medium text-neutral-600">
          Currently onboarding {client}
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

        <div className="flex items-center gap-2">
          <label
            className="cursor-pointer text-neutral-500"
            htmlFor="special-requests"
          >
            Toggle if any special requests
          </label>
          <button
            id="special-requests"
            type="button"
            className={`relative h-7 w-12 cursor-pointer rounded-full border-none p-0 transition-colors duration-200 focus:outline-none
                 ${isSR ? 'bg-blue-500' : 'bg-gray-300'}`}
            onClick={() => setSR(!isSR)}
          >
            <div
              className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 transform rounded-full bg-white transition-all duration-200
                  ${isSR ? 'left-[1.35rem]' : 'left-[0.15rem]'}`}
            ></div>
          </button>
        </div>

        {isSR && (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1.5 block text-neutral-500">
                Package Type
              </label>
              <input
                type="text"
                name="package_type"
                value={specialReq.package_type}
                onChange={handleSRChange}
                className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-neutral-500">
                Who Closed the Deal
              </label>
              <input
                type="text"
                name="closed_by"
                value={specialReq.closed_by}
                onChange={handleSRChange}
                className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
              />
            </div>
          </div>
        )}
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

export function CopyOnboardingLink({ brand, id }) {
  return (
    <h3
      onClick={() => {
        navigator.clipboard
          .writeText(
            `Onboarding link for client ${brand}: https://automize.vercel.app/onboarding-form/${id}`,
          )
          .then(() => {
            alert('Text copied to clipboard!')
          })
          .catch((err) => {
            alert('Error copying text. Please try again or copy manually.')
          })
      }}
      className="group cursor-pointer rounded-full transition-all duration-500 hover:bg-neutral-700/50 hover:px-2"
    >
      <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500 group-hover:bg-pink-500" />
      <span className="group-hover:hidden">Incomplete Jotform</span>
      <span className={`hidden group-hover:inline-block`}>
        Copy jotform link
      </span>
    </h3>
  )
}
