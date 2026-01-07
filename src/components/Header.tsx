'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import UserNav from './UserNav'
import LanguageSwitcher from './LanguageSwitcher'
import { useLocale } from '@/contexts/LanguageContext'

export default function Header() {
  const locale = useLocale()
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href={`/${locale}`} className="text-xl md:text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
            🎉 Kid Party RSVP
          </Link>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Suspense fallback={<div className="h-10 w-20 bg-neutral-100 animate-pulse rounded-lg"></div>}>
              <UserNav />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  )
}