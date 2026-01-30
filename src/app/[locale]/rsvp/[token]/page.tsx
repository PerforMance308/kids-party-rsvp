'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useLocale, useLanguage, useTranslations } from '@/contexts/LanguageContext'

interface ExistingRsvp {
  parentName: string
  childName: string
  childId?: string
  phone?: string
  status: 'YES' | 'NO' | 'MAYBE'
  numChildren: number
  parentStaying: boolean
  allergies?: string
  message?: string
}

interface Party {
  id: string
  childName: string
  childAge: number
  eventDatetime: string
  location: string
  theme?: string
  notes?: string
  existingRsvp?: ExistingRsvp
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
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register')
  const [isEditMode, setIsEditMode] = useState(false)
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

          // Pre-fill form if user has existing RSVP
          if (data.existingRsvp) {
            const rsvp = data.existingRsvp
            setParentName(rsvp.parentName || '')
            setChildName(rsvp.childName || '')
            setSelectedChildId(rsvp.childId || '')
            setPhone(rsvp.phone || '')
            setRsvpStatus(rsvp.status)
            setNumChildren(rsvp.numChildren || 1)
            setParentStaying(rsvp.parentStaying ?? true)
            setAllergies(rsvp.allergies || '')
            setMessage(rsvp.message || '')
            setIsEditMode(true)
          }
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
          // Reload page to update session
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: regEmail,
        password: regPassword,
        redirect: false,
      })

      if (result?.ok) {
        // Reload page to update session
        window.location.reload()
      } else {
        setError(t('login.invalidCredentials') || 'Invalid email or password')
        setIsSubmitting(false)
      }
    } catch (error) {
      setError('An error occurred during login.')
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
    const isDeclined = rsvpStatus === 'NO'

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="card">
            <div className="text-center mb-6">
              <div className={`${isDeclined ? 'text-neutral-600' : 'text-green-600'} text-6xl mb-4`}>
                {isDeclined ? '✓' : '🎉'}
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                {tr('submittedTitle')}
              </h1>
              <p className="text-neutral-600">
                {isDeclined ? tr('submittedDescDeclined') : tr('submittedDesc')}
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

            {!isDeclined && (
              <Link
                href={`/${locale}/party/guest/${token}`}
                className="w-full btn btn-primary block text-center"
              >
                {tr('goGuestPage')}
              </Link>
            )}
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

          {/* RSVP Intent Selection - Inline expandable design */}
          {!isAuthenticated && (
            <div className="border-t pt-4">
              {/* Step indicator - only show after selection */}
              {rsvpIntent === 'ATTENDING' && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-600"></div>
                  <div className="w-8 h-0.5 bg-primary-200"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse"></div>
                  <div className="w-8 h-0.5 bg-neutral-200"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300"></div>
                </div>
              )}

              {/* Selection buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setRsvpIntent('ATTENDING')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    rsvpIntent === 'ATTENDING'
                      ? 'bg-primary-600 text-white ring-2 ring-primary-600 ring-offset-2'
                      : 'btn btn-primary'
                  }`}
                >
                  {rsvpIntent === 'ATTENDING' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {tr('attendingButton')}
                </button>
                <button
                  onClick={() => {
                    setRsvpIntent('NOT_ATTENDING')
                    setRsvpStatus('NO')
                  }}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    rsvpIntent === 'NOT_ATTENDING'
                      ? 'bg-neutral-600 text-white ring-2 ring-neutral-600 ring-offset-2'
                      : 'btn btn-secondary'
                  }`}
                >
                  {rsvpIntent === 'NOT_ATTENDING' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {tr('notAttendingButton')}
                </button>
              </div>

              {/* Inline expanded auth form - smooth transition */}
              <div className={`overflow-hidden transition-all duration-300 ease-out ${
                rsvpIntent === 'ATTENDING' ? 'max-h-[800px] opacity-100 mt-6' : 'max-h-0 opacity-0'
              }`}>
                <div ref={authSectionRef} className="bg-neutral-50 rounded-xl p-5 border border-neutral-200">
                  {authMode === 'register' ? (
                    /* Register Form */
                    <form onSubmit={handleRegistration} className="space-y-4">
                      <div>
                        <label htmlFor="quickEmail" className="block text-sm font-medium text-neutral-700 mb-1">
                          {tr('emailLabel')}
                        </label>
                        <input
                          type="email"
                          id="quickEmail"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="input"
                          placeholder="your@email.com"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="quickPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                          {tr('passwordLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type={showRegPassword ? "text" : "password"}
                            id="quickPassword"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="input pr-10"
                            placeholder="••••••••"
                            minLength={8}
                            required
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
                        <p className="text-xs text-neutral-500 mt-1">
                          {t('register.atLeast8Chars')}
                        </p>
                      </div>

                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="termsQuick"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="termsQuick" className="text-sm text-neutral-600">
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
                        disabled={isSubmitting || !agreedToTerms}
                        className="w-full btn btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          tr('creatingAccount')
                        ) : (
                          <>
                            {t('common.next')}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                      </button>

                      <div className="text-center text-sm text-neutral-600">
                        {tr('haveAccount')}{' '}
                        <button
                          type="button"
                          onClick={() => { setAuthMode('login'); setError('') }}
                          className="text-primary-600 hover:underline font-medium"
                        >
                          {tr('signInBtn')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Login Form */
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label htmlFor="loginEmail" className="block text-sm font-medium text-neutral-700 mb-1">
                          {tr('emailLabel')}
                        </label>
                        <input
                          type="email"
                          id="loginEmail"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="input"
                          placeholder="your@email.com"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="loginPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                          {tr('passwordLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type={showRegPassword ? "text" : "password"}
                            id="loginPassword"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="input pr-10"
                            placeholder="••••••••"
                            required
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
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full btn btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          t('login.signingIn')
                        ) : (
                          <>
                            {tr('signInBtn')}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                      </button>

                      <div className="text-center text-sm text-neutral-600">
                        {t('login.noAccount')}{' '}
                        <button
                          type="button"
                          onClick={() => { setAuthMode('register'); setError('') }}
                          className="text-primary-600 hover:underline font-medium"
                        >
                          {t('register.signUp')}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-neutral-50 text-neutral-500">{t('login.orContinueWith')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: `/${locale}/rsvp/${token}` })}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium text-neutral-700">{t('login.signInWithGoogle')}</span>
                  </button>
                </div>
              </div>

              {/* Inline expanded not-attending form */}
              <div className={`overflow-hidden transition-all duration-300 ease-out ${
                rsvpIntent === 'NOT_ATTENDING' ? 'max-h-[600px] opacity-100 mt-6' : 'max-h-0 opacity-0'
              }`}>
                <div ref={notAttendingFormRef} className="bg-neutral-50 rounded-xl p-5 border border-neutral-200">
                  <p className="text-neutral-600 text-sm mb-4 text-center">
                    {tr('optionalInfo')}
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="parentNameDecline" className="block text-sm font-medium text-neutral-700 mb-1">
                          {tr('parentNameLabel')} ({tr('optional')})
                        </label>
                        <input
                          type="text"
                          id="parentNameDecline"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          className="input"
                          placeholder={tr('parentNameLabel')}
                        />
                      </div>
                      <div>
                        <label htmlFor="childNameDecline" className="block text-sm font-medium text-neutral-700 mb-1">
                          {tr('childNameLabel')} ({tr('optional')})
                        </label>
                        <input
                          type="text"
                          id="childNameDecline"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          className="input"
                          placeholder={tr('childNameLabel')}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="messageDecline" className="block text-sm font-medium text-neutral-700 mb-1">
                        {tr('messageLabel')} ({tr('optional')})
                      </label>
                      <textarea
                        id="messageDecline"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="input"
                        rows={2}
                        placeholder={tr('messagePlaceholder')}
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
                      className="w-full btn btn-primary disabled:opacity-50"
                    >
                      {isSubmitting ? tr('submitting') : tr('submitResponse')}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>


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
                  onChange={(e) => {
                    // Only allow numbers, +, -, spaces, and parentheses
                    const value = e.target.value.replace(/[^0-9+\-\s()]/g, '')
                    setPhone(value)
                  }}
                  className="input"
                  placeholder={tr('phonePlaceholder')}
                  pattern="[0-9+\-\s()]*"
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
                {isSubmitting ? tr('submitting') : (isEditMode ? tr('updateBtn') : tr('submitBtn'))}
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