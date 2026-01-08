'use client'

import LanguageSwitcher from './LanguageSwitcher'

export default function Footer() {
  return (
    <footer className="mt-auto py-4 border-t border-neutral-200 bg-neutral-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <p className="text-sm text-neutral-500">
          Kid Party RSVP
        </p>
        <LanguageSwitcher />
      </div>
    </footer>
  )
}
