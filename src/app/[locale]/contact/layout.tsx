import { Metadata } from 'next'
import { SITE_URL, SITE_NAME, generateBreadcrumbSchema } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'

  return {
    title: isZh ? '联系我们' : 'Contact Us',
    description: isZh
      ? '联系 Kid Party RSVP 团队。我们随时为您解答任何问题、提供技术支持或收集您的反馈。24-48小时内回复。'
      : 'Get in touch with the Kid Party RSVP team. We\'re here to help with any questions, technical support, or feedback about our party invitation platform. Response within 24-48 hours.',
    keywords: isZh
      ? '联系我们, 客户支持, Kid Party RSVP 帮助, 技术支持, 反馈'
      : 'contact us, customer support, Kid Party RSVP help, technical support, feedback, party planning support',
    openGraph: {
      title: isZh ? '联系我们 - Kid Party RSVP' : 'Contact Us - Kid Party RSVP',
      description: isZh
        ? '联系我们获取帮助和支持。24-48小时内回复。'
        : 'Contact us for help and support. Response within 24-48 hours.',
      url: `${SITE_URL}/${locale}/contact`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: isZh ? '联系我们 - Kid Party RSVP' : 'Contact Us - Kid Party RSVP',
      description: isZh ? '联系我们获取帮助和支持' : 'Contact us for help and support',
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/contact`,
      languages: {
        'en': `${SITE_URL}/en/contact`,
        'zh': `${SITE_URL}/zh/contact`,
      },
    },
  }
}

export default async function ContactLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isZh = locale === 'zh'

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: isZh ? '首页' : 'Home', url: `${SITE_URL}/${locale}` },
    { name: isZh ? '联系我们' : 'Contact Us', url: `${SITE_URL}/${locale}/contact` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  )
}
