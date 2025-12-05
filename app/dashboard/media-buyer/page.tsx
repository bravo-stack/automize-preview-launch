import Section from '@/components/common/section'
import { createClient } from '@/lib/db/server'
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

  if (error) {
    console.error('Error fetching pods:', error)
  }

  return (
    <main className="space-y-7 p-7">
      <Section title="WhatsApp Settings by Pod">
        <div className="space-y-4 p-4">
          <p className="text-sm text-zinc-400">
            Select a pod to manage WhatsApp notifications and schedules.
          </p>

          {error ? (
            <div className="rounded-md border border-red-800 bg-red-950/20 p-4 text-sm text-red-400">
              Error loading pods: {error.message}
            </div>
          ) : !pods || pods.length === 0 ? (
            <p className="text-center font-medium text-zinc-500 ">
              No pods found.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pods.map((pod) => (
                <li key={pod.id}>
                  <Link
                    href={`/dashboard/media-buyer/${pod.id}/whatsapp`}
                    className="block rounded-lg border border-zinc-800 bg-night-starlit p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-neutral-200">
                          {pod.name}
                        </h3>
                        {pod.whatsapp_number && (
                          <p className="mt-1 text-xs text-zinc-500">
                            {pod.whatsapp_number}
                          </p>
                        )}
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-5 text-zinc-600"
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
