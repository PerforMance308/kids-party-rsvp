'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PartyWithStats } from '@/types'
import { formatDate, getDaysUntilEvent, getDaysUntilColor } from '@/lib/utils'
import { useLocale, useLanguage } from '@/contexts/LanguageContext'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const { t } = useLanguage()
  const [parties, setParties] = useState<PartyWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingParty, setDeletingParty] = useState<string | null>(null)

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated' || !session?.user?.id) {
      router.push(`/${locale}/login?redirect=/${locale}/dashboard`)
    }
  }, [status, session, router, locale])

  useEffect(() => {
    const fetchParties = async () => {
      // Only fetch if we have a valid session
      if (status !== 'authenticated' || !session?.user?.id) {
        return
      }

      try {
        const response = await fetch('/api/parties')
        if (response.ok) {
          const data = await response.json()
          setParties(data)
        } else if (response.status === 401) {
          window.location.href = `/${locale}/login?redirect=/${locale}/dashboard`
          return
        } else {
          setError('Failed to load parties')
        }
      } catch (error) {
        setError('An error occurred while loading parties')
      } finally {
        setIsLoading(false)
      }
    }

    fetchParties()
  }, [status, session, locale])

  const handleDeleteParty = async (partyId: string) => {
    setDeletingParty(partyId)
    setError('')

    try {
      const response = await fetch(`/api/parties/${partyId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // Remove the party from the local state
        setParties(parties.filter(party => party.id !== partyId))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete party')
      }
    } catch (error) {
      setError('An error occurred while deleting the party')
    } finally {
      setDeletingParty(null)
    }
  }

  // Show loading while checking authentication or fetching data
  if (status === 'loading' || isLoading) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">{t('home.loading')}</p>
        </div>
      </main>
    )
  }

  // Don't render anything while redirecting
  if (status === 'unauthenticated' || !session?.user?.id) {
    return null
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {t('dashboard.title')}
            </h1>
            <p className="text-neutral-600 mt-2">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <Link href={`/${locale}/party/new`} className="btn btn-primary">
            {t('nav.newParty')}
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}

        {parties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zM3 10h18M7 15h1m4 0h1m4 0h1m-7 4h1m4 0h1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {t('dashboard.noParties')}
            </h3>
            <p className="text-neutral-600 mb-6">
              {t('dashboard.noPartiesDesc')}
            </p>
            <Link href={`/${locale}/party/new`} className="btn btn-primary">
              {t('dashboard.planFirst')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parties.map((party) => {
              const daysUntil = getDaysUntilEvent(new Date(party.eventDatetime))
              const isUpcoming = daysUntil >= 0

              return (
                <div key={party.id} className="card hover:shadow-md transition-shadow flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {t('dashboard.partyTitle', { childName: party.childName, age: party.childAge })}
                      </h3>
                      {party.theme && (
                        <p className="text-sm text-primary-600">{party.theme}</p>
                      )}
                    </div>
                    {isUpcoming && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDaysUntilColor(daysUntil)}`}>
                        {daysUntil === 0 ? t('dashboard.today') : t('dashboard.daysLeft', { days: daysUntil })}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-neutral-600">
                    <p>{formatDate(new Date(party.eventDatetime))}</p>
                    <p>{party.location}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-neutral-900">
                        {party.stats.total}
                      </div>
                      <div className="text-xs text-neutral-500">{t('dashboard.stats.invited')}</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {party.stats.attending}
                      </div>
                      <div className="text-xs text-neutral-500">{t('dashboard.stats.yes')}</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {party.stats.notAttending}
                      </div>
                      <div className="text-xs text-neutral-500">{t('dashboard.stats.no')}</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-yellow-600">
                        {party.stats.maybe}
                      </div>
                      <div className="text-xs text-neutral-500">{t('dashboard.stats.maybe')}</div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-auto">
                    <Link
                      href={`/${locale}/party/${party.id}/dashboard`}
                      className="w-full btn btn-primary text-center block"
                    >
                      {t('dashboard.manageParty')}
                    </Link>

                    <div className="flex gap-2">
                      <Link
                        href={`/${locale}/party/${party.id}/edit`}
                        className="flex-1 btn btn-secondary text-center text-sm"
                      >
                        ✏️ {t('dashboard.edit')}
                      </Link>
                      <button
                        onClick={() => {
                          if (window.confirm(t('dashboard.deleteConfirm', { childName: party.childName }))) {
                            handleDeleteParty(party.id)
                          }
                        }}
                        disabled={deletingParty === party.id}
                        className="flex-1 btn bg-red-500 hover:bg-red-600 text-white text-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingParty === party.id ? `⏳ ${t('dashboard.deleting')}` : `🗑️ ${t('dashboard.delete')}`}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}