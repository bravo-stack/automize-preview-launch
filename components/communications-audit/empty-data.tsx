'use client'

const EmptyData = () => {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="max-w-lg rounded-xl border border-zinc-800/50 bg-gradient-to-br from-night-starlit to-night-moonlit p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-zinc-800/50 p-3">
            <svg
              className="h-8 w-8 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>
        <h3 className="mb-4 text-xl font-semibold text-white">
          No Communication Reports Found
        </h3>
        <p className="mb-4 text-zinc-300">
          There are no communication audit reports in the database yet.
        </p>
      </div>
    </div>
  )
}

export default EmptyData
