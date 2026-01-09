import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'

  return {
    title: isZh ? '联系我们' : 'Contact Us',
    description: isZh
      ? '联系 Kid Party RSVP 团队。我们随时为您解答任何问题。'
      : 'Get in touch with the Kid Party RSVP team. We\'re here to help with any questions about party planning.',
    openGraph: {
      title: isZh ? '联系我们 - Kid Party RSVP' : 'Contact Us - Kid Party RSVP',
      url: `${SITE_URL}/${locale}/contact`,
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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
