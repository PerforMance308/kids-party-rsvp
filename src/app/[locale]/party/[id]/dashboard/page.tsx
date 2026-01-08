'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useLanguage, useTranslations, useLocale } from '@/contexts/LanguageContext'
import InvitationCard from '@/components/InvitationCard'
import TemplateSelector from '@/components/TemplateSelector'
import InvitationTemplate from '@/components/InvitationTemplates'
import InviteGuests from '@/components/InviteGuests'
import PhotoSharingSection from '@/components/PhotoSharingSection'
import HostPhotoManager from '@/components/HostPhotoManager'

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
  targetAge?: number
  template?: string
  paidTemplates?: string[]
  photoSharingPaid?: boolean
  allowPhotoSharing?: boolean
  guestCanSeeOthers?: boolean
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
  const [activeTab, setActiveTab] = useState('overview')
  const { t } = useLanguage()
  const tr = useTranslations('manage')
  const locale = useLocale()

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

  const handleTemplateSelect = async (template: string) => {
    try {
      const response = await fetch(`/api/parties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...party,
          template,
          eventDatetime: party?.eventDatetime,
          location: party?.location,
          theme: party?.theme || undefined,
          notes: party?.notes || undefined,
          targetAge: party?.targetAge || undefined,
        }),
      })

      if (response.ok) {
        const updatedParty = await response.json()
        setParty(updatedParty)
        // Regenerate QR code for new template
        await loadQRCode()
      } else {
        setError('Failed to update template')
      }
    } catch (error) {
      setError('An error occurred while updating template')
    }
  }


  if (isLoading) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center">{t('home.loading')}</div>
      </main>
    )
  }

  if (!party) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">{t('rsvp.invitationNotFound')}</h1>
          <Link href={`/${locale}/dashboard`} className="btn btn-primary">
            {tr('backToDashboard')}
          </Link>
        </div>
      </main>
    )
  }

  const tabs = [
    { id: 'overview', name: tr('overview'), icon: '📊' },
    { id: 'guests', name: tr('guests'), icon: '👥' },
    { id: 'invitation', name: tr('invitation'), icon: '💌' },
    { id: 'photos', name: tr('photos'), icon: '📸' }
  ]

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Header - Always visible */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/${locale}/dashboard`} className="text-neutral-600 hover:text-neutral-900">
              ← {tr('backToDashboard')}
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            {t('dashboard.partyTitle', { childName: party.childName, age: party.childAge })}
          </h1>
          {party.theme && (
            <p className="text-lg text-primary-600 mt-1">{party.theme}</p>
          )}

          <div className="mt-4 space-y-1 text-sm md:text-base text-neutral-600">
            <p><strong>{t('rsvp.when')}</strong> {formatDate(new Date(party.eventDatetime), locale)}</p>
            <p><strong>{t('rsvp.where')}</strong> {party.location}</p>
            {party.notes && <p><strong>{t('rsvp.specialNotes')}</strong> {party.notes}</p>}
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden mb-6">
          <div className="flex overflow-x-auto space-x-1 bg-neutral-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Grid layout, Mobile: Tabbed content */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Desktop Sidebar - Stats & Quick Actions */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Stats Cards */}
              <div className="space-y-4">
                <div className="card text-center">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">{tr('totalInvited')}</h3>
                  <div className="text-2xl font-bold text-neutral-900">{party.stats.total}</div>
                </div>
                <div className="card text-center">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">{tr('attending')}</h3>
                  <div className="text-2xl font-bold text-green-600">{party.stats.attending}</div>
                </div>
                <div className="card text-center">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">{tr('responseRate')}</h3>
                  <div className="text-2xl font-bold text-primary-600">
                    {party.stats.total > 0 ? Math.round(((party.stats.attending + party.stats.notAttending + party.stats.maybe) / party.stats.total) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">{tr('quickActions')}</h3>
                <div className="space-y-3">
                  <button onClick={copyRsvpLink} className="w-full btn btn-primary">
                    {tr('copyLink')}
                  </button>
                  <button onClick={exportToCSV} className="w-full btn btn-secondary">
                    {tr('exportList')}
                  </button>
                  <Link href={`/party/${party.id}/edit` as any} className="w-full btn btn-secondary text-center block">
                    {tr('editParty')}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Mobile Overview Tab */}
            <div className={`lg:hidden ${activeTab === 'overview' ? 'block' : 'hidden'}`}>
              {/* Mobile Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card text-center">
                  <h3 className="text-xs font-semibold text-neutral-900 mb-1">{tr('totalInvited')}</h3>
                  <div className="text-xl font-bold text-neutral-900">{party.stats.total}</div>
                </div>
                <div className="card text-center">
                  <h3 className="text-xs font-semibold text-neutral-900 mb-1">{tr('attending')}</h3>
                  <div className="text-xl font-bold text-green-600">{party.stats.attending}</div>
                </div>
                <div className="card text-center">
                  <h3 className="text-xs font-semibold text-neutral-900 mb-1">{tr('responseRate')}</h3>
                  <div className="text-xl font-bold text-primary-600">
                    {party.stats.total > 0 ? Math.round(((party.stats.attending + party.stats.notAttending + party.stats.maybe) / party.stats.total) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Mobile Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={copyRsvpLink} className="btn btn-primary">
                  {tr('copyLink')}
                </button>
                <button onClick={exportToCSV} className="btn btn-secondary">
                  {tr('exportList')}
                </button>
              </div>
            </div>

            {/* Guests Tab Content */}
            <div className={`space-y-6 lg:block ${activeTab === 'guests' ? 'block' : 'hidden lg:block'}`}>
              {/* Invite Guests Section */}
              <div className="card">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">{tr('addGuests')}</h2>
                <p className="text-neutral-600 mb-4">{tr('addGuestsDesc')}</p>
                <InviteGuests partyId={party.id} />
              </div>

              {/* Guest List */}
              <div className="card">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">{tr('guestList')}</h2>
                {party.guests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-600">{tr('noRsvps')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">{tr('guest')}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">{tr('contact')}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">{tr('status')}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">{tr('details')}</th>
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
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${guest.rsvp?.status === 'YES'
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
                                  <div>{tr('child').replace('{count}', guest.rsvp.numChildren.toString())}</div>
                                  <div>{guest.rsvp.parentStaying ? tr('staying') : tr('dropOff')}</div>
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

            {/* Invitation Tab Content */}
            <div className={`space-y-6 lg:block ${activeTab === 'invitation' ? 'block' : 'hidden lg:block'}`}>
              {/* Current Invitation Card */}
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900">{tr('currentInvitation')}</h2>
                  {party.paidTemplates && party.paidTemplates.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-lg border border-green-200">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">{tr('premiumPurchased')}</span>
                    </div>
                  )}
                </div>

                {qrCode && party ? (
                  <div className="max-w-lg mx-auto">
                    <InvitationTemplate
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
                      template={(party.template as any) || 'free'}
                      showControls={true}
                      isCollapsible={false}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-neutral-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <p className="text-neutral-600">{tr('generating')}</p>
                  </div>
                )}
              </div>

              {/* Template Gallery */}
              <TemplateSelector
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
                onTemplateSelect={handleTemplateSelect}
                partyId={party.id}
                currentTemplate={party.template || 'free'}
                paidTemplates={party.paidTemplates || []}
              />
            </div>

            {/* Photos Tab Content */}
            <div className={`space-y-6 lg:block ${activeTab === 'photos' ? 'block' : 'hidden lg:block'}`}>
              <PhotoSharingSection
                party={party as any}
                onUpdate={() => window.location.reload()}
              />

              {party.photoSharingPaid && party.allowPhotoSharing && (
                <HostPhotoManager
                  partyId={party.id}
                  childName={party.childName}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}