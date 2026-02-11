'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────
interface OverviewData {
  kpis: {
    totalUsers: number
    usersGrowthWeek: number
    usersGrowthMonth: number
    totalParties: number
    partiesGrowthWeek: number
    partiesGrowthMonth: number
    overallResponseRate: number
    emailDeliveryRate: number
    activeUsers: number
    totalRevenue: number
    monthlyRevenue: number
  }
  charts: {
    userGrowth: Array<{ date: string; count: number }>
    partyCreation: Array<{ date: string; count: number }>
    rsvpDistribution: Array<{ status: string; count: number }>
    revenueTrend: Array<{ date: string; amount: number; count: number }>
  }
  operationalMetrics: {
    userHealth: { verificationRate: number; retentionRate: number; avgPartiesPerUser: number }
    eventOps: { avgGuestsPerParty: number; avgResponseRate: number; upcomingEvents: number }
    emailHealth: { deliverySuccessRate: number; failureRate: number; pendingQueueSize: number }
    featureAdoption: { photoSharingRate: number; paidTemplateRate: number }
    revenue: {
      totalRevenue: number; monthlyRevenue: number
      byFeature: {
        photo_sharing: { total: number; count: number }
        template: { total: number; count: number }
      }
    }
  }
  activityFeed: Array<{ type: string; description: string; timestamp: string }>
}

// ── Helpers ───────────────────────────────────────────────────────
function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#94a3b8']

const ACTIVITY_ICONS: Record<string, string> = {
  user_registered: 'U',
  party_created: 'P',
  rsvp_received: 'R',
}
const ACTIVITY_COLORS: Record<string, string> = {
  user_registered: 'bg-blue-500',
  party_created: 'bg-purple-500',
  rsvp_received: 'bg-green-500',
}

// ── Skeleton ──────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-5 h-28">
            <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-6 h-80">
            <div className="h-5 bg-gray-200 rounded w-40 mb-6" />
            <div className="h-52 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon, gradient }: {
  title: string; value: string | number; sub: string; icon: string
  gradient: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[40px] opacity-10 ${gradient}`} />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 font-display">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

// ── Metric Row ────────────────────────────────────────────────────
function MetricRow({ label, value, suffix }: {
  label: string; value: string | number; suffix?: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">
        {value}{suffix}
      </span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
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
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return <Skeleton />

  const { kpis, charts, operationalMetrics: ops, activityFeed } = data

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 font-display">Dashboard</h1>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Total Users"
          value={kpis.totalUsers}
          sub={`+${kpis.usersGrowthWeek} this week / +${kpis.usersGrowthMonth} this month`}
          icon="👥"
          gradient="bg-blue-500"
        />
        <KpiCard
          title="Total Parties"
          value={kpis.totalParties}
          sub={`+${kpis.partiesGrowthWeek} this week / +${kpis.partiesGrowthMonth} this month`}
          icon="🎉"
          gradient="bg-purple-500"
        />
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          sub={`+${formatCurrency(kpis.monthlyRevenue)} this month`}
          icon="💰"
          gradient="bg-green-500"
        />
        <KpiCard
          title="Response Rate"
          value={`${kpis.overallResponseRate}%`}
          sub="Overall RSVP response"
          icon="📊"
          gradient="bg-amber-500"
        />
        <KpiCard
          title="Email Delivery"
          value={`${kpis.emailDeliveryRate}%`}
          sub={`${ops.emailHealth.pendingQueueSize} in queue`}
          icon="📧"
          gradient="bg-teal-500"
        />
        <KpiCard
          title="Active Users"
          value={kpis.activeUsers}
          sub="30-day active"
          icon="⚡"
          gradient="bg-rose-500"
        />
      </div>

      {/* ── Charts ────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 font-display">User Growth (30d)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={charts.userGrowth}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                labelFormatter={(v) => new Date(v).toLocaleDateString()}
                formatter={(value) => [value, 'New Users']}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorUsers)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Party Creation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 font-display">Party Creation (30d)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={charts.partyCreation}>
              <defs>
                <linearGradient id="colorParties" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                labelFormatter={(v) => new Date(v).toLocaleDateString()}
                formatter={(value) => [value, 'New Parties']}
              />
              <Area type="monotone" dataKey="count" stroke="#a855f7" fill="url(#colorParties)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 font-display">Revenue Trend (30d)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tickFormatter={(v) => `$${(v / 100).toFixed(0)}`} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                labelFormatter={(v) => new Date(v).toLocaleDateString()}
                formatter={(value) => [formatCurrency(value as number), 'Revenue']}
              />
              <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RSVP Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 font-display">RSVP Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={charts.rsvpDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="count"
                nameKey="status"
                label={({ name, value }) => `${name} (${value})`}
              >
                {charts.rsvpDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Guests']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Operational Metrics ──────────────────────────────── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* User Health */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 font-display flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            User Health
          </h3>
          <div className="divide-y divide-gray-50">
            <MetricRow label="Verification Rate" value={ops.userHealth.verificationRate} suffix="%" />
            <MetricRow label="Retention Rate" value={ops.userHealth.retentionRate} suffix="%" />
            <MetricRow label="Avg Parties/User" value={ops.userHealth.avgPartiesPerUser} />
          </div>
        </div>

        {/* Event Ops */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 font-display flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            Event Operations
          </h3>
          <div className="divide-y divide-gray-50">
            <MetricRow label="Avg Guests/Party" value={ops.eventOps.avgGuestsPerParty} />
            <MetricRow label="Avg Response Rate" value={ops.eventOps.avgResponseRate} suffix="%" />
            <MetricRow label="Upcoming Events" value={ops.eventOps.upcomingEvents} />
          </div>
        </div>

        {/* Email Health */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 font-display flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
            Email Health
          </h3>
          <div className="divide-y divide-gray-50">
            <MetricRow label="Delivery Rate" value={ops.emailHealth.deliverySuccessRate} suffix="%" />
            <MetricRow label="Failure Rate" value={ops.emailHealth.failureRate} suffix="%" />
            <MetricRow label="Pending Queue" value={ops.emailHealth.pendingQueueSize} />
          </div>
        </div>

        {/* Revenue & Features */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 font-display flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Revenue & Features
          </h3>
          <div className="divide-y divide-gray-50">
            <MetricRow label="Photo Sharing" value={formatCurrency(ops.revenue.byFeature.photo_sharing.total)} />
            <MetricRow label="Templates" value={formatCurrency(ops.revenue.byFeature.template.total)} />
            <MetricRow label="Photo Adoption" value={ops.featureAdoption.photoSharingRate} suffix="%" />
            <MetricRow label="Template Adoption" value={ops.featureAdoption.paidTemplateRate} suffix="%" />
          </div>
        </div>
      </div>

      {/* ── Activity Feed ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 font-display">Recent Activity</h2>
        {activityFeed.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No recent activity</p>
        ) : (
          <div className="space-y-0">
            {activityFeed.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className={`w-7 h-7 rounded-full ${ACTIVITY_COLORS[item.type] || 'bg-gray-400'} text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5`}>
                  {ACTIVITY_ICONS[item.type] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{item.description}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
