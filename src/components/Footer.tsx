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
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <Image
                src="/logo.png"
                alt="Kid Party RSVP"
                width={180}
                height={45}
                className="h-12 w-auto object-contain brightness-95"
                priority={false}
              />
            </div>
            <p className="text-sm text-neutral-600 mb-4">
              {t('footer.description')}
            </p>
            {/* Social Media Links */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">{t('footer.followUs')}:</span>
              <a
                href="https://twitter.com/kidpartyrsvp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-neutral-400 hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://facebook.com/kidpartyrsvp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-neutral-400 hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://instagram.com/kidpartyrsvp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-neutral-400 hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-2">{t('footer.quickLinks')}</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href={`/${locale}`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/dashboard`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  {t('footer.dashboard')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/register`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  {locale === 'zh' ? '免费注册' : 'Sign Up Free'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Templates - SEO important */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-2">{locale === 'zh' ? '派对模板' : 'Party Templates'}</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href={`/${locale}/templates/dinosaur-birthday-party`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  🦖 {locale === 'zh' ? '恐龙派对' : 'Dinosaur Party'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/templates/princess-birthday-party`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  👸 {locale === 'zh' ? '公主派对' : 'Princess Party'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/templates/unicorn-birthday-party`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  🦄 {locale === 'zh' ? '独角兽派对' : 'Unicorn Party'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/templates/superhero-birthday-party`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  🦸 {locale === 'zh' ? '超级英雄派对' : 'Superhero Party'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Features - SEO important */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-2">{locale === 'zh' ? '功能' : 'Features'}</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href={`/${locale}/features/qr-code-rsvp`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  {locale === 'zh' ? '二维码RSVP' : 'QR Code RSVP'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/features/guest-tracking`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  {locale === 'zh' ? '宾客追踪' : 'Guest Tracking'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/features/automatic-reminders`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  {locale === 'zh' ? '自动提醒' : 'Auto Reminders'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/features/no-app-required`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  {locale === 'zh' ? '无需APP' : 'No App Required'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-2">{t('footer.legal')}</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href={`/${locale}/terms`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-neutral-600 hover:text-primary-600 transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-sm text-neutral-500">
            &copy; {currentYear} {t('footer.copyright')}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  )
}
