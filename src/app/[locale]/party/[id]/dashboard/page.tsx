'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { resolvePartyStartDateTime } from '@/lib/party-datetime'
import { formatDate, formatPhoneDisplay, getGuestEmailDisplay } from '@/lib/utils'
import { useLanguage, useTranslations, useLocale } from '@/contexts/LanguageContext'
import InvitationCard from '@/components/InvitationCard'
import InvitationTemplate from '@/components/InvitationTemplates'
import InviteGuests from '@/components/InviteGuests'
import PaymentForm from '@/components/PaymentForm'
import { detectPreferredCurrency } from '@/lib/currency'
import { getBroadcastExtraPrice } from '@/lib/broadcast-pricing'
import { formatPrice, type SupportedCurrency } from '@/types/invitation-template'
// Photo sharing disabled
// import PhotoSharingSection from '@/components/PhotoSharingSection'
// import HostPhotoManager from '@/components/HostPhotoManager'
import { toast } from '@/lib/toast'

interface Guest {
  id: string
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
  eventLocalDate?: string
  eventLocalTime?: string
  eventEndDatetime?: string
  eventEndLocalDate?: string
  eventEndLocalTime?: string
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
      // Add timestamp to avoid stale QR cache
      const response = await fetch(`/api/parties/${id}/qr?t=${Date.now()}`)
      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
      }
    } catch {
      // Failed to load QR code
    }
  }

  // Fetch party data and allow child components to refresh it
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

  // Refresh party data without showing a full loading state
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
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showBroadcastPaymentModal, setShowBroadcastPaymentModal] = useState(false)
  const [broadcastSentToday, setBroadcastSentToday] = useState(0)
  const [broadcastPaymentId, setBroadcastPaymentId] = useState<string | null>(null)
  const [broadcastCurrency, setBroadcastCurrency] = useState<SupportedCurrency>('USD')

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


  const fetchBroadcastUsage = async () => {
    if (!id) return
    try {
      const response = await fetch(`/api/parties/${id}/broadcast`)
      if (response.ok) {
        const data = await response.json()
        setBroadcastSentToday(data.sentToday ?? 0)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (id) fetchBroadcastUsage()
  }, [id])

  useEffect(() => {
    if (showBroadcastPaymentModal) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [showBroadcastPaymentModal])

  useEffect(() => {
    setBroadcastCurrency(detectPreferredCurrency(locale))
  }, [locale])

  const broadcastPricing = getBroadcastExtraPrice(broadcastCurrency)
  const copyRsvpLink = () => {
    if (party) {
      navigator.clipboard.writeText(party.rsvpUrl)
      toast.success(
        locale === 'zh' ? '\u5df2\u590d\u5236\uff01' : 'Copied!',
        locale === 'zh' ? 'RSVP \u94fe\u63a5\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f' : 'RSVP link copied to clipboard'
      )
    }
  }


  const exportToCSV = () => {
    if (!party) return

    const headers = ['Child Name', 'Email', 'Phone', 'Status', 'Children', 'Parent Staying', 'Allergies', 'Message']
    const rows = party.guests.map(guest => [
      guest.childName,
      getGuestEmailDisplay(guest.email),
      guest.phone ? formatPhoneDisplay(guest.phone) : '',
      guest.rsvp?.status || 'No response',
      guest.rsvp?.numChildren || '',
      guest.rsvp?.parentStaying ? 'Yes' : 'No',
      guest.rsvp?.allergies || '',
      guest.rsvp?.message || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // Add BOM for proper Chinese character display in Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${party.childName}-party-rsvps.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const needsBroadcastPayment = broadcastSentToday >= 1 && !broadcastPaymentId

  const sendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      setBroadcastResult({ type: 'error', text: locale === 'zh' ? '请填写标题和内容' : 'Please enter both subject and message' })
      return
    }

    setIsSendingBroadcast(true)
    setBroadcastResult(null)
    try {
      const response = await fetch(`/api/parties/${id}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: broadcastSubject,
          message: broadcastMessage,
          paymentId: broadcastPaymentId || undefined,
          currency: broadcastPricing.currency
        })
      })

      const data = await response.json()
      if (response.ok) {
        setBroadcastResult({ type: 'success', text: data.message || (locale === 'zh' ? '通知已发送' : 'Broadcast sent') })
        setBroadcastSubject('')
        setBroadcastMessage('')
        setBroadcastPaymentId(null)
        await fetchBroadcastUsage()
      } else {
        setBroadcastResult({ type: 'error', text: data.error || (locale === 'zh' ? '发送失败' : 'Failed to send broadcast') })
      }
    } catch (error) {
      setBroadcastResult({ type: 'error', text: locale === 'zh' ? '发送失败' : 'Failed to send broadcast' })
    } finally {
      setIsSendingBroadcast(false)
    }
  }

  const handleBroadcastClick = () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      setBroadcastResult({ type: 'error', text: locale === 'zh' ? '请填写标题和内容' : 'Please enter both subject and message' })
      return
    }
    if (needsBroadcastPayment) {
      setShowBroadcastPaymentModal(true)
    } else {
      sendBroadcast()
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

  const partyStart = resolvePartyStartDateTime(party)


  return (
    <main className="flex-1 px-4 py-4 lg:py-8 pb-8 lg:pb-8">
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

          <h1 className="font-display text-xl md:text-3xl font-bold text-neutral-900">
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
              {formatDate(partyStart, locale)}
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

        {/* Mobile: Stats at top - colored cards */}
        <div className="lg:hidden mb-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-3 text-center border border-primary-100">
              <div className="text-xl font-bold text-neutral-900">{party.stats.total}</div>
              <div className="text-[10px] text-primary-600 font-medium">{tr('totalInvited')}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-3 text-center border border-emerald-100">
              <div className="text-xl font-bold text-emerald-600">{party.stats.attending}</div>
              <div className="text-[10px] text-emerald-600 font-medium">{tr('attending')}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-3 text-center border border-red-100">
              <div className="text-xl font-bold text-red-500">{party.stats.notAttending}</div>
              <div className="text-[10px] text-red-500 font-medium">{locale === 'zh' ? '\u4e0d\u53c2\u52a0' : 'Declined'}</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-3 text-center border border-amber-100">
              <div className="text-xl font-bold text-amber-600">
                {party.stats.total > 0 ? Math.round(((party.stats.attending + party.stats.notAttending + party.stats.maybe) / party.stats.total) * 100) : 0}%
              </div>
              <div className="text-[10px] text-amber-600 font-medium">{tr('responseRate')}</div>
            </div>
          </div>
        </div>

        {/* Desktop: Two Column Layout / Mobile: Single Column */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-start">
          {/* Left Column: Invitation Preview + Quick Actions - Sticky on desktop */}
          <div className="lg:w-[420px] xl:w-[480px] flex-shrink-0 space-y-3 lg:sticky lg:top-4">
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
                {/* Change Template Button */}
                <Link
                  href={`/${locale}/party/${party.id}/template`}
                  className="w-full mb-4 py-2.5 px-4 rounded-xl border border-primary-300 bg-primary-100 hover:bg-primary-200 text-primary-800 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t('dashboard.changeTemplate')}
                </Link>

                {qrCode && party ? (
                  <InvitationTemplate
                    party={{
                      childName: party.childName,
                      childAge: party.childAge,
                      eventDatetime: party.eventDatetime,
                      eventLocalDate: party.eventLocalDate,
                      eventLocalTime: party.eventLocalTime,
                      eventEndDatetime: party.eventEndDatetime,
                      eventEndLocalDate: party.eventEndLocalDate,
                      eventEndLocalTime: party.eventEndLocalTime,
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
          <div className="flex-1 min-w-0 space-y-3">
            {/* Stats Cards - Desktop - 4 colored cards */}
            <div className="hidden lg:grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-5 text-center border border-primary-100">
                <div className="font-display text-3xl font-bold text-neutral-900">{party.stats.total}</div>
                <h3 className="text-sm text-primary-600 mt-1">{tr('totalInvited')}</h3>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 text-center border border-emerald-100">
                <div className="font-display text-3xl font-bold text-emerald-600">{party.stats.attending}</div>
                <h3 className="text-sm text-emerald-600 mt-1">{tr('attending')}</h3>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 text-center border border-red-100">
                <div className="font-display text-3xl font-bold text-red-500">{party.stats.notAttending}</div>
                <h3 className="text-sm text-red-500 mt-1">{locale === 'zh' ? '\u4e0d\u53c2\u52a0' : 'Declined'}</h3>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 text-center border border-amber-100">
                <div className="font-display text-3xl font-bold text-amber-600">
                  {party.stats.total > 0 ? Math.round(((party.stats.attending + party.stats.notAttending + party.stats.maybe) / party.stats.total) * 100) : 0}%
                </div>
                <h3 className="text-sm text-amber-600 mt-1">{tr('responseRate')}</h3>
              </div>
            </div>


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
              <h2 className="text-lg lg:text-xl font-semibold text-neutral-900 mb-4">
                {locale === 'zh' ? '\u7fa4\u53d1\u901a\u77e5' : 'Broadcast Notification'}
              </h2>
              <p className="text-sm text-neutral-600 mb-3">
                {locale === 'zh'
                  ? `\u6bcf\u5929\u514d\u8d39 1 \u6761\u7fa4\u53d1\uff0c\u989d\u5916\u6bcf\u6761 ${formatPrice(broadcastPricing.price, broadcastPricing.currency, locale)}\u3002`
                  : `1 free broadcast per day; each additional one is ${formatPrice(broadcastPricing.price, broadcastPricing.currency, locale)}.`}
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="input"
                  maxLength={120}
                  placeholder={locale === 'zh' ? '\u90ae\u4ef6\u6807\u9898\uff083-120\u5b57\uff09' : 'Email subject (3-120 chars)'}
                />
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="input"
                  rows={4}
                  maxLength={1000}
                  placeholder={locale === 'zh' ? '\u901a\u77e5\u5185\u5bb9\uff083-1000\u5b57\uff09' : 'Message content (3-1000 chars)'}
                />
                {broadcastResult && (
                  <div className={`p-2 rounded text-sm ${broadcastResult.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {broadcastResult.text}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleBroadcastClick}
                    disabled={isSendingBroadcast}
                    className={`btn disabled:opacity-50 ${needsBroadcastPayment
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
                      : 'btn-primary'}`}
                  >
                    {isSendingBroadcast
                      ? (locale === 'zh' ? '\u53d1\u9001\u4e2d...' : 'Sending...')
                      : needsBroadcastPayment
                        ? (locale === 'zh' ? `\u53d1\u9001\u901a\u77e5 (${formatPrice(broadcastPricing.price, broadcastPricing.currency, locale)})` : `Send Broadcast (${formatPrice(broadcastPricing.price, broadcastPricing.currency, locale)})`)
                        : (locale === 'zh' ? '\u53d1\u9001\u901a\u77e5' : 'Send Broadcast')}
                  </button>
                </div>
              </div>
            </div>

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
                            <div className="font-medium text-neutral-900">{guest.childName}</div>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${guest.rsvp?.status === 'YES'
                            ? 'bg-green-100 text-green-700'
                            : guest.rsvp?.status === 'NO'
                              ? 'bg-red-100 text-red-700'
                              : guest.rsvp?.status === 'MAYBE'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}>
                            {guest.rsvp?.status === 'YES' ? 'Yes ' : guest.rsvp?.status === 'NO' ? 'No ' : ''}{guest.rsvp?.status || 'Pending'}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 space-y-0.5">
                          <div>{getGuestEmailDisplay(guest.email)}</div>
                          {guest.phone && <div>{formatPhoneDisplay(guest.phone)}</div>}
                          {guest.rsvp && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded">{guest.rsvp.numChildren} {locale === 'zh' ? '\u4e2a\u5b69\u5b50' : 'child'}</span>
                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded">{guest.rsvp.parentStaying ? (locale === 'zh' ? '\u5bb6\u957f\u966a\u540c' : 'Parent stays') : (locale === 'zh' ? '\u4e0d\u966a\u540c' : 'Drop-off')}</span>
                            </div>
                          )}
                          {guest.rsvp?.allergies && (
                            <div className="text-red-600 mt-1">Warning: {guest.rsvp.allergies}</div>
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
                                <div className="font-medium text-neutral-900">{guest.childName}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm text-neutral-900">{getGuestEmailDisplay(guest.email)}</div>
                                {guest.phone && <div className="text-sm text-neutral-600">{formatPhoneDisplay(guest.phone)}</div>}
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
                                    <div className="text-red-600">Warning: {guest.rsvp.allergies}</div>
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

            {/* Photo Sharing - disabled */}
          </div>
        </div>
      </div>

      {/* Broadcast Payment Modal */}
      {showBroadcastPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowBroadcastPaymentModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-neutral-900">
                {locale === 'zh' ? '\u8d2d\u4e70\u989d\u5916\u53d1\u9001\u6b21\u6570' : 'Buy Extra Broadcast'}
              </h3>
              <button onClick={() => setShowBroadcastPaymentModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-neutral-600 mb-4">
              {locale === 'zh'
                ? '\u4eca\u65e5\u514d\u8d39\u6b21\u6570\u5df2\u7528\u5b8c\uff0c\u8d2d\u4e70\u540e\u53ef\u989d\u5916\u53d1\u9001 1 \u6b21\u7fa4\u53d1\u901a\u77e5\u3002'
                : 'Free daily broadcast used. Purchase 1 additional broadcast send.'}
            </p>

            <div className="text-center mb-4">
              <span className="text-2xl font-bold text-neutral-900">{formatPrice(broadcastPricing.price, broadcastPricing.currency, locale)}</span>
              <span className="text-sm text-neutral-500 ml-1">{broadcastPricing.currency}</span>
            </div>

            <PaymentForm
              amount={broadcastPricing.price}
              currency={broadcastPricing.currency}
              description={locale === 'zh' ? '\u989d\u5916\u7fa4\u53d1\u901a\u77e5' : 'Additional broadcast notification'}
              metadata={{
                partyId: party.id,
                feature: 'broadcast_extra',
                currency: broadcastPricing.currency,
              }}
              onSuccess={(paymentId) => {
                setBroadcastPaymentId(paymentId)
                setShowBroadcastPaymentModal(false)
                setBroadcastResult({ type: 'success', text: locale === 'zh' ? '\u4ed8\u6b3e\u6210\u529f\uff0c\u8bf7\u70b9\u51fb\u53d1\u9001' : 'Payment successful, click Send to broadcast' })
              }}
              onError={(msg) => setBroadcastResult({ type: 'error', text: msg })}
              onCancel={() => setShowBroadcastPaymentModal(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile Action Bar: sticky at page bottom section, not overlaying footer */}
      <div className="sticky bottom-0 bg-white border border-neutral-200 rounded-xl px-3 py-2 lg:hidden safe-area-bottom z-10 mt-3">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            onClick={copyRsvpLink}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-primary-600 bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {locale === 'zh' ? '\u5206\u4eab\u94fe\u63a5' : 'Share'}
          </button>
          <Link
            href={`/${locale}/party/${party.id}/edit`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {locale === 'zh' ? '\u7f16\u8f91' : 'Edit'}
          </Link>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm hover:bg-neutral-50 transition-colors"
            title={locale === 'zh' ? '\u5bfc\u51fa\u540d\u5355' : 'Export'}
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
