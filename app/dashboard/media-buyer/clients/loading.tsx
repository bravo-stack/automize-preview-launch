// Skeleton loading state for /dashboard/media-buyer/clients
// Matches the page layout structure for consistent UX

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
          <div className="mt-2.5 h-7 w-12 animate-pulse rounded bg-white/15" />
        </div>
        <div className="h-10 w-10 animate-pulse rounded-lg bg-white/10" />
      </div>
    </div>
  )
}

function ClientCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5">
      {/* Status dot */}
      <div className="absolute right-4 top-4 h-2 w-2 animate-pulse rounded-full bg-white/20" />

      <div className="flex flex-col gap-3">
        {/* Brand name */}
        <div className="h-5 w-3/4 animate-pulse rounded bg-white/15" />

        {/* Website */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        </div>

        {/* Data indicators */}
        <div className="flex items-center gap-3 border-t border-white/5 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-12 animate-pulse rounded bg-white/10" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-14 animate-pulse rounded bg-white/10" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-white/10" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-white/10" />
        </div>

        {/* Footer */}
        <div className="mt-1 flex items-center justify-between">
          <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </div>
  )
}

export default function MediaBuyerClientsLoading() {
  return (
    <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
      <div className="mx-auto max-w-[1800px] space-y-8">
        {/* Header Skeleton */}
        <header>
          <div className="h-10 w-24 animate-pulse rounded bg-gradient-to-r from-white/20 to-white/10" />
          <div className="mt-2 h-5 w-96 max-w-full animate-pulse rounded bg-white/10" />
        </header>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Search and Controls Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <div className="h-10 w-full animate-pulse rounded-lg bg-white/5 ring-1 ring-white/10" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-10 animate-pulse rounded bg-white/10" />
            <div className="h-9 w-16 animate-pulse rounded-lg bg-white/5 ring-1 ring-white/10" />
            <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
          </div>
        </div>

        {/* Client Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ClientCardSkeleton key={i} />
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-9 animate-pulse rounded-lg bg-white/5"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
