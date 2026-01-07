import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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