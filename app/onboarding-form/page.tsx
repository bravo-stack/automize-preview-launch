import Image from 'next/image'
import OnboardingForm from './onboarding-form'
import img from '@/public/ixm.jpeg'

export const metadata = {
  title: 'InsightX Media - Onboarding Form',
}

export default function OnboardingFormPage({}) {
  return (
    <main className="min-h-screen bg-neutral-900 px-2 py-20 md:p-20">
      {/* IXM Logo */}
      <Image
        src={img}
        alt="InsightX Media logo"
        className="mx-auto mb-2.5 w-48 rounded-md md:w-64"
      />

      <OnboardingForm />
    </main>
  )
}
