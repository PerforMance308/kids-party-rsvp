'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocale, useLanguage } from '@/contexts/LanguageContext'
import { PlusIcon, PencilIcon, CakeIcon, HeartIcon } from '@heroicons/react/24/outline'

interface Child {
  id: string
  name: string
  birthDate: string
  age: number
  gender?: 'boy' | 'girl'
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
  const [editingChild, setEditingChild] = useState<Child | null>(null)

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'boy' | 'girl' | ''>('')
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
    } catch {
      setError('An error occurred while loading children')
    } finally {
      setIsLoading(false)
    }
  }

  const startEditing = (child: Child) => {
    setEditingChild(child)
    setName(child.name)
    setBirthDate(child.birthDate)
    setGender(child.gender || '')
    setAllergies(child.allergies || '')
    setNotes(child.notes || '')
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingChild(null)
    setError('')
    setName('')
    setBirthDate('')
    setGender('')
    setAllergies('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const url = editingChild ? `/api/children/${editingChild.id}` : '/api/children'
      const method = editingChild ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          birthDate,
          gender: gender || undefined,
          allergies: allergies || undefined,
          notes: notes || undefined,
        }),
      })
      if (response.ok) {
        const updatedChild = await response.json()
        if (editingChild) {
          setChildren(children.map(c => c.id === updatedChild.id ? updatedChild : c))
        } else {
          setChildren([updatedChild, ...children])
        }
        resetForm()
      } else {
        const data = await response.json()
        setError(data.error || (editingChild ? 'Failed to update child' : 'Failed to add child'))
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-neutral-200 rounded-xl animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 w-24 bg-neutral-200 rounded mb-1" />
                    <div className="h-4 w-16 bg-neutral-100 rounded" />
                  </div>
                </div>
                <div className="h-10 bg-neutral-100 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-neutral-900">{t('children.title')}</h1>
            <p className="text-neutral-500 mt-1">{t('children.subtitle')}</p>
          </div>
          {children.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-100 px-3 py-2 text-sm font-semibold text-primary-800 shadow-sm hover:bg-primary-200 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('children.addChild')}</span>
              <span className="sm:hidden">{locale === 'zh' ? '添加' : 'Add'}</span>
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                <h2 className="font-display text-xl font-bold text-neutral-900 mb-4">
                  {editingChild ? (locale === 'zh' ? '编辑孩子信息' : 'Edit Child') : t('children.addChild')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {t('children.name')} *
                      </label>
                      <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="input" required autoFocus />
                    </div>
                    <div>
                      <label htmlFor="birthDate" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {t('children.birthDate')} *
                      </label>
                      <input type="date" id="birthDate" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="input" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {locale === 'zh' ? '性别' : 'Gender'}
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setGender('boy')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all ${
                          gender === 'boy'
                            ? 'border-party-blue bg-blue-50 shadow-md shadow-blue-500/10'
                            : 'border-neutral-200 hover:border-blue-200 hover:bg-blue-50/50'
                        }`}
                      >
                        <span className="text-xl">👦</span>
                        <span className={`text-sm font-medium ${gender === 'boy' ? 'text-blue-700' : 'text-neutral-600'}`}>
                          {locale === 'zh' ? '男孩' : 'Boy'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('girl')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all ${
                          gender === 'girl'
                            ? 'border-party-pink bg-pink-50 shadow-md shadow-pink-500/10'
                            : 'border-neutral-200 hover:border-pink-200 hover:bg-pink-50/50'
                        }`}
                      >
                        <span className="text-xl">👧</span>
                        <span className={`text-sm font-medium ${gender === 'girl' ? 'text-pink-700' : 'text-neutral-600'}`}>
                          {locale === 'zh' ? '女孩' : 'Girl'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="allergies" className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {t('children.allergies')} & {locale === 'zh' ? '饮食限制' : 'Dietary Restrictions'}
                    </label>
                    <input type="text" id="allergies" value={allergies} onChange={e => setAllergies(e.target.value)} className="input" placeholder="e.g., nuts, dairy, gluten-free" />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {t('children.notes')}
                    </label>
                    <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} className="input" rows={2} placeholder="Any special notes..." />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
                  )}

                  <div className="flex gap-3">
                    <button type="button" onClick={resetForm} className="btn btn-secondary">{t('children.cancel')}</button>
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary disabled:opacity-50">
                      {isSubmitting ? t('children.saving') : (editingChild ? (locale === 'zh' ? '保存' : 'Save') : t('children.addChild'))}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {children.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-2xl border border-neutral-100"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 bg-gradient-to-br from-primary-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-5"
            >
              <HeartIcon className="w-10 h-10 text-primary-400" />
            </motion.div>
            <h2 className="font-display text-xl font-bold text-neutral-900 mb-2">
              {t('children.noChildren')}
            </h2>
            <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
              {t('children.noChildrenDesc')}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-100 px-3 py-2 text-sm font-semibold text-primary-800 shadow-sm hover:bg-primary-200 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              {locale === 'zh' ? '添加您的第一个宝贝' : 'Add Your First Child'}
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {children.map((child, i) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 mb-4">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    child.gender === 'girl'
                      ? 'bg-gradient-to-br from-pink-100 to-rose-100'
                      : child.gender === 'boy'
                        ? 'bg-gradient-to-br from-blue-100 to-sky-100'
                        : 'bg-gradient-to-br from-primary-100 to-purple-100'
                  }`}>
                    {child.gender === 'girl' ? '👧' : child.gender === 'boy' ? '👦' : '👶'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-neutral-900 truncate">{child.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      child.gender === 'girl' ? 'bg-pink-50 text-pink-700' :
                      child.gender === 'boy' ? 'bg-blue-50 text-blue-700' :
                      'bg-primary-50 text-primary-700'
                    }`}>
                      {child.age} {t('children.years')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-neutral-500 mb-4">
                  <p className="flex items-center gap-1.5">
                    <CakeIcon className="w-3.5 h-3.5" />
                    {new Date(child.birthDate + 'T00:00:00').toLocaleDateString()}
                  </p>
                  {child.allergies && (
                    <p className="text-red-500 text-xs bg-red-50 px-2 py-1 rounded-lg">
                      ⚠ {child.allergies}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/${locale}/party/new?childId=${child.id}`)}
                    className="flex-1 btn btn-primary text-sm"
                  >
                    {t('children.createParty')}
                  </button>
                  <button
                    onClick={() => startEditing(child)}
                    className="btn btn-secondary text-sm px-3"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
