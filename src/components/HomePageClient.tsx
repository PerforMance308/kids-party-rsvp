'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
  QrCodeIcon,
  UserGroupIcon,
  BellAlertIcon,
  GlobeAltIcon,
  SparklesIcon,
  ClockIcon,
  PaintBrushIcon,
  RocketLaunchIcon,
  ShareIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal'
import GradientIcon from './GradientIcon'
import AnimatedCounter from './AnimatedCounter'
import { LoadingSpinner } from './LoadingStates'

interface HomePageClientProps {
  locale: string
  t: Record<string, string>
}

export default function HomePageClient({ locale, t }: HomePageClientProps) {
  return (
    <div>
      <HeroSection locale={locale} t={t} />
      <BentoSection locale={locale} t={t} />
      <HowItWorksSection locale={locale} t={t} />
      <StatsSection locale={locale} t={t} />
      <CTASection locale={locale} t={t} />
    </div>
  )
}

function HeroSection({ locale, t }: { locale: string; t: Record<string, string> }) {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated' && !!session?.user?.id
  const isLoading = status === 'loading'

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden -mt-14 md:-mt-20 pt-14 md:pt-20">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-purple-50/50 to-blue-50" />

      {/* Decorative floating circles */}
      <div className="absolute top-20 right-[10%] w-72 h-72 bg-primary-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-[5%] w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-[30%] w-48 h-48 bg-pink-200/20 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="max-w-xl"
          >
            {/* Pill badge */}
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5 bg-party-green/10 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-party-green/20"
            >
              <SparklesIcon className="w-4 h-4" />
              {locale === 'zh' ? '100% 免费' : '100% Free'}
            </motion.span>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 mb-5 leading-[1.1] tracking-tight">
              {t.heroH1Line1}
              <br />
              <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                {t.heroH1Line2}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-500 mb-8 leading-relaxed max-w-md">
              {t.heroSubtitle}
            </p>

            {/* CTA Buttons */}
            {isLoading ? (
              <div className="flex items-center gap-3">
                <LoadingSpinner size="md" />
              </div>
            ) : isAuthenticated ? (
              <div className="flex flex-wrap gap-4">
                <Link href={`/${locale}/party/new`} className="btn btn-primary btn-lg px-8 font-semibold">
                  {t.createNewParty}
                </Link>
                <Link href={`/${locale}/dashboard`} className="btn btn-secondary btn-lg px-8 font-semibold">
                  {t.goToDashboard}
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                <Link href={`/${locale}/register`} className="btn btn-primary btn-lg px-8 font-semibold">
                  {t.getStartedFree}
                </Link>
                <Link href={`/${locale}/login`} className="btn btn-secondary btn-lg px-8 font-semibold">
                  {locale === 'zh' ? '我收到了邀请' : 'I Got an Invite'}
                </Link>
              </div>
            )}
          </motion.div>

          {/* Right: Floating invitation card preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="hidden lg:flex justify-center items-center relative"
          >
            {/* Back card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-4 top-8 w-[280px] bg-white rounded-2xl shadow-xl p-6 rotate-6 border border-neutral-100"
            >
              <div className="w-full h-48 bg-gradient-to-br from-party-pink/20 to-primary-100 rounded-xl mb-4" />
              <div className="h-4 bg-neutral-100 rounded-full w-3/4 mb-2" />
              <div className="h-3 bg-neutral-100 rounded-full w-1/2" />
            </motion.div>

            {/* Front card */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 w-[300px] bg-white rounded-2xl shadow-2xl shadow-primary-500/10 p-6 -rotate-3 border border-neutral-100"
            >
              <div className="w-full h-52 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-center text-white">
                  <p className="text-sm font-medium opacity-80">{locale === 'zh' ? '您被邀请参加' : "You're invited to"}</p>
                  <p className="text-2xl font-display font-bold mt-1">Emma&apos;s 6th</p>
                  <p className="text-lg font-display font-bold">{locale === 'zh' ? '生日派对' : 'Birthday!'}</p>
                  <p className="text-xs mt-2 opacity-70">🦖 {locale === 'zh' ? '恐龙主题' : 'Dinosaur Theme'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <ClockIcon className="w-4 h-4 text-primary-500" />
                  <span>Mar 15, 2026 · 2:00 PM</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <span className="text-primary-500">📍</span>
                  <span>Sunshine Park</span>
                </div>
              </div>
              <div className="w-full mt-4 bg-party-green text-white py-2.5 rounded-xl font-semibold text-sm text-center pointer-events-none select-none">
                {locale === 'zh' ? '✓ 我们来！' : "✓ We'll be there!"}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function BentoSection({ locale, t }: { locale: string; t: Record<string, string> }) {
  return (
    <section className="section-spacing">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {t.featuresTitle}
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              {t.featuresSubtitle}
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto" staggerDelay={0.08}>
          {/* Large card: QR RSVP */}
          <StaggerItem className="col-span-2 row-span-2">
            <Link href={`/${locale}/features/qr-code-rsvp`} className="block h-full">
              <motion.div
                whileHover={{ scale: 1.01, y: -2 }}
                className="h-full bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-7 text-white relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <GradientIcon
                  icon={<QrCodeIcon className="w-7 h-7 text-white" />}
                  gradient="from-white/20 to-white/10"
                  shadowColor="shadow-black/10"
                />
                <h3 className="text-xl font-bold mt-5 mb-2">{t.qrCodeTitle}</h3>
                <p className="text-primary-100 text-sm leading-relaxed">{t.qrCodeDesc}</p>
                {/* Mini UI mockup */}
                <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="w-24 h-24 mx-auto bg-white/20 rounded-lg flex items-center justify-center mb-3">
                    <QrCodeIcon className="w-16 h-16 text-white/60" />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{locale === 'zh' ? '扫一扫' : 'Scan'}</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{locale === 'zh' ? '秒回复' : 'RSVP'}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </StaggerItem>

          {/* Small: Dinosaur theme */}
          <StaggerItem>
            <Link href={`/${locale}/templates/dinosaur-birthday-party`}>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-5 h-full border border-emerald-100 cursor-pointer group"
              >
                <span className="text-3xl">🦖</span>
                <h3 className="text-sm font-bold text-neutral-800 mt-3 group-hover:text-emerald-700 transition-colors">{t.dinosaurTitle}</h3>
                <p className="text-xs text-neutral-500 mt-1">{t.dinosaurDesc}</p>
              </motion.div>
            </Link>
          </StaggerItem>

          {/* Small: Princess theme */}
          <StaggerItem>
            <Link href={`/${locale}/templates/princess-birthday-party`}>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-2xl p-5 h-full border border-pink-100 cursor-pointer group"
              >
                <span className="text-3xl">👸</span>
                <h3 className="text-sm font-bold text-neutral-800 mt-3 group-hover:text-pink-700 transition-colors">{t.princessTitle}</h3>
                <p className="text-xs text-neutral-500 mt-1">{t.princessDesc}</p>
              </motion.div>
            </Link>
          </StaggerItem>

          {/* Small: Guest Tracking */}
          <StaggerItem>
            <Link href={`/${locale}/features/guest-tracking`}>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-2xl p-5 h-full border border-blue-100 cursor-pointer group"
              >
                <GradientIcon
                  icon={<UserGroupIcon className="w-5 h-5 text-white" />}
                  gradient="from-blue-400 to-blue-600"
                  shadowColor="shadow-blue-500/25"
                  size="sm"
                />
                <h3 className="text-sm font-bold text-neutral-800 mt-3 group-hover:text-blue-700 transition-colors">{t.guestTrackingTitle}</h3>
                <p className="text-xs text-neutral-500 mt-1">{t.guestTrackingDesc}</p>
              </motion.div>
            </Link>
          </StaggerItem>

          {/* Small: Auto Reminders */}
          <StaggerItem>
            <Link href={`/${locale}/features/automatic-reminders`}>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl p-5 h-full border border-amber-100 cursor-pointer group"
              >
                <GradientIcon
                  icon={<BellAlertIcon className="w-5 h-5 text-white" />}
                  gradient="from-amber-400 to-orange-500"
                  shadowColor="shadow-amber-500/25"
                  size="sm"
                />
                <h3 className="text-sm font-bold text-neutral-800 mt-3 group-hover:text-amber-700 transition-colors">{t.remindersTitle}</h3>
                <p className="text-xs text-neutral-500 mt-1">{t.remindersDesc}</p>
              </motion.div>
            </Link>
          </StaggerItem>

          {/* Large card: Templates */}
          <StaggerItem className="col-span-2">
            <Link href={`/${locale}/templates/unicorn-birthday-party`}>
              <motion.div
                whileHover={{ scale: 1.01, y: -2 }}
                className="bg-gradient-to-br from-fuchsia-50 via-purple-50 to-violet-100 rounded-2xl p-7 border border-purple-100 cursor-pointer group h-full"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <GradientIcon
                      icon={<PaintBrushIcon className="w-7 h-7 text-white" />}
                      gradient="from-fuchsia-400 to-purple-600"
                      shadowColor="shadow-purple-500/25"
                    />
                    <h3 className="text-xl font-bold text-neutral-800 mt-4 mb-2 group-hover:text-purple-700 transition-colors">
                      {locale === 'zh' ? '精美邀请函模板' : 'Beautiful Invitation Templates'}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {locale === 'zh' ? '多种主题模板，一键生成精美邀请函' : 'Choose from multiple themes, generate beautiful invitations instantly'}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <span className="text-2xl">🦄</span>
                    <span className="text-2xl">🦸</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </StaggerItem>

          {/* Small: No App Required */}
          <StaggerItem className="col-span-2">
            <Link href={`/${locale}/features/no-app-required`}>
              <motion.div
                whileHover={{ scale: 1.01, y: -2 }}
                className="bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-2xl p-5 border border-neutral-200 cursor-pointer group flex items-center gap-5"
              >
                <GradientIcon
                  icon={<GlobeAltIcon className="w-7 h-7 text-white" />}
                  gradient="from-neutral-600 to-neutral-800"
                  shadowColor="shadow-neutral-500/25"
                />
                <div>
                  <h3 className="text-sm font-bold text-neutral-800 group-hover:text-neutral-600 transition-colors">{t.noAppTitle}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{t.noAppDesc}</p>
                </div>
              </motion.div>
            </Link>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  )
}

function HowItWorksSection({ locale, t }: { locale: string; t: Record<string, string> }) {
  const steps = [
    {
      icon: <RocketLaunchIcon className="w-7 h-7 text-white" />,
      gradient: 'from-primary-400 to-primary-600',
      shadow: 'shadow-primary-500/25',
      title: t.step1Title,
      desc: t.step1Desc,
    },
    {
      icon: <ShareIcon className="w-7 h-7 text-white" />,
      gradient: 'from-party-blue to-blue-600',
      shadow: 'shadow-blue-500/25',
      title: t.step2Title,
      desc: t.step2Desc,
    },
    {
      icon: <ChartBarIcon className="w-7 h-7 text-white" />,
      gradient: 'from-party-green to-emerald-600',
      shadow: 'shadow-emerald-500/25',
      title: t.step3Title,
      desc: t.step3Desc,
    },
  ]

  return (
    <section className="section-spacing bg-white/60 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {t.howItWorksTitle}
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              {t.howItWorksSubtitle}
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection line (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-[2px]">
              <div className="w-full h-full border-t-2 border-dashed border-neutral-200" />
            </div>

            {steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.15}>
                <div className="text-center relative">
                  <div className="flex justify-center mb-5">
                    <GradientIcon
                      icon={step.icon}
                      gradient={step.gradient}
                      shadowColor={step.shadow}
                      size="lg"
                    />
                  </div>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 text-xs font-bold text-neutral-500 mb-3">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-xl font-bold text-neutral-900 mb-2">{step.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection({ locale, t }: { locale: string; t: Record<string, string> }) {
  const stats = locale === 'zh'
    ? [
        { value: 500, suffix: '+', label: '派对已创建' },
        { value: 2000, suffix: '+', label: '宾客已回复' },
        { value: 100, suffix: '%', label: '免费使用' },
        { value: 4.8, suffix: '★', label: '用户评分' },
      ]
    : [
        { value: 500, suffix: '+', label: 'Parties Created' },
        { value: 2000, suffix: '+', label: 'RSVPs Collected' },
        { value: 100, suffix: '%', label: 'Free to Use' },
        { value: 4.8, suffix: '★', label: 'User Rating' },
      ]

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="font-display text-3xl md:text-4xl font-extrabold text-neutral-900">
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      duration={2}
                    />
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function CTASection({ locale, t }: { locale: string; t: Record<string, string> }) {
  return (
    <section className="section-spacing relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800" />
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-5">
              {t.ctaTitle}
            </h2>
            <p className="text-lg text-primary-100 mb-8">
              {t.ctaSubtitle}
            </p>
            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center btn bg-white text-primary-700 hover:bg-neutral-50 text-lg px-8 py-4 font-bold rounded-xl shadow-lg shadow-black/10 hover:shadow-xl transition-all"
            >
              {t.getStartedFree}
            </Link>
            <p className="text-sm text-primary-200 mt-4">
              {locale === 'zh' ? '3分钟创建，永久免费' : '3 minutes to create, free forever'}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
