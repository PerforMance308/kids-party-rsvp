import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// Page configuration with SEO priority
const pageConfig = {
  '': { priority: 1.0, changeFrequency: 'daily' as const },           // home - highest priority
  '/register': { priority: 0.9, changeFrequency: 'weekly' as const }, // registration - important for conversion
  '/contact': { priority: 0.7, changeFrequency: 'monthly' as const },
  '/terms': { priority: 0.3, changeFrequency: 'monthly' as const },
  '/privacy': { priority: 0.3, changeFrequency: 'monthly' as const },
  '/login': { priority: 0.3, changeFrequency: 'monthly' as const },   // login - low priority for SEO
}

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'zh']
  const lastModified = new Date()

  // Generate sitemap entries for all static pages in all locales
  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    Object.entries(pageConfig).map(([page, config]) => ({
      url: `${SITE_URL}/${locale}${page}`,
      lastModified,
      changeFrequency: config.changeFrequency,
      priority: config.priority,
      alternates: {
        languages: {
          en: `${SITE_URL}/en${page}`,
          zh: `${SITE_URL}/zh${page}`,
        },
      },
    }))
  )

  return staticEntries
}
