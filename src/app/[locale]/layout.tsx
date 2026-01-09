import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Providers from '@/components/SessionProvider'
import { ToastContainer } from '@/components/ToastContainer'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { generatePageMetadata, generateFAQSchema, SITE_URL, SITE_NAME, SEO_KEYWORDS } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const loc = locale as 'en' | 'zh'

  return {
    title: {
      default: loc === 'zh'
        ? `${SITE_NAME} - 轻松管理儿童生日派对邀请与回复`
        : `${SITE_NAME} - Easy Kids Birthday Party Invitations & RSVP`,
      template: `%s | ${SITE_NAME}`,
    },
    description: loc === 'zh'
      ? '为孩子的生日派对创建精美的电子邀请函。支持二维码回复、自动提醒、宾客追踪和照片分享。免费开始策划！'
      : 'Create beautiful digital invitations for your child\'s birthday party. QR code RSVPs, automatic reminders, guest tracking, and photo sharing.',
    keywords: SEO_KEYWORDS[loc]?.join(', ') || SEO_KEYWORDS.en.join(', '),
    openGraph: {
      locale: loc === 'zh' ? 'zh_CN' : 'en_US',
      alternateLocale: loc === 'zh' ? 'en_US' : 'zh_CN',
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

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const loc = locale as 'en' | 'zh'

  return (
    <LanguageProvider locale={loc}>
      <Providers>
        {/* FAQ Structured Data for home pages */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFAQSchema(loc)),
          }}
        />
        <div className="min-h-screen flex flex-col">
          <Header />
          {children}
          <Footer />
          <ToastContainer />
        </div>
      </Providers>
    </LanguageProvider>
  )
}
