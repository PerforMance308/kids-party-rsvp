// Application constants - avoid magic numbers throughout the codebase

// Time constants
export const MS_PER_SECOND = 1000
export const MS_PER_MINUTE = 60 * MS_PER_SECOND
export const MS_PER_HOUR = 60 * MS_PER_MINUTE
export const MS_PER_DAY = 24 * MS_PER_HOUR

// Session configuration
export const SESSION_MAX_AGE_SECONDS = 60 * 60 // 1 hour
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * MS_PER_SECOND

// Token expiration
export const VERIFICATION_TOKEN_EXPIRY_MS = 24 * MS_PER_HOUR // 24 hours
export const PASSWORD_RESET_TOKEN_EXPIRY_MS = MS_PER_HOUR // 1 hour

// File upload limits
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const MAX_PHOTOS_PER_UPLOAD = 10

// UI delays
export const REDIRECT_DELAY_MS = 2000
export const TOAST_DURATION_MS = 3000
export const SESSION_CHECK_TIMEOUT_MS = 10000

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// RSVP statuses
export const RSVP_STATUS = {
  YES: 'YES',
  NO: 'NO',
  MAYBE: 'MAYBE',
} as const

export type RsvpStatus = typeof RSVP_STATUS[keyof typeof RSVP_STATUS]

// Party reminder types
export const REMINDER_TYPES = {
  SEVEN_DAYS: 'SEVEN_DAYS',
  TWO_DAYS: 'TWO_DAYS',
  SAME_DAY: 'SAME_DAY',
} as const

export type ReminderType = typeof REMINDER_TYPES[keyof typeof REMINDER_TYPES]
