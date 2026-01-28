'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
        {/* Banner Background Image - optimized with Next.js Image */}
        <Image
          src="/banner/banner.jpg"
          alt={locale === 'zh' ? '儿童生日派对邀请函' : 'Kids Birthday Party Invitations'}
          fill
          priority
          className="object-cover object-right"
          sizes="100vw"
          quality={85}
        />

        {/* Gradient Overlay - stronger on left for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-transparent md:from-white/90 md:via-white/60 md:to-transparent" />

        {/* Content */}
        <div className="relative container mx-auto px-4 h-full">
          <div className="flex items-center justify-center md:justify-start h-full">
            <div className="max-w-lg py-8 md:ml-[5%] lg:ml-[8%]">
              {/* Main Heading - SEO optimized */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2 leading-tight">
                {locale === 'zh' ? (
                  <>创建儿童生日派对邀请函<br />轻松在线RSVP</>
                ) : (
                  <>Create Kids Birthday Party<br />Invitations with Easy Online RSVP</>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-base md:text-lg text-neutral-600 mb-4 max-w-md">
                {locale === 'zh'
                  ? '创建精美邀请函，二维码扫码回复，实时追踪宾客'
                  : 'Beautiful invitations, QR code RSVPs, real-time guest tracking'}
              </p>

              {/* Feature highlights - clickable links to create party */}
              <div className="flex flex-wrap gap-2 mb-5">
                <Link
                  href={isAuthenticated ? `/${locale}/party/new` : `/${locale}/register`}
                  className="inline-flex items-center gap-1 bg-primary-100/80 text-primary-700 px-2.5 py-1 rounded-full text-xs font-medium hover:bg-primary-200/80 transition-colors cursor-pointer"
                >
                  📱 {locale === 'zh' ? '扫码回复' : 'QR RSVP'}
                </Link>
                <Link
                  href={isAuthenticated ? `/${locale}/party/new` : `/${locale}/register`}
                  className="inline-flex items-center gap-1 bg-primary-100/80 text-primary-700 px-2.5 py-1 rounded-full text-xs font-medium hover:bg-primary-200/80 transition-colors cursor-pointer"
                >
                  🎨 {locale === 'zh' ? '精美模板' : 'Templates'}
                </Link>
                <Link
                  href={isAuthenticated ? `/${locale}/party/new` : `/${locale}/register`}
                  className="inline-flex items-center gap-1 bg-primary-100/80 text-primary-700 px-2.5 py-1 rounded-full text-xs font-medium hover:bg-primary-200/80 transition-colors cursor-pointer"
                >
                  ✨ {locale === 'zh' ? '免费使用' : 'Free'}
                </Link>
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
                <div className="flex flex-row gap-3 flex-wrap">
                  <Link href={`/${locale}/party/new`} className="btn btn-primary px-4 sm:px-6 shadow-md hover:shadow-lg transition-shadow whitespace-nowrap">
                    {t('home.createNewParty')}
                  </Link>
                  <Link href={`/${locale}/dashboard`} className="btn btn-secondary px-4 sm:px-6 bg-white/80 hover:bg-white whitespace-nowrap">
                    {t('home.goToDashboard')}
                  </Link>
                </div>
              ) : (
                <div className="flex flex-row gap-3">
                  <Link href={`/${locale}/register`} className="btn btn-primary px-4 sm:px-6 shadow-md hover:shadow-lg transition-shadow whitespace-nowrap">
                    {locale === 'zh' ? '免费开始' : 'Get Started Free'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Themes - SEO Internal Links */}
      <section id="popular-themes" className="section-spacing bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {locale === 'zh' ? '热门儿童生日派对主题' : 'Popular Kids Birthday Party Themes'}
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {locale === 'zh'
                ? '选择您孩子喜爱的主题，创建独特的派对邀请函'
                : 'Choose your child\'s favorite theme and create a unique party invitation'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mx-auto max-w-7xl">
            <Link href={`/${locale}/templates/dinosaur-birthday-party`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-5xl mb-3">🦖</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {locale === 'zh' ? '恐龙生日派对' : 'Dinosaur Birthday Party'}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">
                {locale === 'zh' ? '适合喜欢恐龙的小朋友' : 'Perfect for dino-loving kids'}
              </p>
            </Link>
            <Link href={`/${locale}/templates/princess-birthday-party`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-5xl mb-3">👸</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {locale === 'zh' ? '公主生日派对' : 'Princess Birthday Party'}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">
                {locale === 'zh' ? '梦幻公主主题派对' : 'Magical princess celebrations'}
              </p>
            </Link>
            <Link href={`/${locale}/templates/unicorn-birthday-party`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-5xl mb-3">🦄</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {locale === 'zh' ? '独角兽生日派对' : 'Unicorn Birthday Party'}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">
                {locale === 'zh' ? '彩虹独角兽梦幻派对' : 'Rainbow unicorn magic'}
              </p>
            </Link>
            <Link href={`/${locale}/templates/superhero-birthday-party`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-5xl mb-3">🦸</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {locale === 'zh' ? '超级英雄生日派对' : 'Superhero Birthday Party'}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">
                {locale === 'zh' ? '英雄主题冒险派对' : 'Action-packed hero parties'}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features - SEO Internal Links */}
      <section id="features" className="section-spacing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {locale === 'zh' ? '儿童派对RSVP核心功能' : 'Key RSVP Features for Kids Parties'}
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {locale === 'zh'
                ? '专为儿童派对设计的智能功能'
                : 'Smart features designed specifically for kids\' birthday parties'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mx-auto max-w-7xl">
            <Link href={`/${locale}/features/qr-code-rsvp`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {locale === 'zh' ? '二维码RSVP' : 'QR Code RSVP'}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">
                {locale === 'zh' ? '扫码即可回复邀请' : 'Scan to respond instantly'}
              </p>
            </Link>
            <Link href={`/${locale}/features/guest-tracking`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {locale === 'zh' ? '宾客追踪' : 'Guest Tracking'}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">
                {locale === 'zh' ? '实时查看回复状态' : 'Real-time response tracking'}
              </p>
            </Link>
            <Link href={`/${locale}/features/automatic-reminders`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-4xl mb-3">🔔</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {locale === 'zh' ? '自动提醒' : 'Automatic Reminders'}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">
                {locale === 'zh' ? '自动发送回复提醒' : 'Auto-remind pending guests'}
              </p>
            </Link>
            <Link href={`/${locale}/features/no-app-required`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {locale === 'zh' ? '无需下载APP' : 'No App Required'}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">
                {locale === 'zh' ? '浏览器直接使用' : 'Works in any browser'}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* What is KidsPartyRSVP - SEO Critical Section */}
      <section id="what-is-kidspartyrsvp" className="section-spacing bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6 text-center">
              {locale === 'zh' ? '什么是 KidsPartyRSVP？' : 'What is KidsPartyRSVP?'}
            </h2>
            <div className="prose prose-lg max-w-none text-neutral-700 text-justify">
              {locale === 'zh' ? (
                <>
                  <p>
                    KidsPartyRSVP 是一款专为家长设计的在线工具，帮助您轻松创建儿童生日派对邀请函并管理宾客回复（RSVP）。
                    无论是恐龙主题、公主主题还是独角兽主题的生日派对，我们都提供精美的邀请函模板，让您的派对邀请脱颖而出。
                  </p>
                  <p>
                    通过二维码RSVP功能，宾客只需扫一扫即可回复邀请，无需下载任何APP。系统会自动追踪宾客回复状态，
                    包括参加人数、过敏信息和联系方式。自动提醒功能会在派对前发送通知给尚未回复的宾客，确保您准确掌握参与人数。
                  </p>
                  <p>
                    告别繁琐的微信群统计和纸质邀请函。KidsPartyRSVP 让派对策划变得简单、高效、有趣。
                    基础功能完全免费，几分钟内即可创建专业的派对邀请。
                  </p>
                </>
              ) : (
                <>
                  <p>
                    KidsPartyRSVP is an online tool designed to help parents create beautiful kids birthday party
                    invitations and manage RSVPs effortlessly. Whether you're planning a dinosaur birthday party,
                    princess party, unicorn celebration, or superhero bash, our platform provides stunning invitation
                    templates that make your party stand out.
                  </p>
                  <p>
                    With our QR code RSVP feature, guests can respond to invitations instantly by scanning a code -
                    no app download required. The system automatically tracks guest responses in real-time, including
                    headcount, allergy information, and contact details. Automatic reminder notifications are sent to
                    guests who haven't responded, ensuring you have an accurate guest count before the big day.
                  </p>
                  <p>
                    Say goodbye to messy group chats and paper invitations. KidsPartyRSVP makes party planning simple,
                    efficient, and fun. Core features are completely free, and you can create a professional party
                    invitation in just minutes.
                  </p>
                </>
              )}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-auto max-w-7xl">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto max-w-7xl">
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
          <div className="mobile-container text-center max-w-7xl mx-auto">
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