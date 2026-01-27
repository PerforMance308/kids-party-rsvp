'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import ContactReuse from '@/components/ContactReuse'
import { useLocale, useLanguage } from '@/contexts/LanguageContext'

interface Contact {
  id: string
  parentName: string
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

export default function NewPartyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const { t } = useLanguage()
  const preSelectedChildId = searchParams.get('childId')

  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState(preSelectedChildId || '')
  const [showLegacyForm, setShowLegacyForm] = useState(false)
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [theme, setTheme] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingChildren, setIsLoadingChildren] = useState(true)
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])

  // Legacy form fields
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState('')
  const [targetAge, setTargetAge] = useState('')
  const [childGender, setChildGender] = useState<'boy' | 'girl' | ''>('')

  // 当开始时间变化时，自动调整结束时间（保持2小时间隔）
  const handleEventTimeChange = (time: string) => {
    setEventTime(time)
    if (time) {
      const [hours, minutes] = time.split(':').map(Number)
      const endHours = (hours + 2) % 24
      setEventEndTime(`${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    }
  }

  // 当选择孩子时，自动设置性别
  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId)
    const selectedChild = children.find(c => c.id === childId)
    if (selectedChild?.gender) {
      setChildGender(selectedChild.gender)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login?redirect=/${locale}/party/new`)
      return
    }

    if (status === 'authenticated') {
      loadChildren()
    }
  }, [status, router])

  const loadChildren = async () => {
    try {
      const response = await fetch('/api/children')
      if (response.ok) {
        const data = await response.json()
        setChildren(data)

        // If no children exist, show legacy form
        if (data.length === 0) {
          setShowLegacyForm(true)
        }

        // If there's a pre-selected child, auto-set gender
        if (preSelectedChildId) {
          const preSelectedChild = data.find((c: Child) => c.id === preSelectedChildId)
          if (preSelectedChild?.gender) {
            setChildGender(preSelectedChild.gender)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const eventDatetime = new Date(`${eventDate}T${eventTime}`)
      // 计算结束时间
      let eventEndDatetime: Date | null = null
      if (eventEndTime) {
        eventEndDatetime = new Date(`${eventDate}T${eventEndTime}`)
        // 如果结束时间小于开始时间，说明跨天了
        if (eventEndDatetime < eventDatetime) {
          eventEndDatetime.setDate(eventEndDatetime.getDate() + 1)
        }
      }

      let requestBody
      if (showLegacyForm) {
        // Legacy form submission
        requestBody = {
          childName,
          childAge: parseInt(childAge),
          eventDatetime: eventDatetime.toISOString(),
          eventEndDatetime: eventEndDatetime?.toISOString(),
          location,
          theme: theme || undefined,
          notes: notes || undefined,
          childGender: childGender || undefined,
        }
      } else {
        // New form submission with child selection
        if (!selectedChildId) {
          setError(t('newParty.selectChildRequired'))
          setIsLoading(false)
          return
        }

        requestBody = {
          childId: selectedChildId,
          eventDatetime: eventDatetime.toISOString(),
          eventEndDatetime: eventEndDatetime?.toISOString(),
          location,
          theme: theme || undefined,
          notes: notes || undefined,
          targetAge: targetAge ? parseInt(targetAge) : undefined,
          childGender: childGender || undefined,
        }
      }

      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">
              {t('newParty.title')}
            </h1>
            <p className="text-neutral-600 mt-2">
              {t('newParty.subtitle')}
            </p>
          </div>

          <ContactReuse onContactsSelected={setSelectedContacts} />

          <form onSubmit={handleSubmit} className="space-y-6">
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
                    max="18"
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
                      max="18"
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
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {locale === 'zh' ? '孩子性别' : 'Child Gender'}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setChildGender('boy')}
                  className={`flex items-center justify-center w-14 h-14 rounded-xl border-2 transition-all ${
                    childGender === 'boy'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <span className={`text-2xl ${childGender === 'boy' ? 'text-blue-500' : 'text-blue-400'}`}>♂</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChildGender('girl')}
                  className={`flex items-center justify-center w-14 h-14 rounded-xl border-2 transition-all ${
                    childGender === 'girl'
                      ? 'border-pink-500 bg-pink-50 shadow-md'
                      : 'border-neutral-200 hover:border-pink-300 hover:bg-pink-50/50'
                  }`}
                >
                  <span className={`text-2xl ${childGender === 'girl' ? 'text-pink-500' : 'text-pink-400'}`}>♀</span>
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

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">
                {t('newParty.location')} *
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input"
                placeholder={t('newParty.locationPlaceholder')}
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
                {t('newParty.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary disabled:opacity-50"
              >
                {isLoading ? t('newParty.creating') : t('newParty.createParty')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}