import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'

  return {
    title: isZh ? '免费注册' : 'Sign Up Free',
    description: isZh
      ? '创建免费账户，开始为孩子策划精彩的生日派对。简单邀请、二维码回复等功能！'
      : 'Create your free account and start planning amazing birthday parties for your kids. Easy invitations, QR code RSVPs, and more!',
    openGraph: {
      title: isZh ? '免费注册 - Kid Party RSVP' : 'Sign Up Free - Kid Party RSVP',
      url: `${SITE_URL}/${locale}/register`,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/register`,
      languages: {
        'en': `${SITE_URL}/en/register`,
        'zh': `${SITE_URL}/zh/register`,
      },
    },
  }
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
