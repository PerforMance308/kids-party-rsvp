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

      {/* How It Works Section - SEO optimized */}
      <section className="section-spacing bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {locale === 'zh' ? '三步轻松搞定派对邀请' : 'How Kids Party RSVP Works'}
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {locale === 'zh'
                ? '无需复杂操作，几分钟内创建专业的派对邀请函'
                : 'Create professional birthday party invitations in minutes, no design skills needed'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {locale === 'zh' ? '创建派对' : 'Create Your Party'}
              </h3>
              <p className="text-neutral-600">
                {locale === 'zh'
                  ? '填写派对信息：日期、时间、地点和主题。选择精美的邀请函模板。'
                  : 'Enter party details: date, time, location, and theme. Choose from beautiful invitation templates.'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {locale === 'zh' ? '分享邀请函' : 'Share Invitations'}
              </h3>
              <p className="text-neutral-600">
                {locale === 'zh'
                  ? '通过二维码、链接或邮件发送邀请。宾客扫码即可回复，无需下载APP。'
                  : 'Share via QR code, link, or email. Guests scan to RSVP instantly - no app download required.'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {locale === 'zh' ? '追踪回复' : 'Track RSVPs'}
              </h3>
              <p className="text-neutral-600">
                {locale === 'zh'
                  ? '实时查看宾客回复、过敏信息和联系方式。自动提醒未回复的宾客。'
                  : 'View responses, allergies, and contact info in real-time. Auto-remind guests who haven\'t replied.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - SEO content */}
      <section className="section-spacing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {locale === 'zh' ? '为什么选择 Kids Party RSVP？' : 'Why Parents Love Kids Party RSVP'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="text-3xl">✨</div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {locale === 'zh' ? '完全免费开始' : '100% Free to Start'}
                </h3>
                <p className="text-neutral-600">
                  {locale === 'zh'
                    ? '基础功能永久免费。创建邀请函、二维码回复、宾客追踪 - 全部免费！'
                    : 'Core features are free forever. Create invitations, QR code RSVPs, guest tracking - all free!'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {locale === 'zh' ? '移动端友好' : 'Mobile-Friendly Design'}
                </h3>
                <p className="text-neutral-600">
                  {locale === 'zh'
                    ? '在任何设备上完美显示。家长可以在手机上轻松回复邀请。'
                    : 'Works perfectly on any device. Parents can easily RSVP right from their phones.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">🔐</div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {locale === 'zh' ? '隐私保护' : 'Privacy Protected'}
                </h3>
                <p className="text-neutral-600">
                  {locale === 'zh'
                    ? '宾客信息完全保密，只有派对主人可以查看。绝不分享或出售您的数据。'
                    : 'Guest info stays private - only you can see it. We never share or sell your data.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">⏰</div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {locale === 'zh' ? '节省时间' : 'Save Hours of Time'}
                </h3>
                <p className="text-neutral-600">
                  {locale === 'zh'
                    ? '告别手动统计回复。自动提醒和实时追踪，让派对策划变得轻松。'
                    : 'No more manual tracking. Auto-reminders and real-time updates make party planning effortless.'}
                </p>
              </div>
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