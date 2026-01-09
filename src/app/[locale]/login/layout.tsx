import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'

  return {
    title: isZh ? '登录' : 'Login',
    description: isZh
      ? '登录管理您的儿童派对邀请和回复。追踪宾客、发送提醒、分享派对照片。'
      : 'Sign in to manage your kids party invitations and RSVPs. Track guests, send reminders, and share party photos.',
    openGraph: {
      title: isZh ? '登录 - Kid Party RSVP' : 'Login - Kid Party RSVP',
      url: `${SITE_URL}/${locale}/login`,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/login`,
      languages: {
        'en': `${SITE_URL}/en/login`,
        'zh': `${SITE_URL}/zh/login`,
      },
    },
  }
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
