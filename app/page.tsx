import Cycle from '@/components/Cycle'
import Solutions from '@/components/Solutions'
import Hero from '@/components/ui/Hero'
import Link from 'next/link'

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between scroll-smooth">
      <Hero />
    </main>
  )
}
