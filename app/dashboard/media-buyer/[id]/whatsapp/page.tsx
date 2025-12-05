import Section from '@/components/common/section'
import { createAdminClient } from '@/lib/db/admin'
import { createClient } from '@/lib/db/server'
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

  return (
    <main className="p-7">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp Settings</h1>
        <p className="text-zinc-400">
          Configure WhatsApp notifications for {pod.name}
        </p>
      </header>

      <WhatsAppSettingsClient
        podName={pod.name}
        podServers={pod?.servers ?? []}
        podWhatsappNumber={pod?.whatsapp_number ?? null}
        initialWhatsAppNumber={pod.whatsapp_number}
        initialConfigs={configs || []}
      />
    </main>
  )
}
