'use client'

import { ShootingStars } from '@/components/ui/shooting-stars'
import { StarsBackground } from '@/components/ui/stars-background'
import Link from 'next/link'

export default function Hero() {
  return (
    <header className="relative flex min-h-screen w-full flex-col items-center rounded-md pt-28">
      <hgroup className="z-10">
        <h1 className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-2 bg-gradient-to-b from-neutral-800 via-white to-white bg-clip-text text-center text-3xl font-semibold tracking-tight text-transparent md:flex-row md:gap-8 md:text-5xl md:leading-tight">
          Automate Your Business
        </h1>
        <p className="text-center text-sm tracking-wide text-zinc-500">
          An <a href="https://www.arekos.com/">Arekos</a> product
        </p>
      </hgroup>
      <Link
        href={'/dashboard'}
        className="z-10 mt-10 rounded border border-zinc-700 bg-zinc-700/10 px-7 py-5 font-medium transition-colors hover:bg-zinc-700/20"
      >
        Visit Dashboard
      </Link>
      <ShootingStars />
      <StarsBackground />
    </header>
  )
}
