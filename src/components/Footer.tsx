'use client'

import Link from 'next/link'
import Image from 'next/image'
import LanguageSwitcher from './LanguageSwitcher'
import { useLocale, useLanguage } from '@/contexts/LanguageContext'

export default function Footer() {
  const locale = useLocale()
  const { t } = useLanguage()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-neutral-900 text-neutral-300">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Image
                src="/logo.png"
                alt="Kid Party RSVP"
                width={180}
                height={45}
                className="h-12 w-auto object-contain brightness-110 invert"
                priority={false}
              />
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-3">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}`} className="text-neutral-400 hover:text-white transition-colors">
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/dashboard`} className="text-neutral-400 hover:text-white transition-colors">
                  {t('footer.dashboard')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/templates/dinosaur-birthday-party`} className="text-neutral-400 hover:text-white transition-colors">
                  {locale === 'zh' ? '派对模板' : 'Party Templates'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-neutral-400 hover:text-white transition-colors">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-3">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/terms`} className="text-neutral-400 hover:text-white transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-neutral-400 hover:text-white transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-neutral-500">
            &copy; {currentYear} {t('footer.copyright')}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  )
}
