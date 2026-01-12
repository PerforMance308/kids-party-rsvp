import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'zh']
  const lastModified = new Date()

  // Static pages
  const staticPages = [
    '',           // home
    '/login',
    '/register',
    '/terms',
    '/privacy',
    '/contact',
  ]

  // Generate sitemap entries for all static pages in all locales
  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${SITE_URL}/${locale}${page}`,
      lastModified,
      changeFrequency: (page === '' ? 'daily' : 'weekly') as 'daily' | 'weekly',
      priority: page === '' ? 1.0 : 0.8,
      alternates: {
        languages: {
          en: `${SITE_URL}/en${page}`,
          zh: `${SITE_URL}/zh${page}`,
        },
      },
    }))
  )

  // Note: Root URL (/) is a redirect to /en, so it's excluded from sitemap
  // Only include actual indexable pages (locale versions)
  return staticEntries
}
