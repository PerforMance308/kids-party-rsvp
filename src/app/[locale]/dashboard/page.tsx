'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { PartyWithStats } from '@/types'
import { formatDate, getDaysUntilEvent, getDaysUntilColor } from '@/lib/utils'
import { useLocale, useLanguage } from '@/contexts/LanguageContext'
import {
  PencilIcon,
  TrashIcon,
  CakeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const { t } = useLanguage()
  const [parties, setParties] = useState<PartyWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingParty, setDeletingParty] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; partyId: string; childName: string }>({ open: false, partyId: '', childName: '' })
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || !session?.user?.id) {
      router.push(`/${locale}/login?redirect=/${locale}/dashboard`)
    }
  }, [status, session, router, locale])

  useEffect(() => {
    const fetchParties = async () => {
      if (status !== 'authenticated' || !session?.user?.id) return
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
      } catch {
        setError('An error occurred while loading parties')
      } finally {
        setIsLoading(false)
      }
    }
    fetchParties()
  }, [status, session, locale])

  const handleDeleteParty = async (partyId: string) => {
    setDeletingParty(partyId)
    setDeleteDialog({ open: false, partyId: '', childName: '' })
    setError('')
    try {
      const response = await fetch(`/api/parties/${partyId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        setParties(parties.filter(party => party.id !== partyId))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete party')
      }
    } catch {
      setError('An error occurred while deleting the party')
    } finally {
      setDeletingParty(null)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 w-48 bg-neutral-200 rounded-xl animate-pulse mb-2" />
              <div className="h-5 w-64 bg-neutral-100 rounded-xl animate-pulse" />
            </div>
            <div className="h-11 w-32 bg-neutral-200 rounded-xl animate-pulse" />
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="h-4 w-16 bg-neutral-100 rounded mb-3" />
                <div className="h-8 w-12 bg-neutral-200 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-1.5 w-full bg-neutral-100 rounded-full mb-5" />
                <div className="h-5 w-3/4 bg-neutral-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-neutral-100 rounded mb-4" />
                <div className="h-10 w-full bg-neutral-100 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session?.user?.id) {
    return null
  }

  // Compute dashboard stats
  const totalParties = parties.length
  const upcomingParties = parties.filter(p => getDaysUntilEvent(new Date(p.eventDatetime)) >= 0).length
  const totalGuests = parties.reduce((sum, p) => sum + p.stats.total, 0)
  const totalAttending = parties.reduce((sum, p) => sum + p.stats.attending, 0)
  const responseRate = totalGuests > 0 ? Math.round((totalAttending / totalGuests) * 100) : 0

  // Split into upcoming and past
  const upcoming = parties.filter(p => getDaysUntilEvent(new Date(p.eventDatetime)) >= 0)
  const past = parties.filter(p => getDaysUntilEvent(new Date(p.eventDatetime)) < 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-neutral-900">
              {t('dashboard.title')}
            </h1>
            <p className="text-neutral-500 mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>
          {parties.length > 0 && (
            <Link
              href={`/${locale}/party/new`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-100 px-3 py-2 text-sm font-semibold text-primary-800 shadow-sm hover:bg-primary-200 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.newParty')}</span>
              <span className="sm:hidden">{t('nav.newParty')}</span>
            </Link>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Stats Overview */}
        {parties.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-5 border border-primary-100">
              <div className="flex items-center gap-2 mb-2">
                <CakeIcon className="w-4 h-4 text-primary-500" />
                <span className="text-xs font-medium text-primary-600">
                  {locale === 'zh' ? '总派对' : 'Total Parties'}
                </span>
              </div>
              <span className="font-display text-2xl font-bold text-neutral-900">{totalParties}</span>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-600">
                  {locale === 'zh' ? '即将到来' : 'Upcoming'}
                </span>
              </div>
              <span className="font-display text-2xl font-bold text-neutral-900">{upcomingParties}</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <UserGroupIcon className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">
                  {locale === 'zh' ? '总宾客' : 'Total Guests'}
                </span>
              </div>
              <span className="font-display text-2xl font-bold text-neutral-900">{totalGuests}</span>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-600">
                  {locale === 'zh' ? '回复率' : 'Response Rate'}
                </span>
              </div>
              <span className="font-display text-2xl font-bold text-neutral-900">{responseRate}%</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {parties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-2xl border border-neutral-100"
          >
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CakeIcon className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="font-display text-lg font-bold text-neutral-900 mb-2">
              {t('dashboard.noParties')}
            </h3>
            <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
              {t('dashboard.noPartiesDesc')}
            </p>
            <Link href={`/${locale}/party/new`} className="btn btn-primary inline-flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              {t('dashboard.planFirst')}
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Upcoming Parties */}
            {upcoming.length > 0 && (
              <div className="mb-8">
                <h2 className="font-display text-lg font-bold text-neutral-900 mb-4">
                  {locale === 'zh' ? '即将到来' : 'Upcoming'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upcoming.map((party, i) => (
                    <PartyCard
                      key={party.id}
                      party={party}
                      locale={locale}
                      t={t}
                      deletingParty={deletingParty}
                      onDelete={(id, name) => setDeleteDialog({ open: true, partyId: id, childName: name })}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Parties (collapsed by default) */}
            {past.length > 0 && (
              <div>
                <button
                  onClick={() => setShowPast(!showPast)}
                  className="flex items-center gap-2 mb-4 group"
                >
                  <motion.span
                    animate={{ rotate: showPast ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-neutral-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </motion.span>
                  <h2 className="font-display text-lg font-bold text-neutral-400 group-hover:text-neutral-500 transition-colors">
                    {locale === 'zh' ? '已结束' : 'Past'} ({past.length})
                  </h2>
                </button>
                <AnimatePresence>
                  {showPast && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {past.map((party, i) => (
                          <PartyCard
                            key={party.id}
                            party={party}
                            locale={locale}
                            t={t}
                            deletingParty={deletingParty}
                            onDelete={(id, name) => setDeleteDialog({ open: true, partyId: id, childName: name })}
                            index={i}
                            isPast
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, partyId: '', childName: '' })}
        onConfirm={() => handleDeleteParty(deleteDialog.partyId)}
        title={locale === 'zh' ? '删除派对' : 'Delete Party'}
        message={locale === 'zh'
          ? `确定要删除 ${deleteDialog.childName} 的派对吗？此操作不可撤销。`
          : `Are you sure you want to delete ${deleteDialog.childName}'s party? This action cannot be undone.`}
        confirmText={locale === 'zh' ? '确认删除' : 'Delete'}
        cancelText={locale === 'zh' ? '取消' : 'Cancel'}
        variant="danger"
        loading={deletingParty === deleteDialog.partyId}
      />
    </div>
  )
}

function PartyCard({
  party,
  locale,
  t,
  deletingParty,
  onDelete,
  index,
  isPast = false,
}: {
  party: PartyWithStats
  locale: string
  t: (key: string, params?: Record<string, any>) => string
  deletingParty: string | null
  onDelete: (id: string, childName: string) => void
  index: number
  isPast?: boolean
}) {
  const daysUntil = getDaysUntilEvent(new Date(party.eventDatetime))
  const isUpcoming = daysUntil >= 0
  const total = party.stats.total
  const responded = party.stats.attending + party.stats.notAttending + party.stats.maybe
  const progressPercent = total > 0 ? Math.round((responded / total) * 100) : 0

  // Theme color mapping
  const themeColors: Record<string, string> = {
    dinosaur: 'bg-emerald-400',
    princess: 'bg-pink-400',
    unicorn: 'bg-purple-400',
    superhero: 'bg-blue-400',
  }
  const themeKey = party.theme?.toLowerCase() || ''
  const colorBar = Object.entries(themeColors).find(([k]) => themeKey.includes(k))?.[1] || 'bg-primary-400'

  // Format date prominently
  const eventDate = new Date(party.eventDatetime)
  const month = eventDate.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'short' }).toUpperCase()
  const day = eventDate.getDate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col ${
        isPast
          ? 'bg-neutral-50 border-neutral-200 opacity-75'
          : 'bg-white border-neutral-100 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5'
      }`}
    >
      {/* Theme color bar */}
      <div className={`h-1.5 ${colorBar}`} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex gap-4 mb-4">
          {/* Date badge */}
          <div className="flex-shrink-0 w-14 h-14 bg-neutral-50 rounded-xl flex flex-col items-center justify-center border border-neutral-100">
            <span className="text-[10px] font-bold text-primary-600 leading-none">{month}</span>
            <span className="text-xl font-bold text-neutral-900 leading-tight">{day}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-neutral-900 truncate">
              {t('dashboard.partyTitle', { childName: party.childName, age: party.childAge })}
            </h3>
            {party.theme && (
              <p className="text-sm text-primary-500 truncate">{party.theme}</p>
            )}
            <p className="text-xs text-neutral-400 truncate">{party.location}</p>
          </div>

          {isUpcoming ? (
            <span className={`self-start px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getDaysUntilColor(daysUntil)}`}>
              {daysUntil === 0 ? t('dashboard.today') : t('dashboard.daysLeft', { days: daysUntil })}
            </span>
          ) : (
            <span className="self-start px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-neutral-100 text-neutral-500">
              {locale === 'zh' ? '已结束' : 'Ended'}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
              <span>{responded}/{total} {locale === 'zh' ? '已回复' : 'responded'}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 + 0.3 }}
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Quick stats row */}
        <div className="grid grid-cols-4 gap-1 mb-4 text-center">
          <div className="py-1.5">
            <div className="text-sm font-bold text-neutral-700">{party.stats.total}</div>
            <div className="text-[10px] text-neutral-400">{t('dashboard.stats.invited')}</div>
          </div>
          <div className="py-1.5">
            <div className="text-sm font-bold text-emerald-600">{party.stats.attending}</div>
            <div className="text-[10px] text-neutral-400">{t('dashboard.stats.yes')}</div>
          </div>
          <div className="py-1.5">
            <div className="text-sm font-bold text-red-500">{party.stats.notAttending}</div>
            <div className="text-[10px] text-neutral-400">{t('dashboard.stats.no')}</div>
          </div>
          <div className="py-1.5">
            <div className="text-sm font-bold text-amber-600">{party.stats.maybe}</div>
            <div className="text-[10px] text-neutral-400">{t('dashboard.stats.maybe')}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-2">
          <Link
            href={`/${locale}/party/${party.id}/dashboard`}
            className={`w-full text-center block text-sm ${isPast ? 'btn btn-secondary' : 'btn btn-primary'}`}
          >
            {isPast ? (locale === 'zh' ? '查看详情' : 'View Details') : t('dashboard.manageParty')}
          </Link>
          {!isPast && (
            <div className="flex gap-2">
              <Link
                href={`/${locale}/party/${party.id}/edit`}
                className="flex-1 btn btn-secondary text-center text-sm inline-flex items-center justify-center gap-1.5"
              >
                <PencilIcon className="w-3.5 h-3.5" />
                {t('dashboard.edit')}
              </Link>
              <button
                onClick={() => onDelete(party.id, party.childName)}
                disabled={deletingParty === party.id}
                className="flex-1 btn text-sm text-red-600 hover:bg-red-50 border border-red-200 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                {deletingParty === party.id ? (
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <TrashIcon className="w-3.5 h-3.5" />
                )}
                {deletingParty === party.id ? t('dashboard.deleting') : t('dashboard.delete')}
              </button>
            </div>
          )}
          {isPast && (
            <button
              onClick={() => onDelete(party.id, party.childName)}
              disabled={deletingParty === party.id}
              className="w-full btn text-sm text-red-600 hover:bg-red-50 border border-red-200 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              {deletingParty === party.id ? (
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <TrashIcon className="w-3.5 h-3.5" />
              )}
              {deletingParty === party.id ? t('dashboard.deleting') : t('dashboard.delete')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

