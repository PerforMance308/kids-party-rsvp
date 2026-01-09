'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLocale, useLanguage } from '@/contexts/LanguageContext'

interface Child {
  id: string
  name: string
  birthDate: string
  age: number
  allergies?: string
  notes?: string
  createdAt: string
}

export default function ChildrenPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const { t } = useLanguage()
  const [children, setChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [allergies, setAllergies] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login?redirect=/${locale}/children`)
      return
    }

    if (status === 'authenticated') {
      loadChildren()
    }
  }, [status, router, locale])

  const loadChildren = async () => {
    try {
      const response = await fetch('/api/children')
      if (response.ok) {
        const data = await response.json()
        setChildren(data)
      } else {
        setError('Failed to load children')
      }
    } catch (error) {
      setError('An error occurred while loading children')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          birthDate,
          allergies: allergies || undefined,
          notes: notes || undefined,
        }),
      })

      if (response.ok) {
        const newChild = await response.json()
        setChildren([newChild, ...children])
        setShowForm(false)
        setName('')
        setBirthDate('')
        setAllergies('')
        setNotes('')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add child')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{t('children.title')}</h1>
            <p className="text-neutral-600 mt-2">
              {t('children.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            {t('children.addChild')}
          </button>
        </div>

        {/* Add Child Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              {t('children.addChild')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('children.name')} *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('children.birthDate')} *
                  </label>
                  <input
                    type="date"
                    id="birthDate"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="allergies" className="block text-sm font-medium text-neutral-700 mb-1">
                  {t('children.allergies')} & Dietary Restrictions
                </label>
                <input
                  type="text"
                  id="allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="input"
                  placeholder="e.g., nuts, dairy, gluten-free, vegetarian"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
                  {t('children.notes')}
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="Any special notes about interests, preferences, etc."
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
                  onClick={() => {
                    setShowForm(false)
                    setError('')
                    setName('')
                    setBirthDate('')
                    setNotes('')
                  }}
                  className="btn btn-secondary"
                >
                  {t('children.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? t('children.saving') : t('children.addChild')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Children List */}
        {children.length === 0 ? (
          <div className="card text-center">
            <div className="py-12">
              <div className="text-neutral-400 text-6xl mb-4">👶</div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                {t('children.noChildren')}
              </h2>
              <p className="text-neutral-600 mb-6">
                {t('children.noChildrenDesc')}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                {t('children.addChild')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div key={child.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-neutral-900">
                    {child.name}
                  </h3>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                    {child.age} {t('children.years')}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-neutral-600 mb-4">
                  <p>
                    <strong>{t('children.born')}</strong> {new Date(child.birthDate).toLocaleDateString()}
                  </p>
                  {child.allergies && (
                    <p>
                      <strong>{t('children.allergiesLabel')}</strong> <span className="text-red-600">{child.allergies}</span>
                    </p>
                  )}
                  {child.notes && (
                    <p>
                      <strong>{t('children.notesLabel')}</strong> {child.notes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/${locale}/party/new?childId=${child.id}`)}
                    className="btn btn-primary flex-1 text-sm"
                  >
                    {t('children.createParty')}
                  </button>
                  <button className="btn btn-secondary text-sm">
                    {t('children.edit')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {children.length > 0 && (
          <div className="mt-8 card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push(`/${locale}/party/new`)}
                className="btn btn-primary"
              >
                Create New Party
              </button>
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="btn btn-secondary"
              >
                View All Parties
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}