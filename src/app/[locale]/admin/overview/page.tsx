'use client'

import { useEffect, useState } from 'react'

interface OverviewData {
  stats: {
    users: { total: number; verified: number; unverified: number; newToday: number; newThisWeek: number }
    parties: { total: number; upcoming: number; past: number }
    guests: { total: number; attending: number; declined: number; maybe: number; pending: number }
    children: { total: number }
    emails: { total: number; sent: number; pending: number; failed: number }
  }
  recent: {
    users: Array<{
      id: string; email: string; emailVerified: string | null
      createdAt: string; role: string; partyCount: number
    }>
    parties: Array<{
      id: string; childName: string; targetAge: number | null
      eventDatetime: string; location: string; createdAt: string
      guestCount: number; rsvpStats: Record<string, number>
    }>
    rsvps: Array<{
      id: string; childName: string; status: string
      partyId: string; updatedAt: string
    }>
  }
}

function StatCard({ label, value, sub, color }: {
  label: string; value: number; sub?: string; color: string
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 p-5 ${color}`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-5 h-24">
            <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
            <div className="h-7 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-200 rounded w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    attending: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    maybe: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {status}
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(setData)
      .catch(() => setError('Failed to load overview data'))
  }, [])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return <Skeleton />

  const { stats, recent } = data
  const responseRate = stats.guests.total > 0
    ? Math.round(((stats.guests.attending + stats.guests.declined + stats.guests.maybe) / stats.guests.total) * 100)
    : 0

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Users"
          value={stats.users.total}
          sub={`${stats.users.verified} verified · +${stats.users.newThisWeek} this week`}
          color="border-blue-500"
        />
        <StatCard
          label="Parties"
          value={stats.parties.total}
          sub={`${stats.parties.upcoming} upcoming · ${stats.parties.past} past`}
          color="border-purple-500"
        />
        <StatCard
          label="Guests"
          value={stats.guests.total}
          sub={`${stats.guests.attending} yes · ${stats.guests.declined} no · ${stats.guests.maybe} maybe`}
          color="border-green-500"
        />
        <StatCard
          label="Response Rate"
          value={responseRate}
          sub={`${stats.guests.pending} pending`}
          color="border-amber-500"
        />
        <StatCard
          label="Emails"
          value={stats.emails.total}
          sub={`${stats.emails.sent} sent · ${stats.emails.pending} pending${stats.emails.failed ? ` · ${stats.emails.failed} failed` : ''}`}
          color="border-teal-500"
        />
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Verified</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-right">Parties</th>
                <th className="px-6 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{user.email}</td>
                  <td className="px-6 py-3">
                    {user.emailVerified ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {user.role === 'ADMIN' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Admin</span>
                    ) : (
                      <span className="text-gray-500">User</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">{user.partyCount}</td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
              {recent.users.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Parties */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Parties</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Child</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Location</th>
                <th className="px-6 py-3 text-right">Guests</th>
                <th className="px-6 py-3 text-left">RSVPs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.parties.map((party) => (
                <tr key={party.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {party.childName}
                    {party.targetAge != null && (
                      <span className="text-gray-400 ml-1 text-xs">({party.targetAge}y)</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{formatDateTime(party.eventDatetime)}</td>
                  <td className="px-6 py-3 text-gray-500 max-w-[200px] truncate">{party.location}</td>
                  <td className="px-6 py-3 text-right">{party.guestCount}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(party.rsvpStats).map(([status, count]) => (
                        <span key={status} className="text-xs">
                          <StatusBadge status={status} /> {count}
                        </span>
                      ))}
                      {Object.keys(party.rsvpStats).length === 0 && (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {recent.parties.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No parties yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent RSVPs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent RSVPs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Child Name</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.rsvps.map((rsvp) => (
                <tr key={rsvp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{rsvp.childName}</td>
                  <td className="px-6 py-3"><StatusBadge status={rsvp.status} /></td>
                  <td className="px-6 py-3 text-gray-500">{formatDateTime(rsvp.updatedAt)}</td>
                </tr>
              ))}
              {recent.rsvps.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No RSVPs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
