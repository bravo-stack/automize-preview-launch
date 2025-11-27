import { createClient } from '@/lib/db/server'
import img from '@/public/ixm.jpeg'
import Image from 'next/image'
import WebsiteRevampForm from './website-revamp-form'

export const metadata = {
  title: 'InsightX Media - Website Revamp Request',
  description:
    'Submit your website revamp requests to our team for professional updates and improvements.',
}

export default async function WebsiteRevampPage({ searchParams }) {
  const { clientId } = searchParams
  const db = createClient()

  let clientData: { id: number; brand: string; email: string } | null = null
  if (clientId) {
    const { data } = await db
      .from('clients')
      .select('id, brand, email')
      .eq('id', clientId)
      .single()
    clientData = data
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 px-2 py-20 md:p-20">
      <Image
        src={img}
        alt="InsightX Media logo"
        className="mx-auto mb-2.5 w-48 rounded-md md:w-64"
      />

      <WebsiteRevampForm clientId={clientId} clientData={clientData} />
    </main>
  )
}
