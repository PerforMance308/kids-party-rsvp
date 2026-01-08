'use client'

import { useLocale } from '@/contexts/LanguageContext'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const switchLanguage = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '')
    const newPath = `/${newLocale}${pathWithoutLocale}`
    console.log('Switching language:', { from: locale, to: newLocale, currentPath: pathname, newPath })
    router.push(newPath as any)
    setIsOpen(false)
  }

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 md:px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        aria-label="Switch Language"
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span className="hidden md:inline text-sm">{currentLanguage.name}</span>
        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown - 往上弹出 */}
          <div className="absolute right-0 bottom-full mb-2 py-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 min-w-[120px]">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => switchLanguage(language.code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2 ${locale === language.code ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                  }`}
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
                {locale === language.code && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}