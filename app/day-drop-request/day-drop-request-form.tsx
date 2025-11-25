'use client'

import { useState } from 'react'

export default function DayDropRequestForm() {
  const [formData, setFormData] = useState({
    brandName: '',
    discordUsername: '',
    dropName: '',
    collectionName: '',
    dropDate: '',
    timezoneAndTime: '',
    offers: '',
    linkToProducts: '',
    smsRequired: '',
    smsImages: '',
    smsStyle: '',
    smsPersonalisation: '',
    siteLocked: '',
    additionalNotes: '',
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<boolean | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    const requiredFields = [
      'brandName',
      'discordUsername',
      'dropName',
      'collectionName',
      'dropDate',
      'timezoneAndTime',
      'offers',
      'linkToProducts',
      'smsRequired',
    ]
    const missing = requiredFields.filter((field) => !formData[field])

    if (missing.length > 0) {
      setMissingFields(missing)
      setShowPopup(true)
      return
    }

    setLoading(true)

    try {
      // TODO: Implement form submission logic
      // const response = await fetch('/api/day-drop-request', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess(true)
    } catch (error) {
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (success === true) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded bg-white px-2.5 py-5 text-center md:p-10">
        <h1 className="text-4xl font-bold text-green-600">Thank You!</h1>
        <p className="mt-4 text-pretty text-center text-neutral-600 md:text-lg">
          Your drop day request has been received. Our team will prepare
          everything for your launch. We&apos;ll be in touch soon!
        </p>
      </div>
    )
  }

  if (success === false) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded bg-white px-2.5 py-5 text-center md:p-10">
        <h1 className="text-4xl font-bold text-neutral-900">Sorry!</h1>
        <p className="mt-4 text-pretty text-center text-neutral-600 md:text-lg">
          There was an issue with the form submission. Please contact our team
          and we&apos;ll have it sorted for you.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-4xl divide-y divide-neutral-300 rounded bg-neutral-100 text-neutral-900 shadow-md shadow-neutral-300/50"
    >
      {/* Header */}
      <div className="px-3.5 py-7 md:p-10">
        <h1 className="text-2xl font-semibold md:text-4xl">DROP DAY REQUEST</h1>
        <p className="mt-2 font-medium text-neutral-600">
          Use this form to request your brand&apos;s next drop day setup. Please
          submit at least 3 days before launch.
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-7 px-3.5 py-7 md:p-10">
        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Brand Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="brandName"
            value={formData.brandName}
            onChange={handleChange}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLE: Urban Threads"
          />
          <p className="mt-1.5 text-xs text-neutral-500 md:text-sm">
            As stated on your Discord Channel
          </p>
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Discord Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="discordUsername"
            value={formData.discordUsername}
            onChange={handleChange}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLE: rayindarkk"
          />
          <p className="mt-1.5 text-xs text-neutral-500 md:text-sm">
            As stated in your Discord channel
          </p>
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Drop Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="dropName"
            value={formData.dropName}
            onChange={handleChange}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder='EXAMPLE: "Genesis"'
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Collection Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="collectionName"
            value={formData.collectionName}
            onChange={handleChange}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder='EXAMPLE: "Volume II: Clean Slate"'
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Drop Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="dropDate"
            value={formData.dropDate}
            onChange={handleChange}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
          />
          <p className="mt-1.5 text-xs text-neutral-500 md:text-sm">
            EXAMPLE: 20 December 2025
          </p>
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Time Zone and Time <span className="text-red-500">*</span>
          </label>
          <textarea
            name="timezoneAndTime"
            value={formData.timezoneAndTime}
            onChange={handleChange}
            required
            rows={3}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLE: Time zone: EST&#10;Time: 1 PM"
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Offers <span className="text-red-500">*</span>
          </label>
          <textarea
            name="offers"
            value={formData.offers}
            onChange={handleChange}
            required
            rows={4}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLE: Offer: 25% off sitewide for 48 hours. We also plan to include a mystery item for orders over $100."
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Link to Products <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            name="linkToProducts"
            value={formData.linkToProducts}
            onChange={handleChange}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLE: https://examplesite.com/collections/winter-heat"
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            SMS Required? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="smsRequired"
                value="Yes"
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-base">Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="smsRequired"
                value="No"
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-base">No</span>
            </label>
          </div>
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            SMS Images - Please Link Drive
          </label>
          <textarea
            name="smsImages"
            value={formData.smsImages}
            onChange={handleChange}
            rows={3}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLE: Include main product image and lifestyle banner which can be found in this drive: https://drive.EXAMPLE.com/drive/folders/18syI4YA9IY3QJbnwUa6HznrxZ"
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Style of SMS You Want to Run
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="smsStyle"
                value="Serious, less salesy"
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-base">Serious, less salesy</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="smsStyle"
                value="More salesy"
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-base">More salesy</span>
            </label>
          </div>
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            SMS Unique Personalisation
          </label>
          <textarea
            name="smsPersonalisation"
            value={formData.smsPersonalisation}
            onChange={handleChange}
            rows={4}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="What this means: What exactly do you want to say in the SMS to fit your brand aesthetic. EXAMPLE: Keep it hype but authentic - 'Your wait is over. New drop live now 🔥'"
          />
          <p className="mt-1.5 text-xs text-neutral-500 md:text-sm">
            What exactly do you want to say in the SMS to fit your brand
            aesthetic
          </p>
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Does Site Need to Be Locked?
          </label>
          <textarea
            name="siteLocked"
            value={formData.siteLocked}
            onChange={handleChange}
            rows={3}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="If so - include date, time and time zone. EXAMPLE: 19th of November at 5 PM EST"
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Additional Notes
          </label>
          <textarea
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleChange}
            rows={5}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLE: Focus on promoting the new cargo shorts and oversized tees. Keep SMS tone high-energy but minimal emojis. Sync SMS and ads for 7 PM GMT. Use black-and-orange branding for visuals."
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="px-3.5 py-7 md:p-10">
        <button
          type="submit"
          className={`ml-auto block rounded-md bg-blue-600 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700 ${loading ? 'px-7' : 'px-10'}`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              Submitting
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-spin"
                fill="white"
              >
                <path
                  d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
                  opacity=".25"
                />
                <path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z" />
              </svg>
            </div>
          ) : (
            'Submit'
          )}
        </button>
      </div>

      {/* Missing Fields Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900">Missing Fields</h2>
            <p className="mt-4 text-sm text-gray-600">
              Please fill out the following required fields:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
              {missingFields.map((field) => {
                const fieldLabels: Record<string, string> = {
                  brandName: 'Brand Name',
                  discordUsername: 'Discord Username',
                  dropName: 'Drop Name',
                  collectionName: 'Collection Name',
                  dropDate: 'Drop Date',
                  timezoneAndTime: 'Time Zone and Time',
                  offers: 'Offers',
                  linkToProducts: 'Link to Products',
                  smsRequired: 'SMS Required?',
                }
                return <li key={field}>{fieldLabels[field] || field}</li>
              })}
            </ul>
            <button
              onClick={() => setShowPopup(false)}
              className="mt-6 rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
