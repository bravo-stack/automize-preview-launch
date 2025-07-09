'use client'

import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function Hero() {
  return (
    <div className="container z-10 mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-6 text-center md:py-[10dvh] lg:gap-12 lg:py-[20dvh]">
      <Badge variant="secondary" className="mb-4 gap-1">
        <Sparkles className="h-3 w-3" />
        An Arekos Product
      </Badge>

      <hgroup className="space-y-4">
        <h1 className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-2xl font-bold tracking-tight text-transparent text-white sm:text-3xl md:text-5xl lg:text-7xl">
          Automate Your
          <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            {' '}
            Business
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Streamline your workflows and boost productivity with our cutting-edge
          automation platform.
        </p>
      </hgroup>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg" className="gap-2">
          <Link href="/dashboard">
            Visit Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <Button variant="outline" size="lg" asChild>
          <Link href="https://www.arekos.com/">Learn More</Link>
        </Button>
      </div>
    </div>
  )
}
