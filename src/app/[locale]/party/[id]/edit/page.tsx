'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLocale } from '@/contexts/LanguageContext'
import Link from 'next/link'
import AddressAutocomplete from '@/components/AddressAutocomplete'

interface Party {
  id: string
  childName: string
  childAge: number
  eventDatetime: string
  eventEndDatetime?: string
  rsvpClosesAt?: string | null
  location: string
  locationFull?: string
  theme?: string
  notes?: string
  targetAge?: number
}

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function EditPartyPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const locale = useLocale()
  const [party, setParty] = useState<Party | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state - removed childName and childAge as they are managed through child management
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [rsvpCloseDate, setRsvpCloseDate] = useState('')
  const [rsvpCloseTime, setRsvpCloseTime] = useState('23:59')
  const [location, setLocation] = useState('')
  const [locationFull, setLocationFull] = useState('')
  const [theme, setTheme] = useState('')
  const [notes, setNotes] = useState('')
  const [targetAge, setTargetAge] = useState('')

  // 当开始时间变化时，自动调整结束时间（保持2小时间隔）
  const handleEventTimeChange = (time: string) => {
    setEventTime(time)
    if (time) {
      const [hours, minutes] = time.split(':').map(Number)
      const endHours = (hours + 2) % 24
      setEventEndTime(`${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    }
  }

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated' || !session?.user?.id) {
      router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/party/${id}/edit`)}`)
      return
    }
  }, [status, session, router, id])

  // Fetch party data
  useEffect(() => {
    const fetchParty = async () => {
      if (!id || status !== 'authenticated') return

      try {
        const response = await fetch(`/api/parties/${id}`, {
          credentials: 'include'
        })

        if (response.ok) {
          const partyData = await response.json()
          setParty(partyData)

          // Populate form - 分别设置日期和时间
          const startDateTime = new Date(partyData.eventDatetime)
          setEventDate(toLocalDateInputValue(startDateTime))
          setEventTime(`${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime.getMinutes().toString().padStart(2, '0')}`)

          if (partyData.eventEndDatetime) {
            const endDateTime = new Date(partyData.eventEndDatetime)
            setEventEndTime(`${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`)
          } else {
            // 默认设置结束时间为开始时间+2小时
            const endHours = (startDateTime.getHours() + 2) % 24
            setEventEndTime(`${endHours.toString().padStart(2, '0')}:${startDateTime.getMinutes().toString().padStart(2, '0')}`)
          }

          if (partyData.rsvpClosesAt) {
            const closeDateTime = new Date(partyData.rsvpClosesAt)
            setRsvpCloseDate(toLocalDateInputValue(closeDateTime))
            setRsvpCloseTime(`${closeDateTime.getHours().toString().padStart(2, '0')}:${closeDateTime.getMinutes().toString().padStart(2, '0')}`)
          } else {
            const defaultCloseDate = new Date(startDateTime)
            defaultCloseDate.setDate(defaultCloseDate.getDate() - 2)
            setRsvpCloseDate(toLocalDateInputValue(defaultCloseDate))
            setRsvpCloseTime(`${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime.getMinutes().toString().padStart(2, '0')}`)
          }

          setLocation(partyData.location)
          setLocationFull(partyData.locationFull || partyData.location)
          setTheme(partyData.theme || '')
          setNotes(partyData.notes || '')
          setTargetAge(partyData.targetAge != null ? partyData.targetAge.toString() : '')
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to fetch party')
        }
      } catch (error) {
        setError('An error occurred while fetching party data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchParty()
  }, [id, status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return

    setIsSaving(true)
    setError('')

    try {
      // 组合日期和时间
      const eventDatetime = new Date(`${eventDate}T${eventTime}`)
      let eventEndDatetime: Date | null = null
      if (eventEndTime) {
        eventEndDatetime = new Date(`${eventDate}T${eventEndTime}`)
        // 如果结束时间小于开始时间，说明跨天了
        if (eventEndDatetime < eventDatetime) {
          eventEndDatetime.setDate(eventEndDatetime.getDate() + 1)
        }
      }
      const rsvpClosesAt = rsvpCloseDate
        ? new Date(`${rsvpCloseDate}T${rsvpCloseTime || '23:59'}`)
        : new Date(eventDatetime.getTime() - 2 * 24 * 60 * 60 * 1000)

      const response = await fetch(`/api/parties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventDatetime: eventDatetime.toISOString(),
          eventEndDatetime: eventEndDatetime?.toISOString(),
          rsvpClosesAt: rsvpClosesAt.toISOString(),
          location,
          locationFull: locationFull || location,
          theme: theme || undefined,
          notes: notes || undefined,
          targetAge: targetAge ? parseInt(targetAge) : undefined,
        }),
      })

      if (response.ok) {
        router.push(`/${locale}/party/${id}/dashboard`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update party')
      }
    } catch (error) {
      setError('An error occurred while updating the party')
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading party data...</p>
        </div>
      </main>
    )
  }

  // Authentication check
  if (status === 'unauthenticated' || !session?.user?.id) {
    return null
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-neutral-900">
            Edit Party
          </h1>
          <p className="text-neutral-600 mt-2">
            Update your party details. Guests will be notified of important changes.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Child Information Display */}
        {party && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">Party For</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-medium text-neutral-900">
                  {party.childName}'s {party.childAge}th Birthday Party
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  To update child information, visit the <Link href={`/${locale}/children`} className="text-primary-600 hover:text-primary-700">Children Management</Link> page
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">

          <div>
            <label htmlFor="eventDate" className="block text-sm font-medium text-neutral-700 mb-1">
              Event Date *
            </label>
            <input
              type="date"
              id="eventDate"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventTime" className="block text-sm font-medium text-neutral-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                id="eventTime"
                value={eventTime}
                onChange={(e) => handleEventTimeChange(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="eventEndTime" className="block text-sm font-medium text-neutral-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                id="eventEndTime"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="input"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Default is 2 hours after start time
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rsvpCloseDate" className="block text-sm font-medium text-neutral-700 mb-1">
                RSVP Close Date
              </label>
              <input
                type="date"
                id="rsvpCloseDate"
                value={rsvpCloseDate}
                onChange={(e) => setRsvpCloseDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="rsvpCloseTime" className="block text-sm font-medium text-neutral-700 mb-1">
                RSVP Close Time
              </label>
              <input
                type="time"
                id="rsvpCloseTime"
                value={rsvpCloseTime}
                onChange={(e) => setRsvpCloseTime(e.target.value)}
                className="input"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Default is 2 days before the party starts.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">
              Location *
            </label>
            <AddressAutocomplete
              id="location"
              value={location}
              onChange={(value) => {
                setLocation(value)
                setLocationFull('')
              }}
              onSelect={(selection) => {
                setLocation(selection.displayAddress)
                setLocationFull(selection.fullAddress)
              }}
              placeholder="e.g., Springfield, IL or New York, NY"
              locale={locale}
              required
            />
          </div>

          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-neutral-700 mb-1">
              Party Theme
            </label>
            <input
              type="text"
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="input"
              placeholder="e.g., Princess, Superhero, Animals"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
              Special Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              rows={3}
              placeholder="Any special instructions, dietary considerations, or additional information..."
            />
          </div>

          <div>
            <label htmlFor="targetAge" className="block text-sm font-medium text-neutral-700 mb-1">
              Celebrating which birthday?
            </label>
            <input
              type="number"
              id="targetAge"
              value={targetAge}
              onChange={(e) => setTargetAge(e.target.value)}
              className="input"
              placeholder="e.g., 5"
              min="1"
              max="99"
            />
            <p className="mt-1 text-xs text-neutral-500">
              If left blank, it will be calculated from birth date. Fill this if the party is held before the actual birthday.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary flex-1"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">📧 Notification Policy</h3>
          <p className="text-sm text-blue-800">
            Guests who have RSVP'd "Yes" or "Maybe" will automatically receive email notifications
            if you change the date, time, or location. To update child information, use the Children Management page.
          </p>
        </div>
      </div>
    </main>
  )
}
