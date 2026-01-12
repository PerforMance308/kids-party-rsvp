import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootPage() {
  // Redirect to English version (default language)
  redirect('/en')
}