'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { SESSION_CHECK_TIMEOUT_MS } from '@/lib/constants'

interface UseAuthProtectionOptions {
  redirectTo?: string
  locale?: string
}

interface AuthState {
  isAuthenticated: boolean | null
  isLoading: boolean
  error: string | null
  userId: string | null
}

/**
 * Hook to protect pages that require authentication
 * Handles loading states, timeouts, and redirects
 */
export function useAuthProtection(options: UseAuthProtectionOptions = {}): AuthState {
  const { redirectTo, locale = 'en' } = options
  const { data: session, status } = useSession()
  const [error, setError] = useState<string | null>(null)

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!session?.user?.id
  const userId = session?.user?.id || null

  // Handle authentication redirect
  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated' || !session?.user?.id) {
      const loginUrl = redirectTo
        ? `/${locale}/login?redirect=${encodeURIComponent(redirectTo)}`
        : `/${locale}/login`
      window.location.href = loginUrl
    }
  }, [status, session, redirectTo, locale])

  // Handle loading timeout
  useEffect(() => {
    if (status !== 'loading') return

    const timeout = setTimeout(() => {
      setError('Connection timeout')
    }, SESSION_CHECK_TIMEOUT_MS)

    return () => clearTimeout(timeout)
  }, [status])

  return {
    isAuthenticated: status === 'loading' ? null : isAuthenticated,
    isLoading,
    error,
    userId,
  }
}

/**
 * Hook for pages that should redirect authenticated users away (login, register)
 */
export function useRedirectIfAuthenticated(redirectTo: string): boolean {
  const { data: session, status } = useSession()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'authenticated' && session?.user?.id) {
      window.location.href = redirectTo
    } else {
      setShouldRender(true)
    }
  }, [status, session, redirectTo])

  return status === 'loading' || !shouldRender
}
