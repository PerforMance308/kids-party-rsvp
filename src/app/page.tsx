import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect to English version (default language)
  redirect('/en')
}