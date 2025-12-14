import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { AppHeader } from '@/components/app-header'
import { AnimatePresence } from 'framer-motion'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Timeline of Me',
  description: 'Your personal life journal with AI-powered insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppHeader />
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </Providers>
      </body>
    </html>
  )
}
