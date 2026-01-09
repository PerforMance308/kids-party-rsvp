'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { formatDate, getRsvpStatusColor } from '@/lib/utils'
import Link from 'next/link'
import { useLocale, useLanguage, useTranslations } from '@/contexts/LanguageContext'

interface Invitation {
  id: string
  partyId: string
  parentName: string
  childName: string
  email: string
  phone?: string
  createdAt: string
  party: {
    id: string
    childName: string
    childAge: number
    eventDatetime: string
    location: string
    theme?: string
    notes?: string
    publicRsvpToken: string
    user: {
      name?: string
      email: string
    }
  }
  rsvp?: {
    status: 'YES' | 'NO' | 'MAYBE'
    numChildren: number
    parentStaying: boolean
    allergies?: string
    message?: string
    updatedAt: string
  }
}

export default function InvitationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const locale = useLocale()
  const { t } = useLanguage()
  const tr = useTranslations('invitations')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login?redirect=/${locale}/invitations`)
      return
    }

    if (status === 'authenticated') {
      const loadInvitations = async () => {
        try {
          const response = await fetch('/api/invitations')
          if (response.ok) {
            const data = await response.json()
            setInvitations(data)
          } else {
            setError(t('error.loadingError'))
          }
        } catch (error) {
          setError(t('error.loadingError'))
        } finally {
          setIsLoading(false)
        }
      }
      loadInvitations()
    }
  }, [status, router, locale, t])

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

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'YES': return tr('status.attending')
      case 'NO': return tr('status.notAttending')
      case 'MAYBE': return tr('status.maybe')
      default: return tr('status.noResponse')
    }
  }

  const upcomingInvitations = invitations.filter(inv =>
    new Date(inv.party.eventDatetime) > new Date()
  ).sort((a, b) =>
    new Date(a.party.eventDatetime).getTime() - new Date(b.party.eventDatetime).getTime()
  )

  const pastInvitations = invitations.filter(inv =>
    new Date(inv.party.eventDatetime) <= new Date()
  ).sort((a, b) =>
    new Date(b.party.eventDatetime).getTime() - new Date(a.party.eventDatetime).getTime()
  )

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">{tr('title')}</h1>
          <p className="text-neutral-600 mt-2">
            {tr('subtitle')}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Upcoming Invitations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            {t('invitations.upcoming', { count: upcomingInvitations.length })}
          </h2>

          {upcomingInvitations.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-neutral-400 text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {tr('noUpcoming')}
              </h3>
              <p className="text-neutral-600">
                {tr('noUpcomingDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingInvitations.map((invitation) => (
                <div key={invitation.id} className="card">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {invitation.party.childName}'s {invitation.party.childAge}{t('children.years')}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRsvpStatusColor(invitation.rsvp?.status)}`}>
                          {getStatusText(invitation.rsvp?.status)}
                        </span>
                      </div>

                      {invitation.party.theme && (
                        <p className="text-primary-600 mb-2">{invitation.party.theme} Theme</p>
                      )}

                      <div className="space-y-1 text-sm text-neutral-600 mb-3">
                        <p><strong>{tr('host')}</strong> {invitation.party.user.name || invitation.party.user.email}</p>
                        <p><strong>{t('rsvp.when')}</strong> {formatDate(new Date(invitation.party.eventDatetime), locale)}</p>
                        <p><strong>{t('rsvp.where')}</strong> {invitation.party.location}</p>
                      </div>

                      {invitation.party.notes && (
                        <div className="p-3 bg-neutral-50 rounded text-sm text-neutral-700 mb-3">
                          <strong>{t('rsvp.specialNotes')}</strong> {invitation.party.notes}
                        </div>
                      )}

                      {invitation.rsvp && (
                        <div className="text-xs text-neutral-500">
                          {tr('lastUpdated')} {new Date(invitation.rsvp.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/rsvp/${invitation.party.publicRsvpToken}` as any}
                        className="btn btn-primary"
                      >
                        {invitation.rsvp ? tr('updateRSVP') : tr('rsvpNow')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Invitations */}
        {pastInvitations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              {t('invitations.past', { count: pastInvitations.length })}
            </h2>

            <div className="space-y-3">
              {pastInvitations.map((invitation) => (
                <div key={invitation.id} className="card opacity-75">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-medium text-neutral-700">
                          {invitation.party.childName}'s {invitation.party.childAge}{t('children.years')}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRsvpStatusColor(invitation.rsvp?.status)}`}>
                          {getStatusText(invitation.rsvp?.status)}
                        </span>
                      </div>

                      <div className="text-sm text-neutral-500">
                        <span>{tr('host')} {invitation.party.user.name || invitation.party.user.email}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(new Date(invitation.party.eventDatetime), locale)}</span>
                        <span className="mx-2">•</span>
                        <span>{invitation.party.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}