import { getAllGlobalConfigs } from '@/lib/actions/global-whatsapp-configs'
import { createAdminClient } from '@/lib/db/admin'
import { createClient } from '@/lib/db/server'
import {
  AlertTriangle,
  ArrowLeft,
  MessageSquare,
  Phone,
  Settings,
  UserX,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import WhatsAppSettingsClient from './whatsapp-settings-client'

function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center p-7">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-zinc-800/50">
          <Icon className="size-8 text-zinc-500" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-white">{title}</h1>
        <p className="mb-6 text-sm leading-relaxed text-zinc-400">
          {description}
        </p>
        {children}
      </div>
    </main>
  )
}

function SetupRequiredBanner({
  podName,
  onSetupComplete,
}: {
  podName: string
  onSetupComplete?: () => void
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
      <div className="flex items-start gap-4 p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
          <Phone className="size-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-amber-200">
            WhatsApp Number Required
          </h3>
          <p className="text-sm text-amber-200/70">
            To receive notifications, you need to add a WhatsApp number for{' '}
            <span className="font-medium text-amber-200">{podName}</span>. Enter
            your number below including the country code (e.g., +1234567890).
          </p>
        </div>
      </div>
      <div className="border-t border-amber-500/20 bg-amber-500/5 px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-amber-300/60">
          <AlertTriangle className="size-3.5" />
          <span>
            Feature configurations will be disabled until a number is added
          </span>
        </div>
      </div>
    </div>
  )
}

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

  const role = user.user_metadata?.role ?? 'exec'

  // Get pod info
  const { data: pod, error: podError } = await db
    .from('pod')
    .select('id, name, servers, whatsapp_number')
    .eq('id', id)
    .single()

  // No pod found - show informative error
  if (!pod || podError) {
    return (
      <EmptyState
        icon={UserX}
        title="Pod Not Found"
        description="We couldn't find a pod associated with this ID. This could happen if the pod was deleted or if the URL is incorrect."
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left">
            <h3 className="mb-2 text-sm font-medium text-zinc-300">
              Possible reasons:
            </h3>
            <ul className="space-y-1.5 text-xs text-zinc-500">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-zinc-600" />
                The pod ID in the URL doesn&apos;t exist in our system
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-zinc-600" />
                Your account may not be linked to a pod yet
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-zinc-600" />
                The pod configuration may have been removed
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Link>
            {role === 'exec' && (
              <Link
                href="/dashboard/manage-pods"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Settings className="size-4" />
                Manage Pods
              </Link>
            )}
          </div>

          <p className="mt-4 text-xs text-zinc-600">
            Need help?{' '}
            <a href="#" className="text-zinc-500 underline hover:text-zinc-400">
              Contact support
            </a>
          </p>
        </div>
      </EmptyState>
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

  const hasWhatsAppNumber = Boolean(pod.whatsapp_number)

  return (
    <main className="p-7">
      <header className="mb-6">
        <div className="mb-2">
          {role === 'exec' ? (
            <Link
              href="/dashboard/media-buyer"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <ArrowLeft className="size-4" />
              Back to WhatsApp Hub
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/20">
            <MessageSquare className="size-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              WhatsApp Settings
            </h1>
            <p className="text-zinc-400">
              Configure WhatsApp notifications for{' '}
              <span className="font-medium text-zinc-300">{pod.name}</span>
            </p>
          </div>
        </div>
      </header>

      {!hasWhatsAppNumber && <SetupRequiredBanner podName={pod.name} />}

      <WhatsAppSettingsClient
        podName={pod.name}
        initialWhatsAppNumber={pod.whatsapp_number}
        initialConfigs={configs || []}
        globalConfigs={globalConfigs}
        isNumberRequired={!hasWhatsAppNumber}
      />
    </main>
  )
}
