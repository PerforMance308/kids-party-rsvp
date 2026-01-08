'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { formatDateForInput } from '@/lib/utils'
import { useLocale } from '@/contexts/LanguageContext'

interface Party {
  id: string
  childName: string
  childAge: number
  eventDatetime: string
  location: string
  theme?: string
  notes?: string
  targetAge?: number
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
  const [success, setSuccess] = useState('')

  // Form state - removed childName and childAge as they are managed through child management
  const [eventDatetime, setEventDatetime] = useState('')
  const [location, setLocation] = useState('')
  const [theme, setTheme] = useState('')
  const [notes, setNotes] = useState('')
  const [targetAge, setTargetAge] = useState('')

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

          // Populate form
          setEventDatetime(formatDateForInput(new Date(partyData.eventDatetime)))
          setLocation(partyData.location)
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
    setSuccess('')

    try {
      const response = await fetch(`/api/parties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventDatetime,
          location,
          theme: theme || undefined,
          notes: notes || undefined,
          targetAge: targetAge ? parseInt(targetAge) : undefined,
        }),
      })

      if (response.ok) {
        setSuccess('Party updated successfully! Notification emails have been sent to guests if there were important changes.')

        // Redirect to party dashboard after a short delay
        setTimeout(() => {
          router.push(`/${locale}/party/${id}/dashboard`)
        }, 2000)
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

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-6">
            {success}
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
                  To update child information, visit the <a href="/children" className="text-primary-600 hover:text-primary-700">Children Management</a> page
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">

          <div>
            <label htmlFor="eventDatetime" className="block text-sm font-medium text-neutral-700 mb-1">
              Event Date & Time *
            </label>
            <input
              type="datetime-local"
              id="eventDatetime"
              value={eventDatetime}
              onChange={(e) => setEventDatetime(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              placeholder="e.g., 123 Main St, City, State or Our backyard"
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
              max="18"
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