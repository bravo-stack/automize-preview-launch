export default function FormsLoading() {
  return (
    <main className="space-y-7 p-7">
      <section className="mx-auto max-w-7xl divide-y divide-zinc-800 overflow-hidden rounded-md border border-zinc-800">
        <div className="flex w-full flex-col items-stretch justify-start md:flex-row md:items-center md:justify-between">
          <div className="bg-night-starlit px-5 py-2.5">
            <div className="h-7 w-32 animate-pulse rounded bg-zinc-700" />
            <div className="mt-1 h-4 w-56 animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="px-5 py-2.5">
            <div className="h-9 w-24 animate-pulse rounded bg-zinc-700" />
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1.5 h-4 w-24 animate-pulse rounded bg-zinc-800" />
              <div className="h-10 w-full animate-pulse rounded bg-zinc-700" />
            </div>
            <div>
              <div className="mb-1.5 h-4 w-24 animate-pulse rounded bg-zinc-800" />
              <div className="h-10 w-full animate-pulse rounded bg-zinc-700" />
            </div>
          </div>

          <div className="mb-4 rounded border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="h-5 w-40 animate-pulse rounded bg-zinc-700" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-zinc-800" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-64 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-800" />
            </div>

            <ul className="space-y-1.5">
              {[...Array(5)].map((_, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded border border-zinc-800 bg-night-starlit p-3"
                >
                  <div className="space-y-2">
                    <div className="h-5 w-32 animate-pulse rounded bg-zinc-700" />
                    <div className="h-4 w-48 animate-pulse rounded bg-zinc-800" />
                    <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-2">
                      <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
                      <div className="h-3 w-28 animate-pulse rounded bg-zinc-800" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 animate-pulse rounded bg-zinc-700" />
                      <div className="h-8 w-16 animate-pulse rounded bg-zinc-700" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
