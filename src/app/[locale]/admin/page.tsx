'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/contexts/LanguageContext'

export default function AdminPage() {
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    router.replace(`/${locale}/admin/templates`)
  }, [router, locale])

  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  )
}
