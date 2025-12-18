import Section from '@/components/common/section'
import {
  GlobalConfigSection,
  MissingWhatsAppSection,
} from '@/components/whatsapp'
import { getGlobalConfig } from '@/lib/actions/global-whatsapp-configs'
import { createClient } from '@/lib/db/server'
import type { PodWithWhatsApp } from '@/types/whatsapp'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// ============================================================================
// Media Buyer Hub - WhatsApp Management
// ============================================================================
// Landing page for execs to select which pod's WhatsApp settings to manage
// ============================================================================

export default async function MediaBuyerPage() {
  const db = createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get all pods with their WhatsApp info
  const { data: pods, error } = await db
    .from('pod')
    .select('id, name, user_id, whatsapp_number')
    .order('name')

  // Get global config
  const globalConfig = await getGlobalConfig()

  if (error) {
    console.error('Error fetching pods:', error)
  }

  // Separate pods with and without WhatsApp numbers
  const podsWithWhatsApp = (pods || []).filter((p) => p.whatsapp_number)
  const podsWithoutWhatsApp = (pods || []).filter(
    (p) => !p.whatsapp_number,
  ) as PodWithWhatsApp[]

  return (
    <main className="space-y-7 p-7">
      {/* Quick Access to Client Dashboard */}
      <Section
        title="Client Dashboard"
        actions={
          <Link
            href="/dashboard/media-buyer/clients"
            className="flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors"
          >
            View Clients
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </Link>
        }
      >
        <div className="p-4">
          <p className="text-sm text-zinc-400">
            Access client-specific data including Shopify themes, Omnisend
            performance metrics, orders, automations, campaigns, and more.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-night-starlit p-3">
              <h4 className="font-medium text-zinc-300">Theme Details</h4>
              <p className="mt-1 text-xs text-zinc-500">
                View Shopify theme configurations for each client
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-night-starlit p-3">
              <h4 className="font-medium text-zinc-300">Omnisend Analytics</h4>
              <p className="mt-1 text-xs text-zinc-500">
                Revenue, orders, campaigns, and automation performance
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-night-starlit p-3">
              <h4 className="font-medium text-zinc-300">Per-Client View</h4>
              <p className="mt-1 text-xs text-zinc-500">
                All data organized by client for easy analysis
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Global Configuration Section */}
      <GlobalConfigSection initialConfig={globalConfig} />

      {/* Missing WhatsApp Numbers Section */}
      <MissingWhatsAppSection pods={podsWithoutWhatsApp} />

      {/* Pods with WhatsApp configured */}
      <Section title="WhatsApp Settings by Pod">
        <div className="space-y-4 p-4">
          <p className="text-sm text-zinc-400">
            Select a pod to manage individual WhatsApp notification settings.
          </p>

          {error ? (
            <div className="rounded-md border border-red-800 bg-red-950/20 p-4 text-sm text-red-400">
              Error loading pods: {error.message}
            </div>
          ) : podsWithWhatsApp.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-night-midnight p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6 text-zinc-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                  />
                </svg>
              </div>
              <p className="font-medium text-zinc-400">
                No pods have WhatsApp configured yet
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Add WhatsApp numbers to pods above to enable notifications
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {podsWithWhatsApp.map((pod) => (
                <li key={pod.id}>
                  <Link
                    href={`/dashboard/media-buyer/${pod.id}/whatsapp`}
                    className="group block rounded-lg border border-zinc-800 bg-night-starlit p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-neutral-200">
                          {pod.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-green-500" />
                          <p className="text-xs text-zinc-500">
                            {pod.whatsapp_number}
                          </p>
                        </div>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-5 text-zinc-600 transition-transform group-hover:translate-x-1"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>
    </main>
  )
}
