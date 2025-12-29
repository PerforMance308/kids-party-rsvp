import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/jwt-edge'
import { getToken } from 'next-auth/jwt'
import { rateLimit, getClientIP } from '@/lib/security'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Security headers
  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self';"
  )

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request)
    const rateLimitKey = `${clientIP}:${pathname}`

    // More restrictive rate limiting for auth endpoints
    const isAuthEndpoint = pathname.startsWith('/api/auth/')
    const maxRequests = isAuthEndpoint ? 5 : 20
    const windowMs = isAuthEndpoint ? 60000 : 60000 // 1 minute

    if (!rateLimit(rateLimitKey, maxRequests, windowMs)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
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

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    const redirectResponse = NextResponse.redirect(loginUrl)

    // Copy security headers to redirect response
    response.headers.forEach((value, key) => {
      redirectResponse.headers.set(key, value)
    })

    return redirectResponse
  }

  if (isPublicRoute && user) {
    const dashboardUrl = new URL('/dashboard', request.url)
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