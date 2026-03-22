export interface PartyLocalDateTimeFields {
  eventDatetime: string | Date
  eventEndDatetime?: string | Date | null
  eventLocalDate?: string | null
  eventLocalTime?: string | null
  eventEndLocalDate?: string | null
  eventEndLocalTime?: string | null
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toLocalTimeString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function parseLocalDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

export function resolvePartyStartDateTime(party: PartyLocalDateTimeFields): Date {
  if (party.eventLocalDate && party.eventLocalTime) {
    return parseLocalDateTime(party.eventLocalDate, party.eventLocalTime)
  }

  return new Date(party.eventDatetime)
}

export function resolvePartyEndDateTime(party: PartyLocalDateTimeFields): Date | null {
  if (party.eventEndLocalDate && party.eventEndLocalTime) {
    return parseLocalDateTime(party.eventEndLocalDate, party.eventEndLocalTime)
  }

  return party.eventEndDatetime ? new Date(party.eventEndDatetime) : null
}

export function getPartyLocalFields(party: PartyLocalDateTimeFields) {
  const startDate = resolvePartyStartDateTime(party)
  const endDate = resolvePartyEndDateTime(party)

  return {
    eventLocalDate: party.eventLocalDate || toLocalDateString(startDate),
    eventLocalTime: party.eventLocalTime || toLocalTimeString(startDate),
    eventEndLocalDate: party.eventEndLocalDate || (endDate ? toLocalDateString(endDate) : null),
    eventEndLocalTime: party.eventEndLocalTime || (endDate ? toLocalTimeString(endDate) : null),
  }
}
