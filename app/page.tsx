import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Hero from '@/components/ui/Hero'
import { changePassword } from '@/lib/actions'

export default async function Home() {
  // await changePassword()
  // at pre-meeting int
  return (
    <>
      <Nav />

      <main className="flex min-h-screen flex-col items-center justify-between scroll-smooth">
        <Hero />
      </main>
      <Footer />
    </>
  )
}
