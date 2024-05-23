import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

const inter = Inter({ subsets: ['latin'] })

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
      </body>
    </html>
  )
}
