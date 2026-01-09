'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/LoadingStates'
import { useLocale, useLanguage } from '@/contexts/LanguageContext'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const { t } = useLanguage()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') {
      setIsAuthenticated(null)
      setSessionError(null)
    } else if (status === 'authenticated' && session?.user?.id) {
      setIsAuthenticated(true)
      setSessionError(null)
    } else if (status === 'unauthenticated') {
      setIsAuthenticated(false)
      setSessionError(null)
    } else {
      setSessionError('Session check failed')
      setIsAuthenticated(false)
    }
  }, [status, session])

  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setSessionError('Connection timeout')
        setIsAuthenticated(false)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [status])

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="section-spacing bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="container mx-auto px-4">
          <div className="mobile-container text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 text-balance">
              {t('home.title')}
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 mb-8 text-balance max-w-2xl mx-auto">
              {t('home.subtitle')}
            </p>

            {isAuthenticated === null ? (
              <div className="flex flex-col items-center">
                <LoadingSpinner size="lg" className="mb-4" />
                <p className="text-neutral-600">{t('home.loading')}</p>
                {sessionError && (
                  <p className="text-red-600 text-sm mt-2">{sessionError}</p>
                )}
              </div>
            ) : isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto sm:max-w-none">
                <Link href={`/${locale}/dashboard`} className="btn btn-primary text-lg px-8">
                  {t('home.goToDashboard')}
                </Link>
                <Link href={`/${locale}/party/new`} className="btn btn-secondary text-lg px-8">
                  {t('home.createNewParty')}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto sm:max-w-none">
                <Link href={`/${locale}/register`} className="btn btn-primary text-lg px-8">
                  {t('home.startPlanning')}
                </Link>
                <Link href={`/${locale}/login`} className="btn btn-secondary text-lg px-8">
                  {t('home.haveAccount')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {t('home.featuresTitle')}
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {t('home.featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="card text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                {t('features.qrCode.title')}
              </h3>
              <p className="text-neutral-600">
                {t('features.qrCode.desc')}
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                {t('features.reminders.title')}
              </h3>
              <p className="text-neutral-600">
                {t('features.reminders.desc')}
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                {t('features.privacy.title')}
              </h3>
              <p className="text-neutral-600">
                {t('features.privacy.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing bg-primary-600">
        <div className="container mx-auto px-4">
          <div className="mobile-container text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <Link href={`/${locale}/register`} className="btn bg-white text-primary-600 hover:bg-neutral-50 text-lg px-8 font-semibold">
              {t('home.getStartedFree')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}