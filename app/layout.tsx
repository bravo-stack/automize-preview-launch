import type { Metadata } from 'next'
import './globals.css'
import { GeistSans } from 'geist/font/sans'
import { Toaster } from 'react-hot-toast'

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
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
