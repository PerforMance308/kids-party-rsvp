'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface FeatureChipsProps {
  locale: string
}

export default function FeatureChips({ locale }: FeatureChipsProps) {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated' && !!session?.user?.id
  const href = (isAuthenticated ? `/${locale}/party/new` : `/${locale}/register`) as any

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <Link
        href={href}
        className="inline-flex items-center gap-1 bg-primary-100/80 text-primary-700 px-2.5 py-1 rounded-full text-xs font-medium hover:bg-primary-200/80 transition-colors cursor-pointer"
      >
        {locale === 'zh' ? '扫码回复' : 'QR RSVP'}
      </Link>
      <Link
        href={href}
        className="inline-flex items-center gap-1 bg-primary-100/80 text-primary-700 px-2.5 py-1 rounded-full text-xs font-medium hover:bg-primary-200/80 transition-colors cursor-pointer"
      >
        {locale === 'zh' ? '精美模板' : 'Templates'}
      </Link>
      <Link
        href={href}
        className="inline-flex items-center gap-1 bg-primary-100/80 text-primary-700 px-2.5 py-1 rounded-full text-xs font-medium hover:bg-primary-200/80 transition-colors cursor-pointer"
      >
        {locale === 'zh' ? '免费使用' : 'Free'}
      </Link>
    </div>
  )
}
