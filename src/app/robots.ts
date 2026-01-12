import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/en/', '/zh/'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/party/',
          '/children/',
          '/invitations/',
          '/payment/',
          '/*.json$',
          '/verify-result/',
          '/rsvp/', // Redirect-only path, use /en/rsvp/ or /zh/rsvp/ instead
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/en/', '/zh/'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/party/',
          '/children/',
          '/invitations/',
          '/payment/',
          '/rsvp/', // Redirect-only path
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
