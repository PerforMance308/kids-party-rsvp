export const RSVP_CUTOFF_HOURS = 24

export function getDefaultRsvpCloseTime(eventDatetime: Date | string) {
  const eventDate = new Date(eventDatetime)
  return new Date(eventDate.getTime() - RSVP_CUTOFF_HOURS * 60 * 60 * 1000)
}

export function resolveRsvpCloseTime(
  eventDatetime: Date | string,
  explicitRsvpClosesAt?: Date | string | null
) {
  if (explicitRsvpClosesAt) {
    return new Date(explicitRsvpClosesAt)
  }

  return getDefaultRsvpCloseTime(eventDatetime)
}

export function isRsvpClosed(
  eventDatetime: Date | string,
  now = new Date(),
  explicitRsvpClosesAt?: Date | string | null
) {
  return now >= resolveRsvpCloseTime(eventDatetime, explicitRsvpClosesAt)
}
