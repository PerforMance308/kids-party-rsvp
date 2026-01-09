import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl(): string {
  // Always prioritize environment variables if configured
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL

  if (baseUrl) {
    return baseUrl.replace(/\/$/, '') // Remove trailing slash
  }

  // Client-side: use current domain as second choice
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Production fallback
  return 'https://kids-party-rsvp.zeabur.app'
}

export function formatDate(date: Date, locale: string = 'en-US'): string {
  // Normalize locale for Intl.DateTimeFormat
  const normalizedLocale = locale.startsWith('zh') ? 'zh-CN' : 'en-US'

  return new Intl.DateTimeFormat(normalizedLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatDateShort(date: Date, locale: string = 'en-US'): string {
  const normalizedLocale = locale.startsWith('zh') ? 'zh-CN' : 'en-US'

  return new Intl.DateTimeFormat(normalizedLocale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function getDaysUntilEvent(eventDate: Date): number {
  const now = new Date()
  const diffTime = eventDate.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function formatDateForInput(date: Date): string {
  // Format date for datetime-local input: YYYY-MM-DDTHH:mm
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Calculate age from birth date
 * Uses precise calculation accounting for leap years
 */
export function calculateAge(birthDate: Date, referenceDate: Date = new Date()): number {
  const birth = new Date(birthDate)
  const ref = new Date(referenceDate)

  let age = ref.getFullYear() - birth.getFullYear()
  const monthDiff = ref.getMonth() - birth.getMonth()

  // Adjust if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    age--
  }

  return Math.max(0, age)
}

/**
 * Get status color classes for RSVP status
 */
export function getRsvpStatusColor(status?: string): string {
  switch (status) {
    case 'YES':
      return 'bg-green-100 text-green-700'
    case 'NO':
      return 'bg-red-100 text-red-700'
    case 'MAYBE':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-neutral-100 text-neutral-700'
  }
}

/**
 * Get display text for RSVP status
 */
export function getRsvpStatusText(status?: string, locale: string = 'en'): string {
  const texts: Record<string, Record<string, string>> = {
    en: {
      YES: 'Attending',
      NO: 'Not Attending',
      MAYBE: 'Maybe',
      default: 'Pending'
    },
    zh: {
      YES: '参加',
      NO: '不参加',
      MAYBE: '可能参加',
      default: '待定'
    }
  }

  const t = texts[locale] || texts.en
  return t[status || ''] || t.default
}

/**
 * Get color classes for days until event
 */
export function getDaysUntilColor(days: number): string {
  if (days < 0) return 'bg-neutral-100 text-neutral-500'
  if (days === 0) return 'bg-red-100 text-red-700'
  if (days <= 3) return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
}