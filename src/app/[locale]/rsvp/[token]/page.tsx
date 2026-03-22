'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { formatDate, formatPhoneInput } from '@/lib/utils'
import { resolvePartyStartDateTime } from '@/lib/party-datetime'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocale, useLanguage, useTranslations } from '@/contexts/LanguageContext'
import PartyMapCard from '@/components/PartyMapCard'

interface ExistingRsvp {
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
  eventLocalDate?: string
  eventLocalTime?: string
  eventEndDatetime?: string
  eventEndLocalDate?: string
  eventEndLocalTime?: string
  rsvpClosesAt?: string | null
  isRsvpClosed?: boolean
  location: string
  locationFull?: string
  theme?: string
  notes?: string
  owner?: {
    name?: string | null
    email?: string | null
    phone?: string | null
  }
  existingRsvp?: ExistingRsvp
}

export default function RSVPPage() {
  const { token } = useParams()
  const router = useRouter()
  const tokenValue = Array.isArray(token) ? token[0] : String(token || '')
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
  const [childName, setChildName] = useState('')
  const [phone, setPhone] = useState('')
  const [rsvpStatus, setRsvpStatus] = useState<'YES' | 'NO' | 'MAYBE'>('YES')
  const [numChildren, setNumChildren] = useState(1)
  const [parentStaying, setParentStaying] = useState(true)
  const [allergies, setAllergies] = useState('')
  const [message, setMessage] = useState('')
  const [shouldAutoScrollIntent, setShouldAutoScrollIntent] = useState(false)
  const isRsvpClosed = Boolean(party?.isRsvpClosed)
  const partyStart = party ? resolvePartyStartDateTime(party) : null

  // Refs for auto-scrolling
  const authSectionRef = useRef<HTMLDivElement>(null)
  const notAttendingFormRef = useRef<HTMLDivElement>(null)
  const intentSectionRef = useRef<HTMLDivElement>(null)

  const rsvpFlowStorageKey = tokenValue ? `rsvp:flow:${tokenValue}` : ''

  const saveFlowState = (nextAuthMode?: 'register' | 'login') => {
    if (!rsvpFlowStorageKey || typeof window === 'undefined') return
    const state = {
      intent: rsvpIntent || 'ATTENDING',
      authMode: nextAuthMode || authMode,
      savedAt: Date.now(),
    }
    window.sessionStorage.setItem(rsvpFlowStorageKey, JSON.stringify(state))
  }

  useEffect(() => {
    const loadParty = async () => {
      if (!token || sessionStatus === 'loading') return

      try {
        // Load party details (wait for session so API can return existingRsvp)
        const partyResponse = await fetch(`/api/rsvp/${token}`)
        if (partyResponse.ok) {
          const data = await partyResponse.json()
          setParty(data)

          // Pre-fill form if user has existing RSVP
          if (data.existingRsvp) {
            const rsvp = data.existingRsvp
            setChildName(rsvp.childName || '')
            setSelectedChildId(rsvp.childId || '')
            setPhone(rsvp.phone ? formatPhoneInput(rsvp.phone) : '')
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
  }, [token, sessionStatus])

  useEffect(() => {
    if (!rsvpFlowStorageKey || typeof window === 'undefined') return

    const raw = window.sessionStorage.getItem(rsvpFlowStorageKey)
    if (!raw) return

    try {
      const state = JSON.parse(raw) as {
        intent?: 'ATTENDING' | 'NOT_ATTENDING'
        authMode?: 'register' | 'login'
        savedAt?: number
      }

      if (state.savedAt && Date.now() - state.savedAt > 30 * 60 * 1000) {
        window.sessionStorage.removeItem(rsvpFlowStorageKey)
        return
      }

      if (state.intent) setRsvpIntent(state.intent)
      if (state.authMode) setAuthMode(state.authMode)
      setShouldAutoScrollIntent(false)
    } catch {
      // ignore invalid cached state
    } finally {
      window.sessionStorage.removeItem(rsvpFlowStorageKey)
    }
  }, [rsvpFlowStorageKey])

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
        saveFlowState('register')
        const result = await signIn('credentials', {
          email: regEmail,
          password: regPassword,
          redirect: false,
        })

        if (result?.ok) {
          setShowRegistration(false)
          setRsvpIntent('ATTENDING')
          setShouldAutoScrollIntent(false)
          setIsSubmitting(false)
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
      saveFlowState('login')
      const result = await signIn('credentials', {
        email: regEmail,
        password: regPassword,
        redirect: false,
      })

      if (result?.ok) {
        setShowRegistration(false)
        setRsvpIntent('ATTENDING')
        setShouldAutoScrollIntent(false)
        setIsSubmitting(false)
      } else {
        setError(t('login.invalidCredentials') || 'Invalid email or password')
        setIsSubmitting(false)
      }
    } catch (error) {
      setError('An error occurred during login.')
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = () => {
    saveFlowState(authMode)
    signIn('google', { callbackUrl: `/${locale}/rsvp/${tokenValue}` })
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

    // Validate phone number if provided
    if (phone) {
      const digits = phone.replace(/\D/g, '')
      if (digits.length > 0 && digits.length < 10) {
        setError(locale === 'zh' ? '请输入完整的10位电话号码' : 'Please enter a complete 10-digit phone number')
        setIsSubmitting(false)
        return
      }
    }

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
        if (response.status === 410) {
          setParty((current) => current ? { ...current, isRsvpClosed: true, rsvpClosesAt: data.rsvpClosesAt || current.rsvpClosesAt } : current)
          setError(locale === 'zh' ? '报名截止了，无法继续提交回复。' : 'RSVP is now closed for this party.')
        } else {
          setError(data.error || 'Failed to submit RSVP')
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Confetti effect for successful submission
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!submitted || rsvpStatus === 'NO') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const colors = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#fb923c']
    const particles: { x: number; y: number; w: number; h: number; color: string; vx: number; vy: number; rotation: number; rotationSpeed: number; opacity: number }[] = []

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      })
    }

    let animFrame: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.rotation += p.rotationSpeed
        if (p.y > canvas.height) p.opacity -= 0.02
        if (p.opacity <= 0) return
        alive = true
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      if (alive) animFrame = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animFrame)
  }, [submitted, rsvpStatus])

  useEffect(() => {
    if (isAuthenticated || !shouldAutoScrollIntent) return

    const timer = setTimeout(() => {
      if (rsvpIntent === 'ATTENDING') {
        smoothScrollToElement(intentSectionRef.current, 150, 800)
      } else if (rsvpIntent === 'NOT_ATTENDING') {
        smoothScrollToElement(intentSectionRef.current, 150, 800)
      }
      setShouldAutoScrollIntent(false)
    }, 0)

    return () => clearTimeout(timer)
  }, [isAuthenticated, rsvpIntent, shouldAutoScrollIntent])

function smoothScrollToElement(el: HTMLDivElement | null, topOffset = 90, durationMs = 520) {
  if (!el || typeof window === 'undefined') return

  const startY = window.scrollY
  const rectTop = el.getBoundingClientRect().top
  const targetY = Math.max(0, startY + rectTop - topOffset)
  const distance = targetY - startY
  if (Math.abs(distance) < 8) return

  const startTs = performance.now()
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

  const step = (now: number) => {
    const elapsed = now - startTs
    const p = Math.min(1, elapsed / durationMs)
    const eased = easeOutCubic(p)
    window.scrollTo(0, startY + distance * eased)
    if (p < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

  const handleIntentSelect = (intent: 'ATTENDING' | 'NOT_ATTENDING') => {
    setShouldAutoScrollIntent(true)
    setRsvpIntent(intent)
    if (intent === 'NOT_ATTENDING') {
      setRsvpStatus('NO')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-neutral-500">{t('home.loading')}</p>
        </div>
      </div>
    )
  }

  if (!party) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-5xl mb-4">😢</div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
            {tr('invitationNotFound')}
          </h1>
          <p className="text-neutral-500">
            {tr('invitationNotFoundDesc')}
          </p>
        </motion.div>
      </div>
    )
  }

  if (isRsvpClosed) {
    const closeTimeText = party.rsvpClosesAt
      ? formatDate(new Date(party.rsvpClosesAt), t('locale') || 'zh')
      : null

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 md:p-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
              {locale === 'zh' ? '回复通道已截止' : 'RSVP has closed'}
            </h1>
            <p className="text-neutral-600 mb-4">
              {locale === 'zh'
                ? `这场派对的扫码回复已经截止了。${party.owner?.name ? `如需确认，请联系 ${party.owner.name}。` : '如需确认，请联系主办方。'}`
                : `The RSVP window for this party has ended. ${party.owner?.name ? `Please contact ${party.owner.name} if you need anything.` : 'Please contact the host if you need anything.'}`}
            </p>

            {closeTimeText && (
              <div className="mb-5 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                {locale === 'zh' ? `截止时间：${closeTimeText}` : `RSVP closed on ${closeTimeText}`}
              </div>
            )}

            {(party.owner?.email || party.owner?.phone) && (
              <div className="mb-5 rounded-2xl bg-primary-50 border border-primary-100 p-4 text-left">
                <p className="text-sm font-semibold text-neutral-900 mb-2">
                  {locale === 'zh' ? '联系主办方' : 'Contact the host'}
                </p>
                {party.owner?.name && (
                  <p className="text-sm text-neutral-700 mb-1">{party.owner.name}</p>
                )}
                {party.owner?.email && (
                  <a className="text-sm text-primary-700 hover:underline block" href={`mailto:${party.owner.email}`}>
                    {party.owner.email}
                  </a>
                )}
                {party.owner?.phone && (
                  <a className="text-sm text-primary-700 hover:underline block" href={`tel:${party.owner.phone}`}>
                    {party.owner.phone}
                  </a>
                )}
              </div>
            )}

            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              {locale === 'zh' ? '返回首页' : 'Back to home'}
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  if (submitted) {
    const isDeclined = rsvpStatus === 'NO'

    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {!isDeclined && (
          <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
          />
        )}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 md:p-8 shadow-sm">
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                className={`text-6xl mb-4`}
              >
                {isDeclined ? '✓' : '🎉'}
              </motion.div>
              <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
                {tr('submittedTitle')}
              </h1>
              <p className="text-neutral-500">
                {isDeclined ? tr('submittedDescDeclined') : tr('submittedDesc')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl p-4 mb-4">
              <h3 className="font-display font-bold text-neutral-900 mb-2">
                {party.childName}&apos;s {party.childAge}th Birthday Party
              </h3>
              <p className="text-sm text-neutral-600 mb-1">
                {partyStart ? formatDate(partyStart, t('locale') || 'zh') : ''}
              </p>
              <p className="text-sm text-neutral-600">
                {party.location}
              </p>
            </div>

            <PartyMapCard
              address={party.locationFull || party.location}
              title={locale === 'zh' ? '派对地点地图' : 'Party location map'}
            />

            {!isDeclined && (
              <Link
                href={`/${locale}/party/guest/${token}`}
                className="w-full btn btn-primary block text-center"
              >
                {tr('goGuestPage')}
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-4 md:py-8 px-4 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-neutral-100 p-4 md:p-8 shadow-sm mb-4 md:mb-6"
        >
          <div className="text-center mb-4 md:mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
              className="text-4xl md:text-5xl mb-2 md:mb-3"
            >
              🎊
            </motion.div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
              {tr('title')}
            </h1>
            <div className="bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 rounded-2xl p-5 md:p-6 border border-primary-100">
              <h2 className="font-display text-xl md:text-2xl font-bold text-primary-900 mb-2">
                {party.childName}&apos;s {party.childAge}th Birthday Party
              </h2>
              {party.theme && (
                <span className="inline-block px-3 py-1 rounded-full bg-white/70 text-primary-700 text-sm font-medium mb-3">
                  {party.theme} Theme
                </span>
              )}
              <div className="space-y-2 text-sm text-primary-800 mt-2">
                <p className="flex items-center justify-center gap-2">
                  <span>📅</span>
                  <strong>{tr('when')}</strong> {partyStart ? formatDate(partyStart, t('locale') || 'zh') : ''}
                </p>
                <p className="flex items-center justify-center gap-2">
                  <span>📍</span>
                  <strong>{tr('where')}</strong> {party.location}
                </p>
              </div>
              {party.notes && (
                <div className="mt-4 p-3 bg-white/80 rounded-xl text-sm text-neutral-700">
                  <strong>{tr('specialNotes')}</strong> {party.notes}
                </div>
              )}
              <PartyMapCard
                address={party.locationFull || party.location}
                title={locale === 'zh' ? '派对地点地图' : 'Party location map'}
              />
            </div>
          </div>

          {/* RSVP Intent Selection - Inline expandable design */}
          {!isAuthenticated && (
            <div ref={intentSectionRef} className="border-t border-neutral-100 pt-6">
              {/* Step indicator - only show after selection */}
              {rsvpIntent === 'ATTENDING' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 mb-5"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                  <div className="w-8 h-0.5 bg-primary-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse" />
                  <div className="w-8 h-0.5 bg-neutral-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                </motion.div>
              )}
              {!rsvpIntent && (
                <p className="text-center text-neutral-600 mb-4 font-medium">
                  {'Use the bottom buttons to choose your RSVP'}
                </p>
              )}

              {/* Inline expanded auth form - smooth transition */}
              <AnimatePresence>
              {rsvpIntent === 'ATTENDING' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="overflow-hidden mt-6"
              >
                <div ref={authSectionRef} className="bg-neutral-50 rounded-xl p-5 border border-neutral-100">
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

                      <div className="text-center mt-1">
                        <Link href={`/${locale}/login/forgot-password`} className="text-sm text-primary-600 hover:text-primary-700">
                          {t('login.forgotPassword')}
                        </Link>
                      </div>

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
                    onClick={handleGoogleSignIn}
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
              </motion.div>
              )}
              </AnimatePresence>

              {/* Inline expanded not-attending form */}
              <AnimatePresence>
              {rsvpIntent === 'NOT_ATTENDING' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="overflow-hidden mt-6"
              >
                <div ref={notAttendingFormRef} className="bg-neutral-50 rounded-xl p-5 border border-neutral-100">
                  <p className="text-neutral-500 text-sm mb-4 text-center">
                    {tr('optionalInfo')}
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
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
              </motion.div>
              )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>


        {/* Quick Add Child Form */}
        {isAuthenticated && showAddChild && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-neutral-900">
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
          </motion.div>
        )}

        {/* RSVP Form - Only show if authenticated */}
        {isAuthenticated && !showAddChild && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-neutral-100 p-6 md:p-8 shadow-sm"
          >
            <h3 className="font-display text-xl font-bold text-neutral-900 mb-4">
              {tr('pleaseRSVP')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!showManualForm && userChildren.length > 0 ? (
                <>
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
                        {tr('createChildBtn')}
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
                      autoFocus
                    />
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
                  onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                  className={`input ${phone && phone.replace(/\D/g, '').length > 0 && phone.replace(/\D/g, '').length < 10 ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="(555) 123-4567"
                />
                {phone && phone.replace(/\D/g, '').length > 0 && phone.replace(/\D/g, '').length < 10 && (
                  <p className="text-xs text-red-500 mt-1">
                    {locale === 'zh' ? `请输入10位电话号码（已输入 ${phone.replace(/\D/g, '').length} 位）` : `Please enter a 10-digit phone number (${phone.replace(/\D/g, '').length} digits entered)`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  {tr('attendingLabel')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['YES', 'NO', 'MAYBE'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRsvpStatus(option)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer text-center transition-all duration-200 border-2 ${rsvpStatus === option
                        ? option === 'YES'
                          ? 'bg-green-50 text-green-700 border-green-400 shadow-md shadow-green-500/10'
                          : option === 'NO'
                            ? 'bg-red-50 text-red-700 border-red-400 shadow-md shadow-red-500/10'
                            : 'bg-amber-50 text-amber-700 border-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                        }`}
                    >
                      <span className="text-lg block mb-0.5">{option === 'YES' ? '🎉' : option === 'NO' ? '😢' : '🤔'}</span>
                      {option === 'YES' ? tr('yes') : option === 'NO' ? tr('no') : tr('maybe')}
                    </button>
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full btn btn-primary disabled:opacity-50 text-lg py-3.5 rounded-xl font-semibold shadow-lg shadow-primary-500/20"
              >
                {isSubmitting ? tr('submitting') : (isEditMode ? tr('updateBtn') : tr('submitBtn'))}
              </motion.button>
            </form>
          </motion.div>
        )}

        {(party.owner?.email || party.owner?.phone) && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-4 md:p-5 shadow-sm mb-4">
            <p className="text-sm font-semibold text-neutral-800 mb-2">
              {locale === 'zh' ? '联系主办方（登录或访问问题可联系）' : 'Contact host (for sign-in/access issues)'}
            </p>
            {party.owner?.name && (
              <p className="text-sm text-neutral-700">{party.owner.name}</p>
            )}
            {party.owner?.email && (
              <a className="text-sm text-primary-700 hover:underline block" href={`mailto:${party.owner.email}`}>
                {party.owner.email}
              </a>
            )}
            {party.owner?.phone && (
              <a className="text-sm text-primary-700 hover:underline block" href={`tel:${party.owner.phone}`}>
                {party.owner.phone}
              </a>
            )}
          </div>
        )}

        <div className={`text-center mt-8 text-sm text-neutral-400 ${!isAuthenticated ? 'mb-24 md:mb-28' : ''}`}>
          Powered by {t('home.title')}
        </div>
      </div>

      {!isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white/95 backdrop-blur px-4 py-3 z-40">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleIntentSelect('ATTENDING')}
              className={`rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                rsvpIntent === 'ATTENDING'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-500/90 text-white'
              }`}
            >
              {tr('attendingButton')}
            </button>
            <button
              type="button"
              onClick={() => handleIntentSelect('NOT_ATTENDING')}
              className={`rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                rsvpIntent === 'NOT_ATTENDING'
                  ? 'bg-neutral-700 text-white'
                  : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {tr('notAttendingButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
