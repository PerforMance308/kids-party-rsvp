import type { SupportedCurrency } from '@/types/invitation-template'

export const BROADCAST_EXTRA_PRICES: Record<SupportedCurrency, number> = {
  USD: 0.99,
  CAD: 1.99,
  EUR: 0.99,
}

export function normalizeSupportedCurrency(currency?: string | null): SupportedCurrency {
  const normalized = String(currency || 'USD').trim().toUpperCase()
  if (normalized === 'CAD' || normalized === 'EUR') return normalized
  return 'USD'
}

export function getBroadcastExtraPrice(currency?: string | null) {
  const normalizedCurrency = normalizeSupportedCurrency(currency)
  return {
    currency: normalizedCurrency,
    price: BROADCAST_EXTRA_PRICES[normalizedCurrency],
  }
}
