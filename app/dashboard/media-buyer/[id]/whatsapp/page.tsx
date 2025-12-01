import Section from '@/components/common/section'
import { createAdminClient } from '@/lib/db/admin'
import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import WhatsAppSettingsClient from './whatsapp-settings-client'

// ============================================================================
// WhatsApp Settings Page
// ============================================================================
// Allows media buyers to:
// 1. Set their WhatsApp number for notifications
// 2. Configure scheduled summary messages
// 3. Customize message content and timing
// ============================================================================

interface WhatsAppSettingsPageProps {
  params: { id: string }
}

export default async function WhatsAppSettingsPage({
  params,
}: WhatsAppSettingsPageProps) {
  const { id } = params
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
    .select('id, name, whatsapp_number')
    .eq('user_id', id)
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

  // Get existing schedules for this pod
  const { data: schedules } = await db
    .from('whatsapp_schedules')
    .select('*')
    .eq('pod_name', pod.name)
    .order('created_at', { ascending: false })

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
        initialWhatsAppNumber={pod.whatsapp_number}
        initialSchedules={schedules || []}
      />
    </main>
  )
}
