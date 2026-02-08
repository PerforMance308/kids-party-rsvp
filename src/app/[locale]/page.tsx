import Image from 'next/image'
import Link from 'next/link'
import HeroCTA from '@/components/HeroCTA'
import FeatureChips from '@/components/FeatureChips'

type Props = {
  params: Promise<{ locale: string }>
}

// Static translations for server rendering
const translations = {
  en: {
    heroH1Line1: 'Create Kids Birthday Party',
    heroH1Line2: 'Invitations with Easy Online RSVP',
    heroSubtitle: 'Beautiful invitations, QR code RSVPs, real-time guest tracking',
    bannerAlt: 'Kids Birthday Party Invitations',
    loading: 'Loading...',
    createNewParty: 'Create New Party',
    goToDashboard: 'Go to Dashboard',
    getStartedFree: 'Get Started Free',
    popularThemesTitle: 'Popular Kids Birthday Party Themes',
    popularThemesSubtitle: "Choose your child's favorite theme and create a unique party invitation",
    dinosaurTitle: 'Dinosaur Birthday Party',
    dinosaurDesc: 'Perfect for dino-loving kids',
    princessTitle: 'Princess Birthday Party',
    princessDesc: 'Magical princess celebrations',
    unicornTitle: 'Unicorn Birthday Party',
    unicornDesc: 'Rainbow unicorn magic',
    superheroTitle: 'Superhero Birthday Party',
    superheroDesc: 'Action-packed hero parties',
    featuresTitle: 'Key RSVP Features for Kids Parties',
    featuresSubtitle: "Smart features designed specifically for kids' birthday parties",
    qrCodeTitle: 'QR Code RSVP',
    qrCodeDesc: 'Scan to respond instantly',
    guestTrackingTitle: 'Guest Tracking',
    guestTrackingDesc: 'Real-time response tracking',
    remindersTitle: 'Automatic Reminders',
    remindersDesc: 'Auto-remind pending guests',
    noAppTitle: 'No App Required',
    noAppDesc: 'Works in any browser',
    whatIsTitle: 'What is KidsPartyRSVP?',
    whatIsP1: 'KidsPartyRSVP is an online tool designed to help parents create beautiful kids birthday party invitations and manage RSVPs effortlessly. Whether you\'re planning a dinosaur birthday party, princess party, unicorn celebration, or superhero bash, our platform provides stunning invitation templates that make your party stand out.',
    whatIsP2: 'With our QR code RSVP feature, guests can respond to invitations instantly by scanning a code - no app download required. The system automatically tracks guest responses in real-time, including headcount, allergy information, and contact details. Automatic reminder notifications are sent to guests who haven\'t responded, ensuring you have an accurate guest count before the big day.',
    whatIsP3: 'Say goodbye to messy group chats and paper invitations. KidsPartyRSVP makes party planning simple, efficient, and fun. Core features are completely free, and you can create a professional party invitation in just minutes.',
    howItWorksTitle: 'How Kids Party RSVP Works',
    howItWorksSubtitle: 'Create professional birthday party invitations in minutes, no design skills needed',
    step1Title: 'Create Your Party',
    step1Desc: 'Enter party details: date, time, location, and theme. Choose from beautiful invitation templates.',
    step2Title: 'Share Invitations',
    step2Desc: 'Share via QR code, link, or email. Guests scan to RSVP instantly - no app download required.',
    step3Title: 'Track RSVPs',
    step3Desc: "View responses, allergies, and contact info in real-time. Auto-remind guests who haven't replied.",
    whyChooseTitle: 'Why Parents Love Kids Party RSVP',
    freeTitle: '100% Free to Start',
    freeDesc: 'Core features are free forever. Create invitations, QR code RSVPs, guest tracking - all free!',
    mobileTitle: 'Mobile-Friendly Design',
    mobileDesc: 'Works perfectly on any device. Parents can easily RSVP right from their phones.',
    privacyTitle: 'Privacy Protected',
    privacyDesc: 'Guest info stays private - only you can see it. We never share or sell your data.',
    timeTitle: 'Save Hours of Time',
    timeDesc: 'No more manual tracking. Auto-reminders and real-time updates make party planning effortless.',
    ctaTitle: "Ready to make your child's day special?",
    ctaSubtitle: 'Join thousands of parents who use Kid Party RSVP to plan perfect, stress-free birthday celebrations.',
  },
  zh: {
    heroH1Line1: '创建儿童生日派对邀请函',
    heroH1Line2: '轻松在线RSVP',
    heroSubtitle: '创建精美邀请函，二维码扫码回复，实时追踪宾客',
    bannerAlt: '儿童生日派对邀请函',
    loading: '加载中...',
    createNewParty: '创建新派对',
    goToDashboard: '前往仪表板',
    getStartedFree: '免费开始',
    popularThemesTitle: '热门儿童生日派对主题',
    popularThemesSubtitle: '选择您孩子喜爱的主题，创建独特的派对邀请函',
    dinosaurTitle: '恐龙生日派对',
    dinosaurDesc: '适合喜欢恐龙的小朋友',
    princessTitle: '公主生日派对',
    princessDesc: '梦幻公主主题派对',
    unicornTitle: '独角兽生日派对',
    unicornDesc: '彩虹独角兽梦幻派对',
    superheroTitle: '超级英雄生日派对',
    superheroDesc: '英雄主题冒险派对',
    featuresTitle: '儿童派对RSVP核心功能',
    featuresSubtitle: '专为儿童派对设计的智能功能',
    qrCodeTitle: '二维码RSVP',
    qrCodeDesc: '扫码即可回复邀请',
    guestTrackingTitle: '宾客追踪',
    guestTrackingDesc: '实时查看回复状态',
    remindersTitle: '自动提醒',
    remindersDesc: '自动发送回复提醒',
    noAppTitle: '无需下载APP',
    noAppDesc: '浏览器直接使用',
    whatIsTitle: '什么是 KidsPartyRSVP？',
    whatIsP1: 'KidsPartyRSVP 是一款专为家长设计的在线工具，帮助您轻松创建儿童生日派对邀请函并管理宾客回复（RSVP）。无论是恐龙主题、公主主题还是独角兽主题的生日派对，我们都提供精美的邀请函模板，让您的派对邀请脱颖而出。',
    whatIsP2: '通过二维码RSVP功能，宾客只需扫一扫即可回复邀请，无需下载任何APP。系统会自动追踪宾客回复状态，包括参加人数、过敏信息和联系方式。自动提醒功能会在派对前发送通知给尚未回复的宾客，确保您准确掌握参与人数。',
    whatIsP3: '告别繁琐的微信群统计和纸质邀请函。KidsPartyRSVP 让派对策划变得简单、高效、有趣。基础功能完全免费，几分钟内即可创建专业的派对邀请。',
    howItWorksTitle: '三步轻松搞定派对邀请',
    howItWorksSubtitle: '无需复杂操作，几分钟内创建专业的派对邀请函',
    step1Title: '创建派对',
    step1Desc: '填写派对信息：日期、时间、地点和主题。选择精美的邀请函模板。',
    step2Title: '分享邀请函',
    step2Desc: '通过二维码、链接或邮件发送邀请。宾客扫码即可回复，无需下载APP。',
    step3Title: '追踪回复',
    step3Desc: '实时查看宾客回复、过敏信息和联系方式。自动提醒未回复的宾客。',
    whyChooseTitle: '为什么选择 Kids Party RSVP？',
    freeTitle: '完全免费开始',
    freeDesc: '基础功能永久免费。创建邀请函、二维码回复、宾客追踪 - 全部免费！',
    mobileTitle: '移动端友好',
    mobileDesc: '在任何设备上完美显示。家长可以在手机上轻松回复邀请。',
    privacyTitle: '隐私保护',
    privacyDesc: '宾客信息完全保密，只有派对主人可以查看。绝不分享或出售您的数据。',
    timeTitle: '节省时间',
    timeDesc: '告别手动统计回复。自动提醒和实时追踪，让派对策划变得轻松。',
    ctaTitle: '准备规划您的派对了吗？',
    ctaSubtitle: '加入数千名让派对规划变得简单无压力的父母。',
  },
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = translations[locale as 'en' | 'zh'] || translations.en

  return (
    <main className="flex-1">
      {/* Hero Section with Banner */}
      <section className="relative h-[350px] md:h-[420px] lg:h-[460px] overflow-hidden">
        <Image
          src="/banner/banner.jpg"
          alt={t.bannerAlt}
          fill
          priority
          className="object-cover object-right"
          sizes="100vw"
          quality={85}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-transparent md:from-white/90 md:via-white/60 md:to-transparent" />

        <div className="relative container mx-auto px-4 h-full">
          <div className="flex items-center justify-center md:justify-start h-full">
            <div className="max-w-lg py-8 md:ml-[5%] lg:ml-[8%]">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2 leading-tight">
                {t.heroH1Line1}<br />{t.heroH1Line2}
              </h1>

              <p className="text-base md:text-lg text-neutral-600 mb-4 max-w-md">
                {t.heroSubtitle}
              </p>

              <FeatureChips locale={locale} />

              <HeroCTA
                locale={locale}
                translations={{
                  loading: t.loading,
                  createNewParty: t.createNewParty,
                  goToDashboard: t.goToDashboard,
                  getStartedFree: t.getStartedFree,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Popular Themes - SEO Internal Links */}
      <section id="popular-themes" className="section-spacing bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {t.popularThemesTitle}
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {t.popularThemesSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mx-auto max-w-7xl">
            <Link href={`/${locale}/templates/dinosaur-birthday-party`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-5xl mb-3">🦖</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {t.dinosaurTitle}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">{t.dinosaurDesc}</p>
            </Link>
            <Link href={`/${locale}/templates/princess-birthday-party`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-5xl mb-3">👸</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {t.princessTitle}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">{t.princessDesc}</p>
            </Link>
            <Link href={`/${locale}/templates/unicorn-birthday-party`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-5xl mb-3">🦄</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {t.unicornTitle}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">{t.unicornDesc}</p>
            </Link>
            <Link href={`/${locale}/templates/superhero-birthday-party`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-5xl mb-3">🦸</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {t.superheroTitle}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">{t.superheroDesc}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features - SEO Internal Links */}
      <section id="features" className="section-spacing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {t.featuresTitle}
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mx-auto max-w-7xl">
            <Link href={`/${locale}/features/qr-code-rsvp`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {t.qrCodeTitle}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">{t.qrCodeDesc}</p>
            </Link>
            <Link href={`/${locale}/features/guest-tracking`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {t.guestTrackingTitle}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">{t.guestTrackingDesc}</p>
            </Link>
            <Link href={`/${locale}/features/automatic-reminders`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-4xl mb-3">🔔</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {t.remindersTitle}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">{t.remindersDesc}</p>
            </Link>
            <Link href={`/${locale}/features/no-app-required`} className="card hover:shadow-lg transition-shadow text-center group cursor-pointer">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {t.noAppTitle}
              </h3>
              <p className="text-sm text-neutral-600 mt-2">{t.noAppDesc}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* What is KidsPartyRSVP - SEO Critical Section */}
      <section id="what-is-kidspartyrsvp" className="section-spacing bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6 text-center">
              {t.whatIsTitle}
            </h2>
            <div className="prose prose-lg max-w-none text-neutral-700 text-justify">
              <p>{t.whatIsP1}</p>
              <p>{t.whatIsP2}</p>
              <p>{t.whatIsP3}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-spacing bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {t.howItWorksTitle}
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {t.howItWorksSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-auto max-w-7xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">{t.step1Title}</h3>
              <p className="text-neutral-600">{t.step1Desc}</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">{t.step2Title}</h3>
              <p className="text-neutral-600">{t.step2Desc}</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">{t.step3Title}</h3>
              <p className="text-neutral-600">{t.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-spacing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {t.whyChooseTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto max-w-7xl">
            <div className="flex gap-4">
              <div className="text-3xl">✨</div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t.freeTitle}</h3>
                <p className="text-neutral-600">{t.freeDesc}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t.mobileTitle}</h3>
                <p className="text-neutral-600">{t.mobileDesc}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">🔐</div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t.privacyTitle}</h3>
                <p className="text-neutral-600">{t.privacyDesc}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">⏰</div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t.timeTitle}</h3>
                <p className="text-neutral-600">{t.timeDesc}</p>
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
              {t.ctaTitle}
            </h2>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              {t.ctaSubtitle}
            </p>
            <Link href={`/${locale}/register`} className="btn bg-white text-primary-600 hover:bg-neutral-50 text-lg px-8 font-semibold">
              {t.getStartedFree}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
