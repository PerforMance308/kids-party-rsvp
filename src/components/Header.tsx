'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import UserNav from './UserNav'
import { useLocale } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import VerificationBanner from './VerificationBanner'

export default function Header() {
  const locale = useLocale()
  const { data: session } = useSession()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  const isHome = pathname === `/${locale}` || pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const headerBg = isHome && !scrolled
    ? 'bg-transparent border-transparent'
    : 'bg-white/80 backdrop-blur-xl border-neutral-200/50 shadow-sm'

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${headerBg}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14 md:h-20">
          <Link href={`/${locale}`} className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Kid Party RSVP"
              width={240}
              height={60}
              className="h-10 md:h-16 w-auto object-contain"
              priority
            />
          </Link>

          <Suspense fallback={<div className="h-10 w-20 bg-neutral-100 animate-pulse rounded-xl"></div>}>
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
