import { ThemeProvider } from '@/components/ThemeProvider'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Automize',
  description: 'The only business optimization solution you need.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>{children}</NuqsAdapter>
        </ThemeProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
