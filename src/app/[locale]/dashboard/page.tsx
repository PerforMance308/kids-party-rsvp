'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PartyWithStats } from '@/types'
import { formatDate, getDaysUntilEvent, getDaysUntilColor } from '@/lib/utils'
import { useLocale, useLanguage } from '@/contexts/LanguageContext'
import { PencilIcon, TrashIcon, CakeIcon } from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-64 bg-neutral-100 rounded animate-pulse"></div>
            </div>
            <div className="h-11 w-32 bg-neutral-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="h-5 w-3/4 bg-neutral-200 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-neutral-100 rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-neutral-100 rounded-full"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 w-2/3 bg-neutral-100 rounded"></div>
                  <div className="h-4 w-1/2 bg-neutral-100 rounded"></div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="text-center">
                      <div className="h-6 w-8 bg-neutral-200 rounded mx-auto mb-1"></div>
                      <div className="h-3 w-10 bg-neutral-100 rounded mx-auto"></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mt-auto">
                  <div className="h-11 w-full bg-neutral-200 rounded-lg"></div>
                  <div className="flex gap-2">
                    <div className="h-9 flex-1 bg-neutral-100 rounded-lg"></div>
                    <div className="h-9 flex-1 bg-neutral-100 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              <CakeIcon className="w-16 h-16 mx-auto" />
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
                    <div className="p-2 rounded-lg transition-colors hover:bg-neutral-50 cursor-default">
                      <div className="text-lg font-semibold text-neutral-900">
                        {party.stats.total}
                      </div>
                      <div className="text-xs text-neutral-500">{t('dashboard.stats.invited')}</div>
                    </div>
                    <div className="p-2 rounded-lg transition-colors hover:bg-green-50 cursor-default">
                      <div className="text-lg font-semibold text-green-600">
                        {party.stats.attending}
                      </div>
                      <div className="text-xs text-neutral-500">{t('dashboard.stats.yes')}</div>
                    </div>
                    <div className="p-2 rounded-lg transition-colors hover:bg-red-50 cursor-default">
                      <div className="text-lg font-semibold text-red-600">
                        {party.stats.notAttending}
                      </div>
                      <div className="text-xs text-neutral-500">{t('dashboard.stats.no')}</div>
                    </div>
                    <div className="p-2 rounded-lg transition-colors hover:bg-amber-50 cursor-default">
                      <div className="text-lg font-semibold text-amber-700">
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
                        className="flex-1 btn btn-secondary text-center text-sm inline-flex items-center justify-center gap-1.5"
                      >
                        <PencilIcon className="w-4 h-4" />
                        {t('dashboard.edit')}
                      </Link>
                      <button
                        onClick={() => {
                          if (window.confirm(t('dashboard.deleteConfirm', { childName: party.childName }))) {
                            handleDeleteParty(party.id)
                          }
                        }}
                        disabled={deletingParty === party.id}
                        className="flex-1 btn bg-red-500 hover:bg-red-600 text-white text-center text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                      >
                        {deletingParty === party.id ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            {t('dashboard.deleting')}
                          </>
                        ) : (
                          <>
                            <TrashIcon className="w-4 h-4" />
                            {t('dashboard.delete')}
                          </>
                        )}
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