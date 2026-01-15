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
      {/* Hero Section with Banner */}
      <section className="relative h-[350px] md:h-[420px] lg:h-[460px] overflow-hidden">
        {/* Banner Background Image - full height, crop from left only */}
        <div
          className="absolute inset-0 bg-[length:auto_100%] bg-right bg-no-repeat"
          style={{ backgroundImage: 'url(/banner/banner.jpg)' }}
        />

        {/* Gradient Overlay - stronger on left for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-transparent md:from-white/90 md:via-white/60 md:to-transparent" />

        {/* Content */}
        <div className="relative container mx-auto px-4 h-full">
          <div className="flex items-center justify-center md:justify-start h-full">
            <div className="max-w-lg py-8 md:ml-[5%] lg:ml-[8%]">
              {/* Main Heading */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2 leading-tight">
                {locale === 'zh' ? (
                  <>轻松管理儿童派对邀请</>
                ) : (
                  <>Kids Party Planning Made Easy</>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-base md:text-lg text-neutral-600 mb-4 max-w-md">
                {locale === 'zh'
                  ? '创建精美邀请函，二维码扫码回复，实时追踪宾客'
                  : 'Beautiful invitations, QR code RSVPs, real-time guest tracking'}
              </p>

              {/* Feature highlights */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="inline-flex items-center gap-1 bg-primary-100/80 text-primary-700 px-2.5 py-1 rounded-full text-xs font-medium">
                  📱 {locale === 'zh' ? '扫码回复' : 'QR RSVP'}
                </span>
                <span className="inline-flex items-center gap-1 bg-primary-100/80 text-primary-700 px-2.5 py-1 rounded-full text-xs font-medium">
                  🎨 {locale === 'zh' ? '精美模板' : 'Templates'}
                </span>
                <span className="inline-flex items-center gap-1 bg-primary-100/80 text-primary-700 px-2.5 py-1 rounded-full text-xs font-medium">
                  ✨ {locale === 'zh' ? '免费使用' : 'Free'}
                </span>
              </div>

              {/* Action Buttons */}
              {isAuthenticated === null ? (
                <div className="flex flex-col items-start">
                  <LoadingSpinner size="md" className="mb-2" />
                  <p className="text-neutral-600 text-sm">{t('home.loading')}</p>
                  {sessionError && (
                    <p className="text-red-600 text-xs mt-1">{sessionError}</p>
                  )}
                </div>
              ) : isAuthenticated ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/${locale}/party/new`} className="btn btn-primary px-6 shadow-md hover:shadow-lg transition-shadow">
                    {t('home.createNewParty')}
                  </Link>
                  <Link href={`/${locale}/dashboard`} className="btn btn-secondary px-6 bg-white/80 hover:bg-white">
                    {t('home.goToDashboard')}
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/${locale}/register`} className="btn btn-primary px-6 shadow-md hover:shadow-lg transition-shadow">
                    {locale === 'zh' ? '免费开始' : 'Get Started Free'}
                  </Link>
                </div>
              )}
            </div>
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