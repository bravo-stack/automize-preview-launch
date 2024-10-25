import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import { GeistSans } from 'geist/font/sans'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Automize',
  description: 'The only business optimization solution you need.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
