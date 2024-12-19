'use client'

import { updateItem } from '@/lib/actions/db'
import { useState } from 'react'

export default function OnboardingForm({}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    discordUsername: '',
    phoneNumber: '',
    monthlyRevenue: '',
    streetAddress: '',
    streetAddress2: '',
    city: '',
    state: '',
    postalCode: '',
    introduction: '',
    brandName: '',
    websiteURL: '',
    instagramLink: '',
    allTimeRevenue: '',
    yearsInBusiness: '',
    productDescription: '',
    customerAcquisition: '',
  })

  const [step, setStep] = useState(1)
  const [success, setSuccess] = useState<boolean | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const clientData = {
      brand: formData.brandName,
      client_name: `${formData.firstName} ${formData.lastName}`,
      phone_number: formData.phoneNumber,
      address: `${formData.streetAddress}${formData.streetAddress2 ? `, ${formData.streetAddress2}` : ''}, ${formData.city}, ${formData.state} ${formData.postalCode}`,
      discord_id: formData.discordUsername,
      starting_mrr: formData.monthlyRevenue,
      website: formData.websiteURL,
      instagram: formData.instagramLink,
    }

    const { error: status } = await updateItem(
      'clients',
      clientData,
      formData.email,
      'email',
    )

    setSuccess(status)

    console.log('Form Submitted:', formData)
  }

  if (success === true) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded bg-white px-2.5 py-5 text-center md:p-10">
        <h1 className="text-4xl font-bold text-green-600">Thank You!</h1>
        <p className="mt-4 text-pretty text-center text-neutral-600 md:text-lg">
          Your onboarding form has been received and is currently being
          processed into our system. Please standby for further instructions
          through our slack channels.
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
      className="mx-auto max-w-3xl divide-y divide-neutral-300 rounded bg-neutral-100 text-neutral-900 shadow-md shadow-neutral-300/50"
    >
      {step === 1 && (
        <div className="px-3.5 py-7 md:p-10">
          <h1 className="text-2xl font-semibold md:text-4xl">
            ONBOARDING FORM
          </h1>
          <p className="font-medium text-neutral-600">
            Welcome to InsightX Media. Please fill this form to the best of your
            ability so our team can get a better understanding of your business.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="px-3.5 py-7 md:p-10">
          <h1 className="text-2xl font-semibold">
            Let&apos;s get to know your business better!
          </h1>
          <p className="font-medium text-neutral-600">
            Please answer each question to the best of your ability.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-2 px-3.5 py-7 md:p-10">
          <p className="col-span-full mb-2.5 text-lg font-medium">
            Full Legal Name
          </p>
          <div className="mr-2 md:mr-7">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              First Name
            </label>
          </div>
          <div className="">
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              Last Name
            </label>
          </div>

          <p className="col-span-full mb-2.5 mt-7 text-lg font-medium">Email</p>
          <div className="col-start-1">
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              example@example.com
            </label>
          </div>

          <p className="col-span-full mb-2.5 mt-7 text-lg font-medium">
            Discord Username
          </p>
          <div className="col-start-1">
            <input
              type="text"
              name="discordUsername"
              value={formData.discordUsername}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              Jax2000
            </label>
          </div>

          <p className="col-span-full mb-2.5 mt-7 text-lg font-medium">
            Phone Number
          </p>
          <div className="col-start-1">
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              Please enter a valid phone number.
            </label>
          </div>

          <p className="col-span-full mb-2.5 mt-7 text-lg font-medium">
            Approximate Monthly Revenue
          </p>
          <div className="col-start-1">
            <input
              type="number"
              name="monthlyRevenue"
              value={formData.monthlyRevenue}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
          </div>

          <p className="col-span-full mb-2.5 mt-7 text-lg font-medium">
            Address
          </p>
          <div className="col-span-full mb-5">
            <input
              type="text"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              Street Address
            </label>
          </div>

          <div className="col-span-full mb-5">
            <input
              type="text"
              name="streetAddress2"
              value={formData.streetAddress2}
              onChange={handleChange}
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              Street Address Line 2
            </label>
          </div>
          <div className="col-start-1 mb-5 mr-2 md:mr-5">
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              City
            </label>
          </div>

          <div className="">
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              State / Province
            </label>
          </div>

          <div className="col-span-full">
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              Postal / Zip Code
            </label>
          </div>

          <p className="col-span-full mb-2.5 mt-7 text-lg font-medium">
            Give us a short introduction about yourself!
          </p>
          <div className="col-span-2 col-start-1">
            <textarea
              name="introduction"
              value={formData.introduction}
              onChange={handleChange}
              required
              rows={4}
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid px-3.5 py-7 md:grid-cols-2 md:p-10">
          <p className="col-span-full mb-2.5 text-lg font-medium">Brand Name</p>
          <div className="mb-7">
            <input
              type="text"
              name="brandName"
              value={formData.brandName}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
          </div>

          <p className="col-span-full mb-2.5 text-lg font-medium">
            Social Links
          </p>
          <div className="mb-7 mr-7">
            <input
              type="text"
              name="websiteURL"
              value={formData.websiteURL}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              Website URL (If none, please enter &quot;N/A&quot;)
            </label>
          </div>

          <div className="">
            <input
              type="text"
              name="instagramLink"
              value={formData.instagramLink}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
            <label className="mt-1.5 block text-xs text-neutral-500 md:text-sm">
              Instagram Link (If none, please enter &quot;N/A&quot;)
            </label>
          </div>

          <p className="col-span-full mb-2.5 mt-7 text-lg font-medium">
            Approximate All Time Revenue
          </p>
          <div className="">
            <input
              type="number"
              name="allTimeRevenue"
              value={formData.allTimeRevenue}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
          </div>
          <p className="col-span-full mb-2.5  mt-7 text-lg font-medium">
            Years in Business
          </p>
          <div className="mb-7">
            <input
              type="text"
              name="yearsInBusiness"
              value={formData.yearsInBusiness}
              onChange={handleChange}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
          </div>

          <p className="col-span-full mb-2.5 text-lg font-medium">
            Briefly Explain Your Product / Service
          </p>
          <div className="col-span-full mb-7">
            <textarea
              name="productDescription"
              value={formData.productDescription}
              onChange={handleChange}
              rows={4}
              required
              className="w-full rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
          </div>

          <p className="col-span-full mb-2.5 text-lg font-medium">
            How are you currently acquiring customers? Please list everything.
            (I.e. Organic Tiktok, Facebook ads etc.)
          </p>
          <div className="col-span-full">
            <textarea
              name="customerAcquisition"
              value={formData.customerAcquisition}
              onChange={handleChange}
              rows={4}
              required
              className="w-full  rounded border border-neutral-400 bg-neutral-100 px-3 py-2 hover:ring-2 hover:ring-blue-400 focus:ring-blue-600"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="px-3.5 py-7 md:p-10">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="ml-auto block rounded-md bg-blue-600 px-10 py-3 text-lg font-medium text-white"
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex justify-between px-3.5 py-7 md:p-10">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="block rounded-md bg-gray-300 px-10 py-3 text-lg font-medium text-neutral-900"
          >
            Back
          </button>

          <button
            onClick={handleSubmit}
            className="block rounded-md bg-green-600 px-10 py-3 text-lg font-medium text-white"
          >
            Submit
          </button>
        </div>
      )}
    </form>
  )
}
