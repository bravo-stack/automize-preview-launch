'use client'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// You can manage your navigation links centrally
const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#solutions', label: 'Solutions' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#company', label: 'Company' },
]

export default function Nav() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastYPos, setLastYPos] = useState(0)

  // Effect to handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const currentYPos = window.scrollY
      // Show nav if scrolling up or at the top
      setIsScrolled(currentYPos > lastYPos && currentYPos > 100)
      setLastYPos(currentYPos)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastYPos])

  return (
    <header
      className={`fixed left-0 right-0 top-4 z-[15280] mx-auto max-w-[89dvw] transition-transform duration-300 ease-in-out lg:max-w-5xl
      ${isScrolled ? '-translate-y-24' : 'translate-y-0'}`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between rounded-2xl border border-zinc-800/80 bg-black/50 p-4 backdrop-blur-md">
        {/* Logo and Desktop Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-50">
              Automize
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-zinc-50 ${
                  pathname === link.href ? 'text-zinc-50' : 'text-zinc-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-4 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/signup">Request a Demo</Link>
          </Button>
        </div>

        {/* Mobile Navigation (Sheet) */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                className="hover:bg-gray-500/50 hover:text-white"
                variant="ghost"
                size="icon"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              disableInternalCloseBtn
              side="bottom"
              className="h-[60dvh] rounded-t-2xl border-t border-zinc-800 bg-black"
            >
              <div className="flex h-full flex-col">
                {/* Mobile Nav Header */}
                <div className="mb-8 flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-2">
                    <span className="text-lg font-bold tracking-tight text-zinc-50">
                      Automize
                    </span>
                  </Link>
                  <SheetClose asChild>
                    <Button
                      className="hover:bg-gray-500/50 hover:text-white"
                      variant="ghost"
                      size="icon"
                    >
                      <X className="h-5 w-5 text-white" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </SheetClose>
                </div>

                {/* Mobile Nav Links */}
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={`text-lg font-medium transition-colors hover:text-zinc-50 ${
                          pathname === link.href
                            ? 'text-zinc-50'
                            : 'text-zinc-400'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                {/* Mobile CTAs */}
                <div className="mt-auto flex flex-col gap-4 pt-8">
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
