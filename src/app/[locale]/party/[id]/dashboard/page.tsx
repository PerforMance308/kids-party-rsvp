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
import { toast } from '@/lib/toast'

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
  const { t } = useLanguage()
  const tr = useTranslations('manage')
  const locale = useLocale()

  const loadQRCode = async () => {
    if (!id) return
    try {
      const response = await fetch(`/api/parties/${id}/qr`)
      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
      }
    } catch {
      // Failed to load QR code
    }
  }

  // 获取派对数据的函数，可以被子组件调用来刷新数据
  const fetchParty = async () => {
    if (!id) return

    try {
      const response = await fetch(`/api/parties/${id}`)
      if (response.ok) {
        const data = await response.json()
        setParty(data)
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

  // 刷新派对数据（不显示 loading 状态）
  const refreshParty = async () => {
    if (!id) return
    try {
      const response = await fetch(`/api/parties/${id}`)
      if (response.ok) {
        const data = await response.json()
        setParty(data)
        await loadQRCode()
      }
    } catch (error) {
      console.error('Failed to refresh party:', error)
    }
  }

  useEffect(() => {
    if (id) {
      fetchParty()
    }
  }, [id])

  const [showInvitation, setShowInvitation] = useState(true)
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [hasContacts, setHasContacts] = useState(false)

  // Fetch contacts count to decide whether to show Add Guests section
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch('/api/contacts')
        if (response.ok) {
          const data = await response.json()
          setHasContacts(data.length > 0)
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error)
      }
    }
    fetchContacts()
  }, [])

  const copyRsvpLink = () => {
    if (party) {
      navigator.clipboard.writeText(party.rsvpUrl)
      toast.success(
        locale === 'zh' ? '已复制！' : 'Copied!',
        locale === 'zh' ? 'RSVP链接已复制到剪贴板' : 'RSVP link copied to clipboard'
      )
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


  return (
    <main className="flex-1 px-4 py-4 lg:py-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Header - Compact on mobile */}
        <div className="mb-4 lg:mb-6">
          <Link href={`/${locale}/dashboard`} className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {tr('backToDashboard')}
          </Link>

          <h1 className="text-xl md:text-3xl font-bold text-neutral-900">
            {t('dashboard.partyTitle', { childName: party.childName, age: party.childAge })}
          </h1>
          {party.theme && (
            <p className="text-base lg:text-lg text-primary-600">{party.theme}</p>
          )}

          {/* Party info - more compact on mobile */}
          <div className="mt-2 lg:mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs lg:text-base text-neutral-600">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(new Date(party.eventDatetime), locale)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {party.location}
            </span>
          </div>
        </div>

        {/* Mobile: Stats at top - prominent display */}
        <div className="lg:hidden mb-4">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-4 text-white">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-2xl font-bold">{party.stats.total}</div>
                <div className="text-xs text-primary-100">{tr('totalInvited')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{party.stats.attending}</div>
                <div className="text-xs text-primary-100">{tr('attending')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {party.stats.total > 0 ? Math.round(((party.stats.attending + party.stats.notAttending + party.stats.maybe) / party.stats.total) * 100) : 0}%
                </div>
                <div className="text-xs text-primary-100">{tr('responseRate')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Two Column Layout / Mobile: Single Column */}
        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          {/* Left Column: Invitation Preview + Quick Actions - Sticky on desktop */}
          <div className="lg:w-[420px] xl:w-[480px] flex-shrink-0 space-y-4 lg:space-y-6 lg:sticky lg:top-4">
            {/* Current Invitation Card - Collapsible on mobile */}
            <div className="card overflow-hidden">
              <button
                onClick={() => setShowInvitation(!showInvitation)}
                className="w-full flex justify-between items-center lg:cursor-default"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-neutral-900">{tr('currentInvitation')}</h2>
                  {party.paidTemplates && party.paidTemplates.length > 0 && (
                    <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full border border-green-200 text-xs">
                      Premium
                    </span>
                  )}
                </div>
                {/* Collapse arrow - mobile only */}
                <svg
                  className={`w-5 h-5 text-neutral-400 lg:hidden transition-transform ${showInvitation ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Invitation content - always visible on desktop, collapsible on mobile */}
              <div className={`mt-4 ${showInvitation ? 'block' : 'hidden'} lg:block`}>
                {qrCode && party ? (
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
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-neutral-600 text-sm">{tr('generating')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions - Desktop */}
            <div className="card hidden lg:block">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">{tr('quickActions')}</h3>
              <div className="space-y-3">
                <button onClick={copyRsvpLink} className="btn btn-primary w-full text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  {tr('copyLink')}
                </button>
                <button onClick={exportToCSV} className="btn btn-secondary w-full text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {tr('exportList')}
                </button>
                <Link href={`/${locale}/party/${party.id}/edit`} className="btn btn-secondary w-full text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {tr('editParty')}
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Stats + Guest List + Templates */}
          <div className="flex-1 min-w-0 space-y-4 lg:space-y-6">
            {/* Stats Cards - Desktop only (mobile shows gradient version above) */}
            <div className="hidden lg:grid grid-cols-3 gap-4">
              <div className="card text-center py-4">
                <div className="text-3xl font-bold text-neutral-900">{party.stats.total}</div>
                <h3 className="text-sm text-neutral-600 mt-1">{tr('totalInvited')}</h3>
              </div>
              <div className="card text-center py-4">
                <div className="text-3xl font-bold text-green-600">{party.stats.attending}</div>
                <h3 className="text-sm text-neutral-600 mt-1">{tr('attending')}</h3>
              </div>
              <div className="card text-center py-4">
                <div className="text-3xl font-bold text-primary-600">
                  {party.stats.total > 0 ? Math.round(((party.stats.attending + party.stats.notAttending + party.stats.maybe) / party.stats.total) * 100) : 0}%
                </div>
                <h3 className="text-sm text-neutral-600 mt-1">{tr('responseRate')}</h3>
              </div>
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
              onPaymentSuccess={refreshParty}
            />

            {/* Add Guest Section - Only show when contacts exist */}
            {hasContacts && (
              party.guests.length === 0 ? (
                <div className="card">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">{tr('addGuests')}</h2>
                  <p className="text-neutral-600 mb-4">{tr('addGuestsDesc')}</p>
                  <InviteGuests partyId={party.id} />
                </div>
              ) : (
                <div className="card">
                  <button
                    onClick={() => setShowAddGuest(!showAddGuest)}
                    className="w-full flex justify-between items-center"
                  >
                    <h2 className="text-xl font-semibold text-neutral-900">{tr('addGuests')}</h2>
                    <svg
                      className={`w-5 h-5 text-neutral-400 transition-transform ${showAddGuest ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showAddGuest && (
                    <div className="mt-4">
                      <p className="text-neutral-600 mb-4">{tr('addGuestsDesc')}</p>
                      <InviteGuests partyId={party.id} />
                    </div>
                  )}
                </div>
              )
            )}

            <div className="card">
              <h2 className="text-lg lg:text-xl font-semibold text-neutral-900 mb-4">{tr('guestList')}</h2>
              {party.guests.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-neutral-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-neutral-500 text-sm">{tr('noRsvps')}</p>
                </div>
              ) : (
                <>
                  {/* Mobile: Card layout */}
                  <div className="lg:hidden space-y-3">
                    {party.guests.map((guest) => (
                      <div key={guest.id} className="border border-neutral-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-neutral-900">{guest.parentName}</div>
                            <div className="text-xs text-neutral-500">{guest.childName}</div>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${guest.rsvp?.status === 'YES'
                            ? 'bg-green-100 text-green-700'
                            : guest.rsvp?.status === 'NO'
                              ? 'bg-red-100 text-red-700'
                              : guest.rsvp?.status === 'MAYBE'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}>
                            {guest.rsvp?.status === 'YES' ? '✓ ' : guest.rsvp?.status === 'NO' ? '✗ ' : ''}{guest.rsvp?.status || 'Pending'}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 space-y-0.5">
                          <div>{guest.email}</div>
                          {guest.rsvp && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded">{guest.rsvp.numChildren} {locale === 'zh' ? '个孩子' : 'child'}</span>
                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded">{guest.rsvp.parentStaying ? (locale === 'zh' ? '家长陪同' : 'Parent stays') : (locale === 'zh' ? '不陪同' : 'Drop-off')}</span>
                            </div>
                          )}
                          {guest.rsvp?.allergies && (
                            <div className="text-red-600 mt-1">⚠️ {guest.rsvp.allergies}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: Table layout */}
                  <div className="hidden lg:block overflow-x-auto">
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
                </>
              )}
            </div>

            {/* Photos Section */}
            <PhotoSharingSection
              party={party as any}
              onUpdate={refreshParty}
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

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 lg:hidden safe-area-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            onClick={copyRsvpLink}
            className="flex-1 btn btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {locale === 'zh' ? '分享链接' : 'Share'}
          </button>
          <Link
            href={`/${locale}/party/${party.id}/edit`}
            className="flex-1 btn btn-secondary text-sm py-2.5 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {locale === 'zh' ? '编辑' : 'Edit'}
          </Link>
          <button
            onClick={exportToCSV}
            className="btn btn-secondary text-sm py-2.5 px-3"
            title={locale === 'zh' ? '导出名单' : 'Export'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  )
}