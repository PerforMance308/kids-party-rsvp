'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import InvitationCard from '@/components/InvitationCard'

interface Guest {
  id: string
  parentName: string
  childName: string
  email: string
  phone?: string
  rsvp?: {
    status: string
    numChildren: number
    parentStaying: boolean
    allergies?: string
    message?: string
  }
}

interface Party {
  id: string
  childName: string
  childAge: number
  eventDatetime: string
  location: string
  theme?: string
  notes?: string
  publicRsvpToken: string
  rsvpUrl: string
  guests: Guest[]
  stats: {
    total: number
    attending: number
    notAttending: number
    maybe: number
  }
}

export default function PartyDashboard() {
  const { id } = useParams()
  const [party, setParty] = useState<Party | null>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadQRCode = async () => {
    if (!id) return
    try {
      console.log('Loading QR code for party:', id)
      const response = await fetch(`/api/parties/${id}/qr`)
      if (response.ok) {
        const data = await response.json()
        console.log('QR code loaded:', data.qrCode ? 'success' : 'failed')
        setQrCode(data.qrCode)
      } else {
        console.error('QR code response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to load QR code:', error)
    }
  }

  useEffect(() => {
    const fetchParty = async () => {
      if (!id) return
      
      try {
        console.log('Fetching party:', id)
        const response = await fetch(`/api/parties/${id}`)
        if (response.ok) {
          const data = await response.json()
          setParty(data)
          console.log('Party loaded, now loading QR code')
          // Load QR code after party is loaded
          await loadQRCode()
        } else {
          setError('Failed to load party')
        }
      } catch (error) {
        setError('An error occurred while loading party')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchParty()
    }
  }, [id])

  const copyRsvpLink = () => {
    if (party) {
      navigator.clipboard.writeText(party.rsvpUrl)
      alert('RSVP link copied to clipboard!')
    }
  }

  const exportToCSV = () => {
    if (!party) return

    const headers = ['Parent Name', 'Child Name', 'Email', 'Phone', 'Status', 'Children', 'Parent Staying', 'Allergies', 'Message']
    const rows = party.guests.map(guest => [
      guest.parentName,
      guest.childName,
      guest.email,
      guest.phone || '',
      guest.rsvp?.status || 'No response',
      guest.rsvp?.numChildren || '',
      guest.rsvp?.parentStaying ? 'Yes' : 'No',
      guest.rsvp?.allergies || '',
      guest.rsvp?.message || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${party.childName}-party-rsvps.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </main>
    )
  }

  if (!party) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Party not found</h1>
          <Link href="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="text-neutral-600 hover:text-neutral-900">
              ← Back to Dashboard
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-neutral-900">
            {party.childName}'s {party.childAge}th Birthday Party
          </h1>
          {party.theme && (
            <p className="text-lg text-primary-600 mt-1">{party.theme}</p>
          )}
          
          <div className="mt-4 space-y-2 text-neutral-600">
            <p><strong>When:</strong> {formatDate(new Date(party.eventDatetime))}</p>
            <p><strong>Where:</strong> {party.location}</p>
            {party.notes && <p><strong>Notes:</strong> {party.notes}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="card text-center">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Total Invited</h3>
            <div className="text-3xl font-bold text-neutral-900">{party.stats.total}</div>
          </div>
          
          <div className="card text-center">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Attending</h3>
            <div className="text-3xl font-bold text-green-600">{party.stats.attending}</div>
          </div>
          
          <div className="card text-center">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Response Rate</h3>
            <div className="text-3xl font-bold text-primary-600">
              {party.stats.total > 0 ? Math.round(((party.stats.attending + party.stats.notAttending + party.stats.maybe) / party.stats.total) * 100) : 0}%
            </div>
          </div>
        </div>

        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Printable Invitation Card</h2>
          
          {qrCode && party ? (
            <InvitationCard 
              party={{
                childName: party.childName,
                childAge: party.childAge,
                eventDatetime: party.eventDatetime,
                location: party.location,
                theme: party.theme,
                notes: party.notes
              }}
              qrCodeUrl={qrCode}
              rsvpUrl={party.rsvpUrl}
            />
          ) : (
            <div className="text-center py-8">
              <div className="text-neutral-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <p className="text-neutral-600">Generating invitation card...</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={copyRsvpLink}
              className="btn btn-secondary"
            >
              Copy RSVP Link
            </button>
            
            <button
              onClick={exportToCSV}
              className="btn btn-secondary"
            >
              Export Guest List
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Guest List & RSVPs</h2>
          
          {party.guests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">No RSVPs yet. Share your invitation to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">Guest</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {party.guests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-neutral-900">{guest.parentName}</div>
                          <div className="text-sm text-neutral-600">{guest.childName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm text-neutral-900">{guest.email}</div>
                          {guest.phone && <div className="text-sm text-neutral-600">{guest.phone}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          guest.rsvp?.status === 'YES'
                            ? 'bg-green-100 text-green-800'
                            : guest.rsvp?.status === 'NO'
                            ? 'bg-red-100 text-red-800'
                            : guest.rsvp?.status === 'MAYBE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}>
                          {guest.rsvp?.status || 'No response'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {guest.rsvp && (
                          <div className="text-sm space-y-1">
                            <div>{guest.rsvp.numChildren} child{guest.rsvp.numChildren !== 1 ? 'ren' : ''}</div>
                            <div>Parent {guest.rsvp.parentStaying ? 'staying' : 'not staying'}</div>
                            {guest.rsvp.allergies && (
                              <div className="text-red-600">⚠️ {guest.rsvp.allergies}</div>
                            )}
                            {guest.rsvp.message && (
                              <div className="text-neutral-600 italic">"{guest.rsvp.message}"</div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}