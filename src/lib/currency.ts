import type { Pricing, SupportedCurrency } from '@/types/invitation-template'
import { resolvePricingCurrency, SUPPORTED_CURRENCIES } from '@/types/invitation-template'

const EURO_COUNTRIES = new Set([
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR',
  'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
])

export function inferCurrencyFromLocale(localeOrLanguage?: string | null): SupportedCurrency {
  const value = (localeOrLanguage || '').toUpperCase()

  if (value.includes('-CA') || value.endsWith('_CA')) return 'CAD'

  const countryMatch = value.match(/[-_]([A-Z]{2})$/)
  if (countryMatch && EURO_COUNTRIES.has(countryMatch[1])) return 'EUR'

  return 'USD'
}

export function detectPreferredCurrency(locale?: string): SupportedCurrency {
  if (typeof navigator !== 'undefined') {
    for (const language of navigator.languages || []) {
      const detected = inferCurrencyFromLocale(language)
      if (SUPPORTED_CURRENCIES.includes(detected)) return detected
    }

    if (navigator.language) {
      return inferCurrencyFromLocale(navigator.language)
    }
  }

  return inferCurrencyFromLocale(locale)
}

export function getTemplateCurrency(pricing: Pricing, preferredCurrency?: string | null): SupportedCurrency {
  return resolvePricingCurrency(pricing, preferredCurrency)
}
