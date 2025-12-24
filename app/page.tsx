'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="relative h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_650px_at_25%_15%,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_650px_at_85%_35%,rgba(255,255,255,0.07),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:84px_84px]" />
      </div>

      <header className="relative z-10 mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <span className="relative grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-white/5">
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="pointer-events-none absolute -inset-px rounded-full ring-1 ring-white/10" />
          </span>
          <span className="text-sm font-medium tracking-wide">IXM</span>
          <span className="text-xs tracking-[0.35em] text-white/40">
            INTERNAL
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid h-[calc(100vh-56px)] w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 pb-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
            Operations Suite
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              IXM
              <span className="text-white/55"> Control Surface</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/60">
              A single, elegant interface for the IXM automize service.
            </p>
          </div>

          <p className="text-xs text-white/35">An Arekos product.</p>
        </div>
      </section>
    </main>
  )
}
