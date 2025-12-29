'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { formatDate } from '@/lib/utils'

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
  const { data: session, status: sessionStatus } = useSession()
  const [party, setParty] = useState<Party | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)

  // Registration form state
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  // Form state
  const [parentName, setParentName] = useState('')
  const [childName, setChildName] = useState('')
  const [phone, setPhone] = useState('')
  const [rsvpStatus, setRsvpStatus] = useState<'YES' | 'NO' | 'MAYBE'>('YES')
  const [numChildren, setNumChildren] = useState(1)
  const [parentStaying, setParentStaying] = useState(true)
  const [allergies, setAllergies] = useState('')
  const [message, setMessage] = useState('')

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
          setError('Party not found')
        }
      } catch (error) {
        setError('An error occurred while loading the party')
      } finally {
        setIsLoading(false)
      }
    }

    loadParty()
  }, [token])

  // Get authentication status from NextAuth session
  const isAuthenticated = sessionStatus === 'authenticated' && session?.user?.id

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

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
        // Registration successful, user can now sign in
        setShowRegistration(false)
        setError('')
        // Redirect to login page to complete the flow
        window.location.href = `/login?redirect=${encodeURIComponent(`/rsvp/${token}`)}`
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/rsvp/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          parentName,
          childName,
          phone: phone || undefined,
          status: rsvpStatus,
          numChildren,
          parentStaying,
          allergies: allergies || undefined,
          message: message || undefined,
        }),
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
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!party) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">
            Invitation not found
          </h1>
          <p className="text-neutral-600">
            This invitation link is invalid or has expired.
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
                RSVP Submitted!
              </h1>
              <p className="text-neutral-600">
                Thank you for your response. We're looking forward to celebrating with you!
              </p>
            </div>
            
            <div className="bg-neutral-50 rounded-lg p-4">
              <h3 className="font-semibold text-neutral-900 mb-2">
                {party.childName}'s {party.childAge}th Birthday Party
              </h3>
              <p className="text-sm text-neutral-600 mb-1">
                {formatDate(new Date(party.eventDatetime))}
              </p>
              <p className="text-sm text-neutral-600">
                {party.location}
              </p>
            </div>
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
              You're Invited! 🎉
            </h1>
            <div className="bg-primary-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-primary-900 mb-2">
                {party.childName}'s {party.childAge}th Birthday Party
              </h2>
              {party.theme && (
                <p className="text-primary-700 mb-2">{party.theme} Theme</p>
              )}
              <div className="space-y-1 text-sm text-primary-800">
                <p><strong>When:</strong> {formatDate(new Date(party.eventDatetime))}</p>
                <p><strong>Where:</strong> {party.location}</p>
              </div>
              {party.notes && (
                <div className="mt-3 p-3 bg-white rounded text-sm text-neutral-700">
                  <strong>Special Notes:</strong> {party.notes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registration/Login Step */}
        {!isAuthenticated && (
          <div className="card mb-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Create Account to RSVP
              </h3>
              <p className="text-neutral-600 text-sm">
                We need to create a quick account so you can manage your RSVP and receive updates about the party.
              </p>
            </div>

            {!showRegistration ? (
              <div className="space-y-4">
                <p className="text-center text-neutral-700">
                  Do you already have an account with us?
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowRegistration(true)}
                    className="btn btn-primary flex-1"
                  >
                    Create New Account
                  </button>
                  <a 
                    href={`/login?redirect=${encodeURIComponent(`/rsvp/${token}`)}`}
                    className="btn btn-secondary flex-1 text-center"
                  >
                    Sign In
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegistration} className="space-y-4">
                <div>
                  <label htmlFor="regEmail" className="block text-sm font-medium text-neutral-700 mb-1">
                    Email Address *
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
                    Password *
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
                    <p className="font-medium mb-1">Password must contain:</p>
                    <ul className="text-xs space-y-0.5">
                      <li>• At least 8 characters</li>
                      <li>• One uppercase letter (A-Z)</li>
                      <li>• One lowercase letter (a-z)</li>
                      <li>• One number (0-9)</li>
                      <li>• One special character (!@#$%^&*)</li>
                    </ul>
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
                  className="w-full btn btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account & Continue'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowRegistration(false)}
                    className="text-sm text-neutral-600 hover:text-neutral-800"
                  >
                    ← Back to options
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* RSVP Form - Only show if authenticated */}
        {isAuthenticated && (
          <div className="card">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              Please RSVP
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="parentName" className="block text-sm font-medium text-neutral-700 mb-1">
                  Parent/Guardian Name *
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
                  Child's Name *
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

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="Optional - for party updates"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Will you be attending? *
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
                    <span className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer flex-1 text-center ${
                      rsvpStatus === option
                        ? option === 'YES'
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : option === 'NO'
                          ? 'bg-red-100 text-red-800 border-2 border-red-300'
                          : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                        : 'bg-neutral-100 text-neutral-600 border-2 border-transparent'
                    }`}>
                      {option === 'YES' ? 'Yes! 🎉' : option === 'NO' ? 'Sorry, can\'t make it 😢' : 'Maybe 🤔'}
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
                      Number of children attending *
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
                      Will a parent/guardian stay?
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
                        Yes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="parentStaying"
                          checked={!parentStaying}
                          onChange={() => setParentStaying(false)}
                          className="mr-2"
                        />
                        No (drop-off)
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="allergies" className="block text-sm font-medium text-neutral-700 mb-1">
                    Food allergies or dietary restrictions
                  </label>
                  <input
                    type="text"
                    id="allergies"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="input"
                    placeholder="Please list any allergies or dietary needs"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">
                Message to the host
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input"
                rows={3}
                placeholder="Any special message or questions?"
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
              {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
            </button>
          </form>
        </div>
        )}

        <div className="text-center mt-6 text-sm text-neutral-500">
          Powered by Kid Party RSVP
        </div>
      </div>
    </div>
  )
}