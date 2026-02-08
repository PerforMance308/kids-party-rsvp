'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/LoadingStates'

interface HeroCTAProps {
  locale: string
  translations: {
    loading: string
    createNewParty: string
    goToDashboard: string
    getStartedFree: string
  }
}

export default function HeroCTA({ locale, translations }: HeroCTAProps) {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated' && !!session?.user?.id
  const isLoading = status === 'loading'

  if (isLoading) {
    return (
      <div className="flex flex-col items-start">
        <LoadingSpinner size="md" className="mb-2" />
        <p className="text-neutral-600 text-sm">{translations.loading}</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex flex-row gap-3 flex-wrap">
        <Link href={`/${locale}/party/new`} className="btn btn-primary px-4 sm:px-6 shadow-md hover:shadow-lg transition-shadow whitespace-nowrap">
          {translations.createNewParty}
        </Link>
        <Link href={`/${locale}/dashboard`} className="btn btn-secondary px-4 sm:px-6 bg-white/80 hover:bg-white whitespace-nowrap">
          {translations.goToDashboard}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-row gap-3">
      <Link href={`/${locale}/register`} className="btn btn-primary px-4 sm:px-6 shadow-md hover:shadow-lg transition-shadow whitespace-nowrap">
        {translations.getStartedFree}
      </Link>
    </div>
  )
}
