import { Metadata } from 'next'

// Base URL - production domain
export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kidspartyrsvp.com'
export const SITE_NAME = 'Kid Party RSVP'

// SEO keywords by language - optimized for search ranking
export const SEO_KEYWORDS = {
  en: [
    // Primary keywords
    'kids party RSVP',
    'kids birthday party RSVP',
    'children party invitation',
    'birthday party RSVP online',
    // Feature keywords
    'QR code party invitation',
    'digital birthday invitation',
    'party guest management',
    'RSVP tracking app',
    'birthday party planner free',
    // Long-tail keywords
    'free kids birthday party invitation maker',
    'online RSVP for birthday party',
    'children birthday party organizer',
    'party invitation with QR code',
    'track party RSVPs online',
    'send birthday party invitations',
    'manage party guest list',
    'automatic party reminders',
    'kids party planning app',
    'birthday invitation creator',
  ],
  zh: [
    // 主要关键词
    '儿童派对RSVP',
    '儿童生日派对',
    '孩子生日邀请函',
    '派对邀请回复',
    // 功能关键词
    '二维码派对邀请',
    '电子生日邀请函',
    '派对宾客管理',
    '生日派对策划',
    // 长尾关键词
    '免费儿童派对邀请制作',
    '在线派对回复管理',
    '儿童生日派对策划工具',
    '派对邀请函制作',
    '宾客回复追踪',
    '发送生日派对邀请',
    '派对宾客名单管理',
    '自动派对提醒',
    '儿童派对策划应用',
    '生日邀请函生成器',
  ],
}

// Page-specific metadata configurations
export const PAGE_METADATA = {
  home: {
    en: {
      title: 'Kids Party RSVP - Free Birthday Party Invitations & Online RSVP Tracking',
      description: 'Create beautiful digital birthday invitations for kids parties. Free QR code RSVPs, automatic reminders, real-time guest tracking, and photo sharing. The easiest way to manage your child\'s birthday party guest list online.',
    },
    zh: {
      title: 'Kids Party RSVP - 免费儿童生日派对邀请函与在线回复追踪',
      description: '为孩子的生日派对创建精美的电子邀请函。免费二维码回复、自动提醒、实时宾客追踪和照片分享。最简单的儿童派对宾客管理工具。',
    },
  },
  login: {
    en: {
      title: 'Login - Kid Party RSVP',
      description: 'Sign in to manage your kids party invitations and RSVPs. Track guests, send reminders, and share party photos.',
    },
    zh: {
      title: '登录 - Kid Party RSVP',
      description: '登录管理您的儿童派对邀请和回复。追踪宾客、发送提醒、分享派对照片。',
    },
  },
  register: {
    en: {
      title: 'Sign Up Free - Kid Party RSVP',
      description: 'Create your free account and start planning amazing birthday parties for your kids. Easy invitations, QR code RSVPs, and more!',
    },
    zh: {
      title: '免费注册 - Kid Party RSVP',
      description: '创建免费账户，开始为孩子策划精彩的生日派对。简单邀请、二维码回复等功能！',
    },
  },
  dashboard: {
    en: {
      title: 'Dashboard - Kid Party RSVP',
      description: 'Manage all your kids party invitations in one place. View RSVPs, track guests, and organize multiple parties.',
    },
    zh: {
      title: '仪表板 - Kid Party RSVP',
      description: '在一个地方管理所有儿童派对邀请。查看回复、追踪宾客、管理多个派对。',
    },
  },
  newParty: {
    en: {
      title: 'Create New Party - Kid Party RSVP',
      description: 'Start planning your child\'s birthday party. Create beautiful invitations with QR codes and easy RSVP tracking.',
    },
    zh: {
      title: '创建新派对 - Kid Party RSVP',
      description: '开始策划孩子的生日派对。创建带有二维码的精美邀请函，轻松追踪回复。',
    },
  },
  terms: {
    en: {
      title: 'Terms of Service - Kid Party RSVP',
      description: 'Read our terms of service for using Kid Party RSVP platform.',
    },
    zh: {
      title: '服务条款 - Kid Party RSVP',
      description: '阅读 Kid Party RSVP 平台的服务条款。',
    },
  },
  privacy: {
    en: {
      title: 'Privacy Policy - Kid Party RSVP',
      description: 'Learn how we protect your privacy and handle your data at Kid Party RSVP.',
    },
    zh: {
      title: '隐私政策 - Kid Party RSVP',
      description: '了解 Kid Party RSVP 如何保护您的隐私和处理您的数据。',
    },
  },
  contact: {
    en: {
      title: 'Contact Us - Kid Party RSVP',
      description: 'Get in touch with the Kid Party RSVP team. We\'re here to help with any questions.',
    },
    zh: {
      title: '联系我们 - Kid Party RSVP',
      description: '联系 Kid Party RSVP 团队。我们随时为您解答任何问题。',
    },
  },
}

// Generate metadata for a specific page
export function generatePageMetadata(
  page: keyof typeof PAGE_METADATA,
  locale: 'en' | 'zh' = 'en'
): Metadata {
  const pageData = PAGE_METADATA[page]?.[locale] || PAGE_METADATA[page]?.en
  const keywords = SEO_KEYWORDS[locale] || SEO_KEYWORDS.en

  return {
    title: pageData?.title,
    description: pageData?.description,
    keywords: keywords.join(', '),
    openGraph: {
      title: pageData?.title,
      description: pageData?.description,
      url: `${SITE_URL}/${locale}`,
      siteName: SITE_NAME,
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/logo.png`,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageData?.title,
      description: pageData?.description,
      images: [`${SITE_URL}/logo.png`],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        'en': `${SITE_URL}/en`,
        'zh': `${SITE_URL}/zh`,
        'x-default': `${SITE_URL}/en`,
      },
    },
  }
}

// JSON-LD Structured Data generators
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Easy kids birthday party invitations and RSVP management platform',
    sameAs: [
      'https://twitter.com/kidpartyrsvp',
      'https://facebook.com/kidpartyrsvp',
      'https://instagram.com/kidpartyrsvp',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Chinese'],
    },
  }
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Create beautiful digital invitations for kids birthday parties with QR code RSVPs',
    inLanguage: ['en', 'zh'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Free kids birthday party invitation and RSVP management tool',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Digital party invitations',
      'QR code RSVPs',
      'Automatic reminders',
      'Guest tracking',
      'Photo sharing',
      'Multi-language support',
    ],
  }
}

export function generateFAQSchema(locale: 'en' | 'zh' = 'en') {
  const faqs = {
    en: [
      {
        question: 'Is Kid Party RSVP free to use?',
        answer: 'Yes! Basic features including creating invitations, QR code RSVPs, and guest tracking are completely free. Premium templates and photo sharing are available for a small fee.',
      },
      {
        question: 'How do guests respond to party invitations?',
        answer: 'Guests can scan the QR code on the invitation or click the RSVP link. They\'ll fill out a simple form with their response, number of children attending, and any allergies or notes.',
      },
      {
        question: 'Can I send automatic reminders to guests?',
        answer: 'Yes! You can set up automatic email reminders to be sent to guests who haven\'t responded yet, helping you get more RSVPs.',
      },
      {
        question: 'Is my data safe and private?',
        answer: 'Absolutely. We use secure encryption and never share your personal information. Guest data is only visible to the party host.',
      },
    ],
    zh: [
      {
        question: 'Kid Party RSVP 是免费的吗？',
        answer: '是的！基本功能包括创建邀请函、二维码回复和宾客追踪完全免费。高级模板和照片分享需要少量费用。',
      },
      {
        question: '宾客如何回复派对邀请？',
        answer: '宾客可以扫描邀请函上的二维码或点击回复链接。他们将填写一个简单的表格，包括回复、参加的孩子数量、过敏信息或备注。',
      },
      {
        question: '我可以自动发送提醒给宾客吗？',
        answer: '可以！您可以设置自动邮件提醒，发送给尚未回复的宾客，帮助您获得更多回复。',
      },
      {
        question: '我的数据安全和隐私吗？',
        answer: '绝对安全。我们使用安全加密，从不分享您的个人信息。宾客数据仅派对主人可见。',
      },
    ],
  }

  const faqItems = faqs[locale] || faqs.en

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// Generate Event schema for party pages
export function generateEventSchema(party: {
  name: string
  description: string
  startDate: string
  location?: string
  organizer: string
  image?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: party.name,
    description: party.description,
    startDate: party.startDate,
    ...(party.location && {
      location: {
        '@type': 'Place',
        name: party.location,
      },
    }),
    organizer: {
      '@type': 'Person',
      name: party.organizer,
    },
    ...(party.image && {
      image: party.image,
    }),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: SITE_URL,
    },
  }
}

// Generate Article schema for blog-style content
export function generateArticleSchema(article: {
  title: string
  description: string
  datePublished: string
  dateModified?: string
  author: string
  image?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Organization',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    ...(article.image && {
      image: article.image,
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  }
}

// Generate LocalBusiness schema (useful for contact page)
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_NAME,
    image: `${SITE_URL}/logo.png`,
    '@id': SITE_URL,
    url: SITE_URL,
    telephone: '',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '',
      addressLocality: '',
      addressRegion: '',
      postalCode: '',
      addressCountry: 'US',
    },
    priceRange: 'Free',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
  }
}
