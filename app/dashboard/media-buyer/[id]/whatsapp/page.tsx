import Section from '@/components/common/section'
import { getAllGlobalConfigs } from '@/lib/actions/global-whatsapp-configs'
import { createAdminClient } from '@/lib/db/admin'
import { createClient } from '@/lib/db/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import WhatsAppSettingsClient from './whatsapp-settings-client'

export default async function WhatsAppSettingsPage({ params }) {
  const { id } = await params
  const authDb = createClient()
  const db = createAdminClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await authDb.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get pod info for this user
  const { data: pod } = await db
    .from('pod')
    .select('id, name, servers, whatsapp_number')
    .eq('id', id)
    .single()

  if (!pod) {
    return (
      <main className="p-7">
        <Section title="WhatsApp Settings">
          <div className="p-4 text-center font-medium text-zinc-400">
            No pod found for this user. Please contact an administrator.
          </div>
        </Section>
      </main>
    )
  }

  // Get existing configs for this pod
  const { data: configs } = await db
    .from('pod_whatsapp_configs')
    .select('*')
    .eq('pod_name', pod.name)
    .order('feature_type', { ascending: true })

  // Get global configs for fallback display
  const globalConfigs = await getAllGlobalConfigs()

  return (
    <main className="p-7">
      <header className="mb-6">
        <div className="mb-2">
          <Link
            href="/dashboard/media-buyer"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Back to WhatsApp Hub
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp Settings</h1>
        <p className="text-zinc-400">
          Configure WhatsApp notifications for {pod.name}
        </p>
      </header>

      <WhatsAppSettingsClient
        podName={pod.name}
        initialWhatsAppNumber={pod.whatsapp_number}
        initialConfigs={configs || []}
        globalConfigs={globalConfigs}
      />
    </main>
  )
}
