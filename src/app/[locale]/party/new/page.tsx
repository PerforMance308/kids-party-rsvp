'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import ContactReuse from '@/components/ContactReuse'
import TemplateSelectionLayout from '@/components/TemplateSelectionLayout'
import PaymentForm from '@/components/PaymentForm'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { useLocale, useLanguage } from '@/contexts/LanguageContext'
import { detectPreferredCurrency } from '@/lib/currency'
import { formatPhoneInput } from '@/lib/utils'
import type { SupportedCurrency, TemplatesApiResponse, InvitationTemplate as InvitationTemplateType } from '@/types/invitation-template'
import { getEffectivePrice } from '@/types/invitation-template'

interface Contact {
  id: string
  name: string
  childName: string
  email: string
  phone?: string
}

interface SelectedContactPayload {
  childName: string
  email: string
  phone?: string
}

interface Child {
  id: string
  name: string
  birthDate: string
  age: number
  gender?: 'boy' | 'girl'
  notes?: string
}

interface TemplateMeta {
  name: string
  price: number
  currency: string
  isFree: boolean
}

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function NewPartyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const { t } = useLanguage()
  const preSelectedChildId = searchParams.get('childId')

  // Step state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)

  // Step 1 form state
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState(preSelectedChildId || '')
  const [showLegacyForm, setShowLegacyForm] = useState(false)
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [rsvpCloseDate, setRsvpCloseDate] = useState('')
  const [rsvpCloseTime, setRsvpCloseTime] = useState('23:59')
  const [location, setLocation] = useState('')
  const [locationFull, setLocationFull] = useState('')
  const [theme, setTheme] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])

  // Legacy form fields
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState('')
  const [targetAge, setTargetAge] = useState('')
  const [childGender, setChildGender] = useState<'boy' | 'girl' | ''>('')

  // Step 2 state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplateMeta, setSelectedTemplateMeta] = useState<TemplateMeta | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrency>('USD')

  // Host phone (synced to user profile)
  const [hostPhone, setHostPhone] = useState('')

  // Shared state
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingChildren, setIsLoadingChildren] = useState(true)
  const [isRsvpCloseCustomized, setIsRsvpCloseCustomized] = useState(false)
  const [isFooterVisible, setIsFooterVisible] = useState(false)

  const handleEventTimeChange = (time: string) => {
    setEventTime(time)
    if (time) {
      const [hours, minutes] = time.split(':').map(Number)
      const endHours = (hours + 2) % 24
      setEventEndTime(`${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    }
  }

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId)
    const selectedChild = children.find(c => c.id === childId)
    if (selectedChild?.gender === 'boy' || selectedChild?.gender === 'girl') {
      setChildGender(selectedChild.gender)
    } else {
      setChildGender('')
    }
  }

  useEffect(() => {
    if (!eventDate || isRsvpCloseCustomized) return

    const closeDate = new Date(`${eventDate}T${eventTime || '23:59'}`)
    closeDate.setDate(closeDate.getDate() - 2)
    setRsvpCloseDate(toLocalDateInputValue(closeDate))
    setRsvpCloseTime(eventTime || '23:59')
  }, [eventDate, eventTime, isRsvpCloseCustomized])

  useEffect(() => {
    setPreferredCurrency(detectPreferredCurrency(locale))
  }, [locale])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login?redirect=/${locale}/party/new`)
      return
    }

    if (status === 'authenticated') {
      loadChildren()
      fetch('/api/profile')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.phone) setHostPhone(formatPhoneInput(data.phone)) })
        .catch(() => {})
    }
  }, [status, router])

  const loadChildren = async () => {
    try {
      const response = await fetch('/api/children')
      if (response.ok) {
        const data = await response.json()
        setChildren(data)

        if (data.length === 0) {
          setShowLegacyForm(true)
        }

        if (preSelectedChildId) {
          const preSelectedChild = data.find((c: Child) => c.id === preSelectedChildId)
          if (preSelectedChild?.gender === 'boy' || preSelectedChild?.gender === 'girl') {
            setChildGender(preSelectedChild.gender)
          }
        } else if (data.length === 1) {
          // Auto-select the only child
          setSelectedChildId(data[0].id)
          if (data[0].gender === 'boy' || data[0].gender === 'girl') {
            setChildGender(data[0].gender)
          }
        }
      } else {
        setError('Failed to load children')
      }
    } catch (error) {
      setError('An error occurred while loading children')
    } finally {
      setIsLoadingChildren(false)
    }
  }

  // Step 1: validate form and move to Step 2
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate child selection for non-legacy form
    if (!showLegacyForm && !selectedChildId) {
      setError(t('newParty.selectChildRequired'))
      return
    }

    setCurrentStep(2)
  }

  // Build the request body from Step 1 form state
  const buildRequestBody = (templateId: string, paymentId?: string) => {
    const selectedGuests: SelectedContactPayload[] = selectedContacts.map((contact) => ({
      childName: contact.childName || contact.name,
      email: contact.email,
      phone: contact.phone,
    }))

    const eventDatetime = new Date(`${eventDate}T${eventTime}`)
    let eventEndDatetime: Date | null = null
    if (eventEndTime) {
      eventEndDatetime = new Date(`${eventDate}T${eventEndTime}`)
      if (eventEndDatetime < eventDatetime) {
        eventEndDatetime.setDate(eventEndDatetime.getDate() + 1)
      }
    }
    const rsvpClosesAt = rsvpCloseDate
      ? new Date(`${rsvpCloseDate}T${rsvpCloseTime || '23:59'}`)
      : new Date(eventDatetime.getTime() - 2 * 24 * 60 * 60 * 1000)

    if (showLegacyForm) {
      return {
        childName,
        childAge: parseInt(childAge),
        eventDatetime: eventDatetime.toISOString(),
        eventLocalDate: eventDate,
        eventLocalTime: eventTime,
        eventEndDatetime: eventEndDatetime?.toISOString(),
        eventEndLocalDate: eventEndDatetime ? toLocalDateInputValue(eventEndDatetime) : undefined,
        eventEndLocalTime: eventEndTime || undefined,
        rsvpClosesAt: rsvpClosesAt.toISOString(),
        location,
        locationFull: locationFull || location,
        theme: theme || undefined,
        notes: notes || undefined,
        childGender: childGender || undefined,
        templateId,
        paymentId,
        paymentCurrency: selectedTemplateMeta?.currency,
        selectedGuests,
        hostPhone: hostPhone || undefined,
      }
    }

    return {
      childId: selectedChildId,
      eventDatetime: eventDatetime.toISOString(),
      eventLocalDate: eventDate,
      eventLocalTime: eventTime,
      eventEndDatetime: eventEndDatetime?.toISOString(),
      eventEndLocalDate: eventEndDatetime ? toLocalDateInputValue(eventEndDatetime) : undefined,
      eventEndLocalTime: eventEndTime || undefined,
      rsvpClosesAt: rsvpClosesAt.toISOString(),
      location,
      locationFull: locationFull || location,
      theme: theme || undefined,
      notes: notes || undefined,
      targetAge: targetAge ? parseInt(targetAge) : undefined,
      childGender: childGender || undefined,
      templateId,
      paymentId,
      paymentCurrency: selectedTemplateMeta?.currency,
      selectedGuests,
      hostPhone: hostPhone || undefined,
    }
  }

  // Create party via API
  const createParty = async (templateId: string, paymentId?: string) => {
    setIsLoading(true)
    setError('')

    try {
      const requestBody = buildRequestBody(templateId, paymentId)

      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const party = await response.json()

        router.push(`/${locale}/party/${party.id}/dashboard`)
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

  // Template selection handler
  const handleTemplateSelect = (templateId: string, meta: TemplateMeta) => {
    setSelectedTemplateId(templateId)
    setSelectedTemplateMeta(meta)
  }

  // Step 2 default template: preselect a free template by gender.
  useEffect(() => {
    const pickDefaultTemplate = async () => {
      if (currentStep !== 2 || selectedTemplateId) return

      try {
        const response = await fetch('/api/templates')
        if (!response.ok) return
        const data: TemplatesApiResponse = await response.json()
        const allTemplates = data.themes.flatMap((theme) => theme.templates)
        const freeTemplates = allTemplates.filter((tpl) => tpl.effectivePrice.isFree)
        if (freeTemplates.length === 0) return

        const normalizedGender = childGender || ''
        const genderMatched = normalizedGender
          ? freeTemplates.find((tpl) => tpl.id.toLowerCase().includes(normalizedGender))
          : null

        const fallbackFree = freeTemplates[0]
        const selected = (genderMatched || fallbackFree) as InvitationTemplateType
        const effectivePrice = getEffectivePrice(selected.config.pricing, preferredCurrency)

        setSelectedTemplateId(selected.id)
        setSelectedTemplateMeta({
          name: selected.name,
          price: effectivePrice.price,
          currency: effectivePrice.currency,
          isFree: effectivePrice.isFree,
        })
      } catch {
        // Keep selection empty if default-pick fails.
      }
    }

    pickDefaultTemplate()
  }, [currentStep, selectedTemplateId, childGender, preferredCurrency])

  // Step 2: free template -> create directly
  const handleFreeSubmit = () => {
    if (!selectedTemplateId) {
      setError(t('newParty.selectTemplateRequired'))
      return
    }
    createParty(selectedTemplateId)
  }

  // Step 2: paid template -> open payment modal
  const handlePayRequest = () => {
    if (!selectedTemplateId) {
      setError(t('newParty.selectTemplateRequired'))
      return
    }
    setShowPaymentModal(true)
  }

  // Payment success -> create party with paymentId
  const handlePaymentSuccess = (paymentId: string) => {
    setShowPaymentModal(false)
    if (selectedTemplateId) {
      createParty(selectedTemplateId, paymentId)
    }
  }

  const handleCreateClick = () => {
    if (!selectedTemplateId) {
      setError(t('newParty.selectTemplateRequired'))
      return
    }

    if (selectedTemplateMeta && !selectedTemplateMeta.isFree) {
      handlePayRequest()
      return
    }

    handleFreeSubmit()
  }

  // Reset viewport position when entering Step 2 so template area starts at top.
  useEffect(() => {
    if (currentStep === 2) {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [currentStep])

  // Lock background scroll when payment modal is open
  useEffect(() => {
    if (showPaymentModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showPaymentModal])

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return

    const observer = new IntersectionObserver(
      (entries) => {
        setIsFooterVisible(entries[0]?.isIntersecting ?? false)
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -48px 0px',
      }
    )

    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  if (status === 'loading' || isLoadingChildren) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">{t('home.loading')}</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const selectedChild = children.find((c) => c.id === selectedChildId)
  const previewChildName = showLegacyForm ? childName : (selectedChild?.name || '')
  const previewChildAge = showLegacyForm ? Number(childAge || 0) : (targetAge ? Number(targetAge) : (selectedChild?.age || 0))
  const previewEventDatetime = eventDate && eventTime
    ? new Date(`${eventDate}T${eventTime}`).toISOString()
    : new Date().toISOString()
  const previewEventEndDatetime = eventDate && eventEndTime
    ? new Date(`${eventDate}T${eventEndTime}`).toISOString()
    : undefined

  if (currentStep === 2) {
    return (
      <main className="flex-1 px-4 py-4 lg:py-4">
        <div className="max-w-7xl mx-auto">
          <button
            type="button"
            onClick={() => { setCurrentStep(1); setError('') }}
            className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-3"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {locale === 'zh' ? '返回' : 'Back'}
          </button>

          <TemplateSelectionLayout
            locale={locale}
            selectedTemplateId={selectedTemplateId}
            previewParty={{
              childName: previewChildName || 'Child',
              childAge: previewChildAge,
              eventDatetime: previewEventDatetime,
              eventLocalDate: eventDate || undefined,
              eventLocalTime: eventTime || undefined,
              eventEndDatetime: previewEventEndDatetime,
              eventEndLocalDate: previewEventEndDatetime && eventEndTime ? toLocalDateInputValue(new Date(previewEventEndDatetime)) : undefined,
              eventEndLocalTime: eventEndTime || undefined,
              location: location || 'Party Location',
              theme: theme || undefined,
              notes: notes || undefined,
            }}
            onTemplateSelect={handleTemplateSelect}
          />

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

        </div>

        <div className="pointer-events-none sticky bottom-6 z-30 mt-4 hidden justify-end sm:flex">
          <button
            type="button"
            onClick={handleCreateClick}
            disabled={isLoading}
            className="pointer-events-auto inline-flex h-11 items-center justify-center rounded-full bg-primary-600 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(168,85,247,0.24)] transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              </span>
            ) : (
              'Create'
            )}
          </button>
        </div>

        <div className={`${isFooterVisible ? 'hidden' : 'fixed'} bottom-[calc(0.4rem+env(safe-area-inset-bottom))] right-4 z-30 sm:hidden`}>
          <button
            type="button"
            onClick={handleCreateClick}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary-600 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(168,85,247,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              </span>
            ) : (
              'Create'
            )}
          </button>
        </div>

        {showPaymentModal && selectedTemplateMeta && selectedTemplateId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[120]">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-center text-neutral-900 mb-4">
                    {locale === 'zh' ? '购买模板' : 'Purchase Template'}
                  </h3>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg mb-4">
                    <h4 className="font-medium text-orange-800">{selectedTemplateMeta.name}</h4>
                    <p className="text-lg font-bold text-orange-600 mt-1">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: selectedTemplateMeta.currency,
                      }).format(selectedTemplateMeta.price)}
                    </p>
                  </div>
                </div>

                <PaymentForm
                  amount={selectedTemplateMeta.price}
                  currency={selectedTemplateMeta.currency}
                  description={`Premium template: ${selectedTemplateMeta.name}`}
                  metadata={{
                    feature: 'template',
                    templateId: selectedTemplateId,
                    currency: selectedTemplateMeta.currency,
                    flow: 'party_create',
                  }}
                  onSuccess={handlePaymentSuccess}
                  onError={(err) => console.error('Payment error:', err)}
                  onCancel={() => setShowPaymentModal(false)}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 md:p-8 shadow-sm">
          {/* Header with step indicator */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-neutral-900">
              {t('newParty.title')}
            </h1>
            <p className="text-neutral-500 mt-2">
              {t('newParty.subtitle')}
            </p>
          </div>

          {/* Step 1: Party Details Form */}
          {currentStep === 1 && (
            <>
              <ContactReuse onContactsSelected={setSelectedContacts} />

              <form onSubmit={handleStep1Submit} className="space-y-6">
                {!showLegacyForm && children.length > 0 ? (
                  <div>
                    <label htmlFor="childSelect" className="block text-sm font-medium text-neutral-700 mb-1">
                      {t('newParty.selectChild')} *
                    </label>
                    <select
                      id="childSelect"
                      value={selectedChildId}
                      onChange={(e) => handleChildSelect(e.target.value)}
                      className="input"
                      required
                      autoFocus
                    >
                      <option value="">{t('newParty.chooseChild')}</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.gender === 'boy' ? '♂ ' : child.gender === 'girl' ? '♀ ' : ''}{child.name} ({child.age} {t('children.years')})
                        </option>
                      ))}
                    </select>
                    <div className="mt-4">
                      <label htmlFor="targetAge" className="block text-sm font-medium text-neutral-700 mb-1">
                        {t('newParty.celebratingAge')}
                      </label>
                      <input
                        type="number"
                        id="targetAge"
                        value={targetAge}
                        onChange={(e) => setTargetAge(e.target.value)}
                        className="input"
                        placeholder={t('newParty.agePlaceholder')}
                        min="1"
                        max="99"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        {t('newParty.ageHelp')}
                      </p>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/${locale}/children`)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        {t('newParty.addNewChild')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLegacyForm(true)}
                        className="text-sm text-neutral-600 hover:text-neutral-700"
                      >
                        {t('newParty.enterManually')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="childName" className="block text-sm font-medium text-neutral-700 mb-1">
                          {t('newParty.childName')} *
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
                          {t('newParty.age')} *
                        </label>
                        <input
                          type="number"
                          id="childAge"
                          value={childAge}
                          onChange={(e) => setChildAge(e.target.value)}
                          className="input"
                          min="1"
                          max="99"
                          required
                        />
                      </div>
                    </div>
                    {children.length > 0 && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowLegacyForm(false)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {t('newParty.selectExisting')}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Gender Selection */}
                <div>
                  <label id="gender-label" className="block text-sm font-medium text-neutral-700 mb-2">
                    {locale === 'zh' ? '孩子性别' : 'Child Gender'}
                  </label>
                  <div className="flex gap-3" role="group" aria-labelledby="gender-label">
                    <button
                      type="button"
                      onClick={() => setChildGender('boy')}
                      aria-label={locale === 'zh' ? '选择男孩' : 'Select boy'}
                      aria-pressed={childGender === 'boy'}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        childGender === 'boy'
                          ? 'border-blue-400 bg-blue-50 shadow-md shadow-blue-500/10'
                          : 'border-neutral-200 hover:border-blue-200 hover:bg-blue-50/50'
                      }`}
                    >
                      <span className="text-xl">👦</span>
                      <span className={`text-sm font-medium ${childGender === 'boy' ? 'text-blue-700' : 'text-neutral-600'}`}>
                        {locale === 'zh' ? '男孩' : 'Boy'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChildGender('girl')}
                      aria-label={locale === 'zh' ? '选择女孩' : 'Select girl'}
                      aria-pressed={childGender === 'girl'}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                        childGender === 'girl'
                          ? 'border-pink-400 bg-pink-50 shadow-md shadow-pink-500/10'
                          : 'border-neutral-200 hover:border-pink-200 hover:bg-pink-50/50'
                      }`}
                    >
                      <span className="text-xl">👧</span>
                      <span className={`text-sm font-medium ${childGender === 'girl' ? 'text-pink-700' : 'text-neutral-600'}`}>
                        {locale === 'zh' ? '女孩' : 'Girl'}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="eventDate" className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('newParty.date')} *
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="eventTime" className="block text-sm font-medium text-neutral-700 mb-1">
                      {t('newParty.startTime')} *
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
                      {t('newParty.endTime')}
                    </label>
                    <input
                      type="time"
                      id="eventEndTime"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className="input"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      {t('newParty.endTimeHelp')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rsvpCloseDate" className="block text-sm font-medium text-neutral-700 mb-1">
                      {locale === 'zh' ? '扫码回复截止日期' : 'RSVP close date'}
                    </label>
                    <input
                      type="date"
                      id="rsvpCloseDate"
                      value={rsvpCloseDate}
                      onChange={(e) => {
                        setRsvpCloseDate(e.target.value)
                        setIsRsvpCloseCustomized(true)
                      }}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="rsvpCloseTime" className="block text-sm font-medium text-neutral-700 mb-1">
                      {locale === 'zh' ? '扫码回复截止时间' : 'RSVP close time'}
                    </label>
                    <input
                      type="time"
                      id="rsvpCloseTime"
                      value={rsvpCloseTime}
                      onChange={(e) => {
                        setRsvpCloseTime(e.target.value)
                        setIsRsvpCloseCustomized(true)
                      }}
                      className="input"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      {locale === 'zh' ? '默认是派对开始前 2 天，可按需调整。' : 'Defaults to 2 days before the party starts, and you can adjust it.'}
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('newParty.location')} *
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
                    placeholder={t('newParty.locationPlaceholder')}
                    locale={locale}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('newParty.theme')}
                  </label>
                  <input
                    type="text"
                    id="theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="input"
                    placeholder={t('newParty.themePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('newParty.notes')}
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder={t('newParty.notesPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="hostPhone" className="block text-sm font-medium text-neutral-700 mb-1">
                    {locale === 'zh' ? '您的联系电话' : 'Your contact phone'}
                  </label>
                  <input
                    type="tel"
                    id="hostPhone"
                    value={hostPhone}
                    onChange={(e) => setHostPhone(formatPhoneInput(e.target.value))}
                    className="input"
                    placeholder="(123) 456-7890"
                    maxLength={14}
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    {locale === 'zh' ? '会显示在客人的邀请页面，并保存到您的账号' : 'Shown on guests\' invitation page, saved to your account'}
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn btn-secondary flex-1 sm:flex-none"
                  >
                    {t('newParty.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 sm:flex-none"
                  >
                    {t('newParty.nextStep')}
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedTemplateMeta && selectedTemplateId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-center text-neutral-900 mb-4">
                  {locale === 'zh' ? '购买模板' : 'Purchase Template'}
                </h3>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg mb-4">
                  <h4 className="font-medium text-orange-800">{selectedTemplateMeta.name}</h4>
                  <p className="text-lg font-bold text-orange-600 mt-1">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: selectedTemplateMeta.currency,
                    }).format(selectedTemplateMeta.price)}
                  </p>
                </div>
              </div>

              <PaymentForm
                amount={selectedTemplateMeta.price}
                currency={selectedTemplateMeta.currency}
                description={`Premium template: ${selectedTemplateMeta.name}`}
                metadata={{
                  feature: 'template',
                  templateId: selectedTemplateId,
                  flow: 'party_create',
                }}
                onSuccess={handlePaymentSuccess}
                onError={(error) => console.error('Payment error:', error)}
                onCancel={() => setShowPaymentModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
