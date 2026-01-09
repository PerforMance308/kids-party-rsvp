'use client'

import Link from 'next/link'
import Image from 'next/image'
import LanguageSwitcher from './LanguageSwitcher'
import { useLocale } from '@/contexts/LanguageContext'

export default function Footer() {
  const locale = useLocale()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <Image
                src="/logo.png"
                alt="Kid Party RSVP"
                width={150}
                height={38}
                className="h-8 w-auto object-contain brightness-90 grayscale-[0.2]"
              />
            </div>
            <p className="text-sm text-neutral-600">
              Making party planning easier for parents everywhere. Create beautiful invitations, manage RSVPs, and celebrate together.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-2">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href={`/${locale}`} className="text-neutral-600 hover:text-primary-600">
                  Home
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/dashboard`} className="text-neutral-600 hover:text-primary-600">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-neutral-600 hover:text-primary-600">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-2">Legal</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href={`/${locale}/terms`} className="text-neutral-600 hover:text-primary-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-neutral-600 hover:text-primary-600">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-sm text-neutral-500">
            &copy; {currentYear} Kid Party RSVP. All rights reserved.
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  )
}
