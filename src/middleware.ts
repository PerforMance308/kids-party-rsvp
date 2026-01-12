import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/jwt-edge'
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

  // Security headers
  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // CSP with Stripe domains and payment provider domains allowed
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    // Scripts: Stripe + payment providers (Google Pay, Apple Pay)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://pay.google.com https://applepay.cdn-apple.com; " +
    // Styles: Stripe + Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    // Images: Stripe + payment providers
    "img-src 'self' data: blob: https://*.stripe.com; " +
    // Fonts: Google Fonts
    "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; " +
    // Connections: Stripe + payment providers
    "connect-src 'self' https://api.stripe.com https://pay.google.com; " +
    // Frames: Stripe
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com;"
  )

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request)
    const rateLimitKey = `${clientIP}:${pathname}`

    // More restrictive rate limiting for auth endpoints
    const isAuthEndpoint = pathname.startsWith('/api/auth/')
    const maxRequests = isAuthEndpoint ? 50 : 100
    const windowMs = isAuthEndpoint ? 60000 : 60000 // 1 minute

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
  const protectedRoutes = ['/party/new', '/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Public routes that should redirect if authenticated
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Check for NextAuth session token
  const token = await getToken({ req: request })
  const user = token ? { userId: token.userId as string, email: token.email as string } : null

  // Detect locale from pathname
  const pathnameLocale = pathname.split('/')[1]
  const currentLocale = ['zh', 'en'].includes(pathnameLocale) ? pathnameLocale : 'zh'

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