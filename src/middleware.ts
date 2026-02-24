import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimit, getClientIP } from '@/lib/security'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle locale redirects at server level (SEO-friendly)
  // Redirect root to default locale
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/en'
    return NextResponse.redirect(url, { status: 308 }) // 308 = Permanent Redirect
  }

  // Redirect /rsvp/[token] to /en/rsvp/[token]
  const rsvpMatch = pathname.match(/^\/rsvp\/([^\/]+)$/)
  if (rsvpMatch) {
    const url = request.nextUrl.clone()
    url.pathname = `/en/rsvp/${rsvpMatch[1]}`
    return NextResponse.redirect(url, { status: 308 })
  }

  // Detect locale from pathname for html lang attribute
  const pathnameLocale = pathname.split('/')[1]
  const currentLocale = ['zh', 'en'].includes(pathnameLocale) ? pathnameLocale : 'en'

  // Set locale as request header so Server Components can read it via headers()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', currentLocale)

  // Security headers
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // CSP with Stripe domains and payment provider domains allowed
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    // Scripts: Stripe + payment providers (Google Pay, Apple Pay) + Google Maps Places
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://pay.google.com https://applepay.cdn-apple.com https://maps.googleapis.com; " +
    // Styles: Stripe + Google Fonts + Google Maps UI
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com; " +
    // Images: Stripe + payment providers + Google Maps tiles/icons
    "img-src 'self' data: blob: https://*.stripe.com https://maps.gstatic.com https://maps.googleapis.com; " +
    // Fonts: Google Fonts + Google Maps
    "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; " +
    // Connections: Stripe + payment providers + Google Maps Places API
    "connect-src 'self' https://api.stripe.com https://pay.google.com https://maps.googleapis.com; " +
    // Frames: Stripe + Google Maps embeds
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.google.com https://maps.google.com;"
  )

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request)
    const rateLimitKey = `${clientIP}:${pathname}`

    // Passive auth endpoints (session check, csrf, providers) are called
    // frequently by NextAuth client — use a higher limit so normal usage
    // (HMR, window focus, multiple tabs) never triggers 429.
    // Sensitive write endpoints (sign-in, sign-out, callback) get stricter limits.
    const isPassiveAuthEndpoint =
      pathname === '/api/auth/session' ||
      pathname === '/api/auth/csrf' ||
      pathname === '/api/auth/providers'
    const isSensitiveAuthEndpoint =
      pathname.startsWith('/api/auth/signin') ||
      pathname.startsWith('/api/auth/signout') ||
      pathname.startsWith('/api/auth/callback')

    const maxRequests = isSensitiveAuthEndpoint ? 10 : isPassiveAuthEndpoint ? 120 : 100
    const windowMs = 60000 // 1 minute

    if (!rateLimit(rateLimitKey, maxRequests, windowMs)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Skip further processing for API routes to avoid overhead
    // API routes handle their own authentication via route handlers
    return response
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/party/new',
    '/dashboard',
    '/children',
    '/invitations',
    '/party/',
  ]
  const isProtectedRoute = protectedRoutes.some(route => {
    // Match locale-prefixed paths: /en/dashboard, /zh/dashboard, etc.
    const localePattern = new RegExp(`^/(en|zh)${route}`)
    return localePattern.test(pathname) || pathname.startsWith(route)
  })

  // Public routes that should redirect if authenticated
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(route => pathname.endsWith(route))

  // Only call getToken() when necessary (PERF-05: avoid overhead on every public page)
  let token = null
  let user = null
  if (isProtectedRoute || isPublicRoute) {
    token = await getToken({
      req: request,
      cookieName: 'next-auth.session-token',
      secret: process.env.NEXTAUTH_SECRET,
    })
    user = token ? { userId: token.userId as string, email: token.email as string } : null
  }

  // Use locale already detected above

  if (isProtectedRoute && !user) {
    const loginUrl = new URL(`/${currentLocale}/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)

    const redirectResponse = NextResponse.redirect(loginUrl)

    // Copy security headers to redirect response
    response.headers.forEach((value, key) => {
      redirectResponse.headers.set(key, value)
    })

    return redirectResponse
  }

  if (isPublicRoute && user) {
    const dashboardUrl = new URL(`/${currentLocale}/dashboard`, request.url)
    const redirectResponse = NextResponse.redirect(dashboardUrl)

    // Copy security headers to redirect response
    response.headers.forEach((value, key) => {
      redirectResponse.headers.set(key, value)
    })

    return redirectResponse
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
