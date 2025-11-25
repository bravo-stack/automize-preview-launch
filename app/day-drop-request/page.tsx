import img from '@/public/ixm.jpeg'
import Image from 'next/image'
import DayDropRequestForm from './day-drop-request-form'

export const metadata = {
  title: 'InsightX Media - Drop Day Request',
  description:
    "Request your brand's next drop day setup with our professional team.",
}

export default function DayDropRequestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 px-2 py-20 md:p-20">
      {/* IXM Logo */}
      <Image
        src={img}
        alt="InsightX Media logo"
        className="mx-auto mb-2.5 w-48 rounded-md md:w-64"
      />

      <DayDropRequestForm />
    </main>
  )
}
