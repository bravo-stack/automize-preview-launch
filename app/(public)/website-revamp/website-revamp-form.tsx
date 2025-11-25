'use client'

import { useState } from 'react'

export default function WebsiteRevampForm() {
  const [formData, setFormData] = useState({
    email: '',
    brandName: '',
    mediaBuyerName: '',
    homePage: '',
    collectionPage: '',
    productPages: '',
    sizeChart: '',
    bundles: '',
    description: '',
    reviews: '',
    policies: '',
    backend: '',
    trackOrder: '',
    aboutUs: '',
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
    const requiredFields = ['email', 'brandName', 'mediaBuyerName']
    const missing = requiredFields.filter((field) => !formData[field])

    if (missing.length > 0) {
      setMissingFields(missing)
      setShowPopup(true)
      return
    }

    setLoading(true)

    try {
      // TODO: Implement form submission logic
      // const response = await fetch('/api/website-revamp', {
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
          Your website revamp request has been received. Our team will review
          your changes and get started on the updates shortly.
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
        <h1 className="text-2xl font-semibold md:text-4xl">
          WEBSITE REVAMP REQUEST
        </h1>
        <p className="mt-2 font-medium text-neutral-600">
          Share the changes you want made to your website. Add details where
          needed so our team can update everything accurately.
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-7 px-3.5 py-7 md:p-10">
        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="your.email@example.com"
          />
        </div>

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
            placeholder="Please enter your brand name as stated in discord."
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Media Buyer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="mediaBuyerName"
            value={formData.mediaBuyerName}
            onChange={handleChange}
            required
            className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="Please enter your Media buyer's name as stated in discord."
          />
        </div>
      </div>

      {/* Changes Section */}
      <div className="space-y-7 px-3.5 py-7 md:p-10">
        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Changes Required - Home Page
          </label>
          <textarea
            name="homePage"
            value={formData.homePage}
            onChange={handleChange}
            rows={4}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLES: Update home page banners, adjust overall aesthetic direction, modify announcement bars, refine product highlights, etc."
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Changes Required - Collection Page
          </label>
          <textarea
            name="collectionPage"
            value={formData.collectionPage}
            onChange={handleChange}
            rows={4}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder='EXAMPLES: Update collection page banners, adjust pricing display format, improve Add to Cart button placement, add tags such as "Back in Stock" on restocked products.'
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Changes Required - Product Pages
          </label>
          <textarea
            name="productPages"
            value={formData.productPages}
            onChange={handleChange}
            rows={4}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLE: Include lifestyle photo gallery (models wearing full fits)."
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Changes Required - Size Chart
          </label>
          <textarea
            name="sizeChart"
            value={formData.sizeChart}
            onChange={handleChange}
            rows={4}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLE: Upload the new size chart in the drive, ensure it is at the end of product images but also a View Size Guide button as well"
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Changes Required - Bundles
          </label>
          <textarea
            name="bundles"
            value={formData.bundles}
            onChange={handleChange}
            rows={4}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder='EXAMPLE: 1. Implement "BOGO50" discount on all sets. 2. Use Bundlr to add bundle visuals showing complete outfit combinations and money saved'
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Changes Required - Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder='EXAMPLE: Rework copy tone to sound lifestyle-driven instead of technical.&#10;&#10;EXAMPLE rewrite:&#10;❌ "100% cotton, 280gsm fabric."&#10;✅ "Soft heavyweight cotton built to last - comfort that moves with you."'
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Changes Required - Reviews
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="reviews"
                value="Yes"
                checked={formData.reviews === 'Yes'}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-base">Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="reviews"
                value="No"
                checked={formData.reviews === 'No'}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-base">No</span>
            </label>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            Select if changes are needed for the reviews section
          </p>
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Changes Required - Policies
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="policies"
                value="Yes"
                checked={formData.policies === 'Yes'}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-base">Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="policies"
                value="No"
                checked={formData.policies === 'No'}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-base">No</span>
            </label>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            Select if changes are needed for policies
          </p>
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Changes Required - Backend (Product pricing, Apple pay, Free
            shipping etc.)
          </label>
          <textarea
            name="backend"
            value={formData.backend}
            onChange={handleChange}
            rows={4}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLE: 1. Add free shipping sitewide 2. Add Apple pay"
          />
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Changes Required - Track Your Order
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="trackOrder"
                value="Yes"
                checked={formData.trackOrder === 'Yes'}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-base">Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="trackOrder"
                value="No"
                checked={formData.trackOrder === 'No'}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-base">No</span>
            </label>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            Select if changes are needed for order tracking
          </p>
        </div>

        <div>
          <label className="mb-2.5 block text-lg font-medium">
            Changes Required - About Us
          </label>
          <textarea
            name="aboutUs"
            value={formData.aboutUs}
            onChange={handleChange}
            rows={4}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder='EXAMPLE: Rewrite story to be more brand-focused and emotional: "Born from the streets of London, we design everyday essentials that merge culture, comfort, and confidence. Each piece is made for those who move with purpose."'
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
            rows={4}
            className="w-full resize-none rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600"
            placeholder="EXAMPLE: Make sure to test the checkout process to ensure it works properly"
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
                  email: 'Email',
                  brandName: 'Brand Name',
                  mediaBuyerName: 'Media Buyer Name',
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
