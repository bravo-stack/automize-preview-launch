import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
      <div className="mx-auto max-w-[1800px] space-y-6">
        {/* Back Link Skeleton */}
        <div className="h-5 w-32 animate-pulse rounded bg-white/10" />

        {/* Client Header Skeleton */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 animate-pulse rounded-xl bg-white/10" />
              <div className="space-y-2">
                <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
                <div className="flex gap-2">
                  <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-white/10" />
                </div>
              </div>
            </div>
            <div className="h-10 w-32 animate-pulse rounded-lg bg-white/10" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-white/10" />
            ))}
          </div>
        </div>

        {/* Data Sync Status Skeleton */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded border border-white/5 bg-white/5"
              />
            ))}
          </div>
        </div>

        {/* Theme Section Skeleton */}
        <section>
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-48 animate-pulse rounded-lg border border-white/10 bg-white/5" />
        </section>

        {/* Omnisend Section Skeleton */}
        <section>
          <div className="mb-4 h-6 w-44 animate-pulse rounded bg-white/10" />

          {/* Revenue & Campaign Metrics Skeleton */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-48 animate-pulse rounded-lg border border-white/10 bg-white/5" />
            <div className="h-48 animate-pulse rounded-lg border border-white/10 bg-white/5" />
          </div>

          {/* Orders & Automations Skeleton */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-lg border border-white/10 bg-white/5" />
            <div className="h-64 animate-pulse rounded-lg border border-white/10 bg-white/5" />
          </div>

          {/* Campaigns Skeleton */}
          <div className="mt-6">
            <div className="h-64 animate-pulse rounded-lg border border-white/10 bg-white/5" />
          </div>

          {/* Contacts & Products Skeleton */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-48 animate-pulse rounded-lg border border-white/10 bg-white/5" />
            <div className="h-48 animate-pulse rounded-lg border border-white/10 bg-white/5" />
          </div>
        </section>

        {/* Loading Indicator */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-zinc-900/90 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
            <p className="text-white/60">Loading client data...</p>
          </div>
        </div>
      </div>
    </main>
  )
}
