'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ContactReuse from '@/components/ContactReuse'

interface Contact {
  id: string
  parentName: string
  childName: string
  email: string
  phone?: string
}

export default function NewPartyPage() {
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [location, setLocation] = useState('')
  const [theme, setTheme] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const eventDatetime = new Date(`${eventDate}T${eventTime}`)
      
      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childName,
          childAge: parseInt(childAge),
          eventDatetime: eventDatetime.toISOString(),
          location,
          theme: theme || undefined,
          notes: notes || undefined,
        }),
      })

      if (response.ok) {
        const party = await response.json()
        
        // If contacts were selected, add them as guests
        if (selectedContacts.length > 0) {
          try {
            await Promise.all(
              selectedContacts.map(contact =>
                fetch('/api/guests', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    partyId: party.id,
                    parentName: contact.parentName,
                    childName: contact.childName,
                    email: contact.email,
                    phone: contact.phone,
                  }),
                })
              )
            )
          } catch (error) {
            console.error('Failed to add some contacts:', error)
          }
        }
        
        router.push(`/party/${party.id}/dashboard`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create party')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">
              Plan a New Party
            </h1>
            <p className="text-neutral-600 mt-2">
              Fill in the details for your child's party
            </p>
          </div>

          <ContactReuse onContactsSelected={setSelectedContacts} />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="childName" className="block text-sm font-medium text-neutral-700 mb-1">
                  Child's Name *
                </label>
                <input
                  type="text"
                  id="childName"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="input"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="childAge" className="block text-sm font-medium text-neutral-700 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  id="childAge"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className="input"
                  min="1"
                  max="18"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-neutral-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  id="eventDate"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label htmlFor="eventTime" className="block text-sm font-medium text-neutral-700 mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  id="eventTime"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="input"
                  required
                />
              </div>
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
                placeholder="e.g., 123 Main St, City Park, Community Center"
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
                placeholder="e.g., Dinosaurs, Princess, Superhero"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                rows={3}
                placeholder="Any special instructions, gift preferences, or important details..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Party'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}