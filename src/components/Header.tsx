'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import UserNav from './UserNav'
import { useLocale } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import VerificationBanner from './VerificationBanner'

export default function Header() {
  const locale = useLocale()
  const { data: session } = useSession()

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href={`/${locale}`} className="text-lg md:text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0">
            🎉 Kid Party RSVP
          </Link>

          <Suspense fallback={<div className="h-10 w-20 bg-neutral-100 animate-pulse rounded-lg"></div>}>
            <UserNav />
          </Suspense>
        </div>
      </div>
      {!session?.user?.emailVerified && session?.user?.email && (
        <VerificationBanner email={session.user.email} />
      )}
    </header>
  )
}