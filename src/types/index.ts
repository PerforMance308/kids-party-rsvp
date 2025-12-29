export type RSVPStatus = 'YES' | 'NO' | 'MAYBE'
export type ReminderType = 'SEVEN_DAYS' | 'TWO_DAYS' | 'SAME_DAY'

export interface CreatePartyInput {
  childName: string
  childAge: number
  eventDatetime: Date
  location: string
  theme?: string
  notes?: string
}

export interface RSVPInput {
  parentName: string
  childName: string
  email: string
  phone?: string
  status: RSVPStatus
  numChildren: number
  parentStaying: boolean
  allergies?: string
  message?: string
}

export interface AuthUser {
  id: string
  email: string
}

export interface PartyWithStats {
  id: string
  childName: string
  childAge: number
  eventDatetime: Date
  location: string
  theme?: string
  notes?: string
  publicRsvpToken: string
  stats: {
    total: number
    attending: number
    notAttending: number
    maybe: number
  }
}