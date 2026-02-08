import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const locales = ['en', 'zh']
  // Private paths that should not be indexed (need locale prefix to match actual URLs)
  const privatePaths = [
    '/dashboard',
    '/party/',
    '/children',
    '/invitations',
    '/payment/',
    '/verify-result',
    '/admin/',
  ]
  // Generate disallow rules with locale prefixes so they actually match real URLs
  const localizedDisallows = locales.flatMap(locale =>
    privatePaths.map(path => `/${locale}${path}`)
  )

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/en/', '/zh/'],
        disallow: [
          '/api/',
          '/rsvp/',  // Redirect-only path without locale
          ...localizedDisallows,
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
