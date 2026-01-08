import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the pathname already has a supported locale
  const locales = ['/en', '/zh']
  const hasLocale = locales.some(
    (locale) => pathname === locale || pathname.startsWith(`${locale}/`)
  )

  // Redirect if there is no locale
  if (!hasLocale) {
    const locale = 'en' // Default locale
    return NextResponse.redirect(
      new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url)
    )
  }
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}