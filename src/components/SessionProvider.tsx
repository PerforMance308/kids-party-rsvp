'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Check every 5 minutes instead of never
      refetchOnWindowFocus={true} // Re-enable window focus check
    >
      {children}
    </SessionProvider>
  )
}