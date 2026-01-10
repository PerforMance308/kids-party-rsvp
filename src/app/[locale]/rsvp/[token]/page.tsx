'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useLocale, useLanguage, useTranslations } from '@/contexts/LanguageContext'

interface Party {
  id: string
  childName: string
  childAge: number
  eventDatetime: string
  location: string
  theme?: string
  notes?: string
}

export default function RSVPPage() {
  const { token } = useParams()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [party, setParty] = useState<Party | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { t } = useLanguage()
  const locale = useLocale()
  const tr = useTranslations('rsvp')
  const [rsvpIntent, setRsvpIntent] = useState<'ATTENDING' | 'NOT_ATTENDING' | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [userChildren, setUserChildren] = useState<any[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [showManualForm, setShowManualForm] = useState(false)
  const [showAddChild, setShowAddChild] = useState(false)

  // Quick add child form state
  const [newChildName, setNewChildName] = useState('')
  const [newChildBirthDate, setNewChildBirthDate] = useState('')
  const [newChildAllergies, setNewChildAllergies] = useState('')
  const [newChildNotes, setNewChildNotes] = useState('')
  const [isAddingChild, setIsAddingChild] = useState(false)

  // Registration form state
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Form state
  const [parentName, setParentName] = useState('')
  const [childName, setChildName] = useState('')
  const [phone, setPhone] = useState('')
  const [rsvpStatus, setRsvpStatus] = useState<'YES' | 'NO' | 'MAYBE'>('YES')
  const [numChildren, setNumChildren] = useState(1)
  const [parentStaying, setParentStaying] = useState(true)
  const [allergies, setAllergies] = useState('')
  const [message, setMessage] = useState('')

  // Refs for auto-scrolling
  const authSectionRef = useRef<HTMLDivElement>(null)
  const notAttendingFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadParty = async () => {
      if (!token) return

      try {
        // Load party details
        const partyResponse = await fetch(`/api/rsvp/${token}`)
        if (partyResponse.ok) {
          const data = await partyResponse.json()
          setParty(data)
        } else {
          setError(t('rsvp.invitationNotFound'))
        }
      } catch (error) {
        setError(t('error.loadingError'))
      } finally {
        setIsLoading(false)
      }
    }

    loadParty()
  }, [token])

  // Get authentication status from NextAuth session
  const isAuthenticated = sessionStatus === 'authenticated' && session?.user?.id

  useEffect(() => {
    const loadUserChildren = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch('/api/children')
          if (response.ok) {
            const data = await response.json()
            setUserChildren(data)

            // If no children, show manual form
            if (data.length === 0) {
              setShowManualForm(true)
            }
          }
        } catch (error) {
          console.error('Failed to load user children:', error)
        }
      }
    }

    loadUserChildren()
  }, [isAuthenticated])

  // Auto-fill parent name when session is available
  useEffect(() => {
    if (isAuthenticated && session?.user?.name && !parentName) {
      setParentName(session.user.name)
    }
  }, [isAuthenticated, session?.user?.name, parentName])

  // Auto-scroll when RSVP intent is selected
  useEffect(() => {
    if (rsvpIntent === 'ATTENDING' && authSectionRef.current) {
      setTimeout(() => {
        authSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    } else if (rsvpIntent === 'NOT_ATTENDING' && notAttendingFormRef.current) {
      setTimeout(() => {
        notAttendingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [rsvpIntent])

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingChild(true)
    setError('')

    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newChildName,
          birthDate: newChildBirthDate,
          allergies: newChildAllergies || undefined,
          notes: newChildNotes || undefined,
        }),
      })

      if (response.ok) {
        const newChild = await response.json()

        // Update children list
        const updatedChildren = [newChild, ...userChildren]
        setUserChildren(updatedChildren)

        // Auto-select the new child
        setSelectedChildId(newChild.id)

        // Reset form and hide add child form
        setNewChildName('')
        setNewChildBirthDate('')
        setNewChildAllergies('')
        setNewChildNotes('')
        setShowAddChild(false)
        setShowManualForm(false)

      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add child')
      }
    } catch (error) {
      setError('An error occurred while adding child')
    } finally {
      setIsAddingChild(false)
    }
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (!agreedToTerms) {
      setError(t('register.agreeToTerms'))
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
        }),
      })

      if (response.ok) {
        // Registration successful, auto sign in
        const result = await signIn('credentials', {
          email: regEmail,
          password: regPassword,
          redirect: false,
        })

        if (result?.ok) {
          setShowRegistration(false)
          setError('')
          // Refresh to update session state
          router.refresh()
          // Force reload to ensure session is picked up if refresh isn't enough
          window.location.reload()
        } else {
          setError('Registration successful but auto-login failed. Please try signing in.')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('An error occurred during registration.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-fill allergies when child is selected
  useEffect(() => {
    if (selectedChildId && userChildren.length > 0) {
      const selectedChild = userChildren.find(child => child.id === selectedChildId)
      if (selectedChild?.allergies && !allergies) {
        setAllergies(selectedChild.allergies)
      }
    }
  }, [selectedChildId, userChildren, allergies])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      let requestBody

      if (selectedChildId && !showManualForm) {
        // Using child selection
        const selectedChild = userChildren.find(child => child.id === selectedChildId)
        if (!selectedChild) {
          setError('Please select a child')
          setIsSubmitting(false)
          return
        }

        requestBody = {
          parentName: parentName || session?.user?.name,
          childName: selectedChild.name,
          childId: selectedChildId,
          phone: phone || undefined,
          status: rsvpStatus,
          numChildren,
          parentStaying,
          allergies: allergies || selectedChild.allergies || undefined,
          message: message || undefined,
        }
      } else {
        // Manual form
        requestBody = {
          parentName,
          childName,
          phone: phone || undefined,
          status: rsvpStatus,
          numChildren,
          parentStaying,
          allergies: allergies || undefined,
          message: message || undefined,
        }
      }

      const response = await fetch(`/api/rsvp/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit RSVP')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">{t('home.loading')}</div>
      </div>
    )
  }

  if (!party) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">
            {tr('invitationNotFound')}
          </h1>
          <p className="text-neutral-600">
            {tr('invitationNotFoundDesc')}
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="card">
            <div className="text-center mb-6">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                {tr('submittedTitle')}
              </h1>
              <p className="text-neutral-600">
                {tr('submittedDesc')}
              </p>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-neutral-900 mb-2">
                {party.childName}'s {party.childAge}th Birthday Party
              </h3>
              <p className="text-sm text-neutral-600 mb-1">
                {formatDate(new Date(party.eventDatetime), t('locale') || 'zh')}
              </p>
              <p className="text-sm text-neutral-600">
                {party.location}
              </p>
            </div>

            <Link
              href={`/${locale}/party/guest/${token}`}
              className="w-full btn btn-primary block text-center"
            >
              {tr('goGuestPage')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              {tr('title')}
            </h1>
            <div className="bg-primary-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-primary-900 mb-2">
                {party.childName}'s {party.childAge}th Birthday Party
              </h2>
              {party.theme && (
                <p className="text-primary-700 mb-2">{party.theme} Theme</p>
              )}
              <div className="space-y-1 text-sm text-primary-800">
                <p><strong>{tr('when')}</strong> {formatDate(new Date(party.eventDatetime), t('locale') || 'zh')}</p>
                <p><strong>{tr('where')}</strong> {party.location}</p>
              </div>
              {party.notes && (
                <div className="mt-3 p-3 bg-white rounded text-sm text-neutral-700">
                  <strong>{tr('specialNotes')}</strong> {party.notes}
                </div>
              )}
            </div>
          </div>

          {/* RSVP Intent Selection - Directly under party info */}
          {!isAuthenticated && !rsvpIntent && (
            <div className="border-t pt-4">
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setRsvpIntent('ATTENDING')}
                  className="btn btn-primary px-6 py-2"
                >
                  我会去
                </button>
                <button
                  onClick={() => {
                    setRsvpIntent('NOT_ATTENDING')
                    setRsvpStatus('NO')
                  }}
                  className="btn btn-secondary px-6 py-2"
                >
                  不能去
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Registration/Login Step - Only show if attending */}
        {!isAuthenticated && rsvpIntent === 'ATTENDING' && (
          <div ref={authSectionRef} className="card mb-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {tr('createAccountTitle')}
              </h3>
              <p className="text-neutral-600 text-sm">
                {tr('createAccountDesc')}
              </p>
            </div>

            {!showRegistration ? (
              <div className="space-y-4">
                <p className="text-center text-neutral-700">
                  {tr('haveAccount')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowRegistration(true)}
                    className="btn btn-primary flex-1"
                  >
                    {tr('createAccountBtn')}
                  </button>
                  <a
                    href={`/login/redirect=${encodeURIComponent(`/rsvp/${token}`)}`}
                    className="btn btn-secondary flex-1 text-center"
                  >
                    {tr('signInBtn')}
                  </a>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => setRsvpIntent(null)}
                    className="text-sm text-neutral-600 hover:text-neutral-800"
                  >
                    ← {tr('backToSelection') || 'Back'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegistration} className="space-y-4">
                <div>
                  <label htmlFor="regEmail" className="block text-sm font-medium text-neutral-700 mb-1">
                    {tr('emailLabel')}
                  </label>
                  <input
                    type="email"
                    id="regEmail"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="input"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="regPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                    {tr('passwordLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      id="regPassword"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="input pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                    >
                      {showRegPassword ? (
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-sm text-neutral-500 mt-1">
                    <p className="font-medium mb-1">{t('register.passwordRequirements')}</p>
                    <ul className="text-xs space-y-0.5">
                      <li>• {t('register.atLeast8Chars')}</li>
                      <li>• {t('register.oneUppercase')} (A-Z)</li>
                      <li>• {t('register.oneLowercase')} (a-z)</li>
                      <li>• {t('register.oneNumber')} (0-9)</li>
                      <li>• {t('register.oneNumber')} (!@#$%^&*)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="terms" className="text-sm text-neutral-600">
                    {t('register.iAgreeTo')}{' '}
                    <Link href={`/${locale}/terms`} className="text-primary-600 hover:underline" target="_blank">
                      {t('register.termsOfService')}
                    </Link>{' '}
                    {t('common.and')}{' '}
                    <Link href={`/${locale}/privacy`} className="text-primary-600 hover:underline" target="_blank">
                      {t('register.privacyPolicy')}
                    </Link>
                  </label>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? tr('creatingAccount') : tr('createAndContinue')}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowRegistration(false)}
                    className="text-sm text-neutral-600 hover:text-neutral-800"
                  >
                    {tr('backToOptions')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Not Attending Form - Simple form without login */}
        {!isAuthenticated && rsvpIntent === 'NOT_ATTENDING' && (
          <div ref={notAttendingFormRef} className="card mb-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                很遗憾你不能来！
              </h3>
              <p className="text-neutral-600 text-sm">
                可以选择留下您的姓名和留言（可选）
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="parentName" className="block text-sm font-medium text-neutral-700 mb-1">
                    家长姓名 (可选)
                  </label>
                  <input
                    type="text"
                    id="parentName"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="input"
                    placeholder="您的姓名"
                  />
                </div>

                <div>
                  <label htmlFor="childName" className="block text-sm font-medium text-neutral-700 mb-1">
                    孩子姓名 (可选)
                  </label>
                  <input
                    type="text"
                    id="childName"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="input"
                    placeholder="孩子的姓名"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">
                  留言 (可选)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="给主办方留言..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRsvpIntent(null)}
                  className="btn btn-secondary flex-1"
                >
                  ← 返回
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {isSubmitting ? '提交中...' : '提交回复'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Add Child Form */}
        {isAuthenticated && showAddChild && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-neutral-900">
                {t('children.addChild')}
              </h3>
              <button
                onClick={() => setShowAddChild(false)}
                className="text-neutral-600 hover:text-neutral-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddChild} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newChildName" className="block text-sm font-medium text-neutral-700 mb-1">
                    {tr('childNameLabel')}
                  </label>
                  <input
                    type="text"
                    id="newChildName"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    className="input"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="newChildBirthDate" className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('children.birthDate')} *
                  </label>
                  <input
                    type="date"
                    id="newChildBirthDate"
                    value={newChildBirthDate}
                    onChange={(e) => setNewChildBirthDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newChildAllergies" className="block text-sm font-medium text-neutral-700 mb-1">
                  {t('children.allergies')}
                </label>
                <input
                  type="text"
                  id="newChildAllergies"
                  value={newChildAllergies}
                  onChange={(e) => setNewChildAllergies(e.target.value)}
                  className="input"
                  placeholder="e.g., nuts, dairy, gluten-free, vegetarian"
                />
              </div>

              <div>
                <label htmlFor="newChildNotes" className="block text-sm font-medium text-neutral-700 mb-1">
                  {t('children.notes')} ({t('newParty.notesPlaceholder').split('...')[0]})
                </label>
                <input
                  type="text"
                  id="newChildNotes"
                  value={newChildNotes}
                  onChange={(e) => setNewChildNotes(e.target.value)}
                  className="input"
                  placeholder="Any special notes about interests, preferences, etc."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddChild(false)}
                  className="btn btn-secondary flex-1"
                >
                  {tr('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isAddingChild}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {isAddingChild ? t('children.saving') : t('children.addChild')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* RSVP Form - Only show if authenticated */}
        {isAuthenticated && !showAddChild && (
          <div className="card">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              {tr('pleaseRSVP')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!showManualForm && userChildren.length > 0 ? (
                <>
                  <div>
                    <label htmlFor="parentName" className="block text-sm font-medium text-neutral-700 mb-1">
                      {tr('parentNameLabel')}
                    </label>
                    <input
                      type="text"
                      id="parentName"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="input"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="childSelect" className="block text-sm font-medium text-neutral-700 mb-1">
                      {tr('childSelectLabel')}
                    </label>
                    <select
                      id="childSelect"
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="input"
                      required
                    >
                      <option value="">{t('newParty.chooseChild')}</option>
                      {userChildren.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name} ({child.age} {t('children.years')})
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 flex gap-4">
                      <button
                        type="button"
                        onClick={() => setShowAddChild(true)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        {tr('createAccountBtn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualForm(true)}
                        className="text-sm text-neutral-600 hover:text-neutral-700"
                      >
                        {t('newParty.enterManually')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="parentName" className="block text-sm font-medium text-neutral-700 mb-1">
                        {tr('parentNameLabel')}
                      </label>
                      <input
                        type="text"
                        id="parentName"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        className="input"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label htmlFor="childName" className="block text-sm font-medium text-neutral-700 mb-1">
                        {tr('childNameLabel')}
                      </label>
                      <input
                        type="text"
                        id="childName"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="input"
                        required
                      />
                    </div>
                  </div>
                  {userChildren.length > 0 && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowManualForm(false)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        {t('newParty.selectExisting')}
                      </button>
                    </div>
                  )}
                </>
              )}

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                  {tr('phoneLabel')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  placeholder={tr('phonePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  {tr('attendingLabel')}
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {(['YES', 'NO', 'MAYBE'] as const).map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="rsvpStatus"
                        value={option}
                        checked={rsvpStatus === option}
                        onChange={(e) => setRsvpStatus(e.target.value as 'YES' | 'NO' | 'MAYBE')}
                        className="mr-2"
                      />
                      <span className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer flex-1 text-center ${rsvpStatus === option
                        ? option === 'YES'
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : option === 'NO'
                            ? 'bg-red-100 text-red-800 border-2 border-red-300'
                            : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                        : 'bg-neutral-100 text-neutral-600 border-2 border-transparent'
                        }`}>
                        {option === 'YES' ? tr('yes') : option === 'NO' ? tr('no') : tr('maybe')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {rsvpStatus !== 'NO' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="numChildren" className="block text-sm font-medium text-neutral-700 mb-1">
                        {tr('numChildrenLabel')}
                      </label>
                      <input
                        type="number"
                        id="numChildren"
                        value={numChildren}
                        onChange={(e) => setNumChildren(parseInt(e.target.value))}
                        className="input"
                        min="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-3">
                        {tr('parentStayingLabel')}
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="parentStaying"
                            checked={parentStaying}
                            onChange={() => setParentStaying(true)}
                            className="mr-2"
                          />
                          {tr('parentStayingYes')}
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="parentStaying"
                            checked={!parentStaying}
                            onChange={() => setParentStaying(false)}
                            className="mr-2"
                          />
                          {tr('parentStayingNo')}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="allergies" className="block text-sm font-medium text-neutral-700 mb-1">
                      {tr('allergiesLabel')}
                    </label>
                    <input
                      type="text"
                      id="allergies"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="input"
                      placeholder={tr('allergiesPlaceholder')}
                    />
                    {selectedChildId && !showManualForm && (
                      <div className="text-xs text-green-600 mt-1">
                        {t('rsvp.autoFilled', { name: userChildren.find(c => c.id === selectedChildId)?.name })}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">
                  {t('children.notes')}
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn btn-primary disabled:opacity-50 text-lg py-3"
              >
                {isSubmitting ? tr('submitting') : tr('submitBtn')}
              </button>
            </form>
          </div>
        )}

        <div className="text-center mt-6 text-sm text-neutral-500">
          Powered by {t('home.title')}
        </div>
      </div>
    </div >
  )
}