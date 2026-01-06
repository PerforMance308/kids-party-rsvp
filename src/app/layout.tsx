import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Providers from '@/components/SessionProvider'
import { ToastContainer } from '@/components/ToastContainer'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Kid Party RSVP',
  description: 'Simple party invitations and RSVP management for children\'s parties',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: false,
    follow: false,
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            {children}
            <ToastContainer />
          </div>
        </Providers>
      </body>
    </html>
  )
}