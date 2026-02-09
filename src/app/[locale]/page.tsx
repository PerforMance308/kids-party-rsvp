import HomePageClient from '@/components/HomePageClient'

type Props = {
  params: Promise<{ locale: string }>
}

// Static translations for server rendering
const translations = {
  en: {
    heroH1Line1: 'Create Kids Birthday Party',
    heroH1Line2: 'Invitations with Easy Online RSVP',
    heroSubtitle: 'Beautiful invitations, QR code RSVPs, real-time guest tracking — all free.',
    loading: 'Loading...',
    createNewParty: 'Create My Party',
    goToDashboard: 'Go to Dashboard',
    getStartedFree: 'Get Started Free',
    popularThemesTitle: 'Popular Kids Birthday Party Themes',
    popularThemesSubtitle: "Choose your child's favorite theme and create a unique party invitation",
    dinosaurTitle: 'Dinosaur Party',
    dinosaurDesc: 'Perfect for dino-loving kids',
    princessTitle: 'Princess Party',
    princessDesc: 'Magical princess celebrations',
    unicornTitle: 'Unicorn Party',
    unicornDesc: 'Rainbow unicorn magic',
    superheroTitle: 'Superhero Party',
    superheroDesc: 'Action-packed hero parties',
    featuresTitle: 'Everything You Need for Party RSVPs',
    featuresSubtitle: "Smart features designed specifically for kids' birthday parties",
    qrCodeTitle: 'QR Code RSVP',
    qrCodeDesc: 'Guests scan to respond instantly — no app download needed. The simplest way to collect RSVPs.',
    guestTrackingTitle: 'Guest Tracking',
    guestTrackingDesc: 'Real-time response tracking',
    remindersTitle: 'Auto Reminders',
    remindersDesc: 'Auto-remind pending guests',
    noAppTitle: 'No App Required',
    noAppDesc: 'Works in any browser',
    howItWorksTitle: 'How It Works',
    howItWorksSubtitle: 'Create professional birthday party invitations in minutes, no design skills needed',
    step1Title: 'Create Your Party',
    step1Desc: 'Enter party details and choose from beautiful invitation templates.',
    step2Title: 'Share Invitations',
    step2Desc: 'Share via QR code, link, or email. Guests RSVP instantly.',
    step3Title: 'Track RSVPs',
    step3Desc: 'View responses, allergies, and contact info in real-time.',
    ctaTitle: "Ready to make your child's day special?",
    ctaSubtitle: 'Join thousands of parents who use Kid Party RSVP to plan perfect, stress-free birthday celebrations.',
  },
  zh: {
    heroH1Line1: '创建儿童生日派对邀请函',
    heroH1Line2: '轻松在线RSVP',
    heroSubtitle: '精美邀请函，二维码扫码回复，实时追踪宾客 — 完全免费。',
    loading: '加载中...',
    createNewParty: '创建我的派对',
    goToDashboard: '前往仪表板',
    getStartedFree: '免费开始',
    popularThemesTitle: '热门儿童生日派对主题',
    popularThemesSubtitle: '选择您孩子喜爱的主题，创建独特的派对邀请函',
    dinosaurTitle: '恐龙派对',
    dinosaurDesc: '适合喜欢恐龙的小朋友',
    princessTitle: '公主派对',
    princessDesc: '梦幻公主主题派对',
    unicornTitle: '独角兽派对',
    unicornDesc: '彩虹独角兽梦幻派对',
    superheroTitle: '超级英雄派对',
    superheroDesc: '英雄主题冒险派对',
    featuresTitle: '派对RSVP所需一切',
    featuresSubtitle: '专为儿童派对设计的智能功能',
    qrCodeTitle: '二维码RSVP',
    qrCodeDesc: '宾客扫码即可回复 — 无需下载APP。最简单的RSVP收集方式。',
    guestTrackingTitle: '宾客追踪',
    guestTrackingDesc: '实时查看回复状态',
    remindersTitle: '自动提醒',
    remindersDesc: '自动发送回复提醒',
    noAppTitle: '无需下载APP',
    noAppDesc: '浏览器直接使用',
    howItWorksTitle: '三步轻松搞定',
    howItWorksSubtitle: '无需复杂操作，几分钟内创建专业的派对邀请函',
    step1Title: '创建派对',
    step1Desc: '填写派对信息，选择精美的邀请函模板。',
    step2Title: '分享邀请函',
    step2Desc: '通过二维码、链接或邮件发送邀请。宾客扫码即可回复。',
    step3Title: '追踪回复',
    step3Desc: '实时查看宾客回复、过敏信息和联系方式。',
    ctaTitle: '准备规划您的派对了吗？',
    ctaSubtitle: '加入数千名让派对规划变得简单无压力的父母。',
  },
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = translations[locale as 'en' | 'zh'] || translations.en

  return <HomePageClient locale={locale} t={t} />
}
