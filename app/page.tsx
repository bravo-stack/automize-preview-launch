import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Hero from '@/components/ui/Hero'

export default async function Home() {
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
