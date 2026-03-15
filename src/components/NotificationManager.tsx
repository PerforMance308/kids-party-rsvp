'use client'

import { useEffect, useMemo, useState } from 'react'
import { getGuestEmailDisplay } from '@/lib/utils'

interface EmailNotification {
  id: string
  email: string
  type: string
  subject: string
  status: string
  sentAt?: string | null
  scheduledAt?: string | null
  attempts: number
  error?: string | null
  createdAt: string
  user?: {
    email: string
    name?: string | null
  } | null
  party?: {
    id: string
    childName: string
    eventDatetime: string
  } | null
}

interface NotificationResponse {
  notifications: EmailNotification[]
  stats: {
    total: number
    pending: number
    sent: number
    failed: number
  }
}

const STATUS_OPTIONS = ['all', 'pending', 'sent', 'failed'] as const
const TYPE_OPTIONS = [
  'all',
  'HOST_BROADCAST',
  'PARTY_REMINDER_24H',
  'HOST_PARTY_REMINDER_24H',
  'PHOTO_SHARING_AVAILABLE',
  'BIRTHDAY_PARTY_REMINDER',
  'HOST_BROADCAST_PAYMENT_USAGE',
] as const

export default function NotificationManager() {
  const [notifications, setNotifications] = useState<EmailNotification[]>([])
  const [stats, setStats] = useState<NotificationResponse['stats'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [processingResult, setProcessingResult] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [emailConfig, setEmailConfig] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('all')
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_OPTIONS)[number]>('all')

  useEffect(() => {
    void loadNotifications()
    void checkEmailConfig()
  }, [])

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (statusFilter !== 'all' && notification.status !== statusFilter) return false
      if (typeFilter !== 'all' && notification.type !== typeFilter) return false
      return true
    })
  }, [notifications, statusFilter, typeFilter])

  const checkEmailConfig = async () => {
    try {
      const response = await fetch('/api/admin/test-email')
      if (response.ok) {
        const data = await response.json()
        setEmailConfig(data)
      }
    } catch (loadError) {
      console.error('Failed to check email config:', loadError)
    }
  }

  const testEmailSending = async () => {
    setIsTesting(true)
    setTestResult(null)
    setError('')

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const result = await response.json()

      if (response.ok) {
        setTestResult(result)
      } else {
        setError(result.error || 'Failed to send test email')
      }
    } catch {
      setError('An error occurred while sending test email')
    } finally {
      setIsTesting(false)
    }
  }

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)

      const response = await fetch(`/api/admin/notifications${params.size ? `?${params.toString()}` : ''}`)
      if (!response.ok) {
        setError('Failed to load notifications')
        return
      }

      const data: NotificationResponse = await response.json()
      setNotifications(data.notifications || [])
      setStats(data.stats)
    } catch {
      setError('An error occurred while loading notifications')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading) {
      void loadNotifications()
    }
  }, [statusFilter, typeFilter])

  const triggerNotificationProcessing = async () => {
    setIsProcessing(true)
    setError('')
    setProcessingResult(null)

    try {
      const response = await fetch('/api/admin/trigger-notifications', {
        method: 'POST'
      })

      const result = await response.json()

      if (response.ok) {
        setProcessingResult(result)
        await loadNotifications()
      } else {
        setError(result.error || 'Failed to process notifications')
      }
    } catch {
      setError('An error occurred while processing notifications')
    } finally {
      setIsProcessing(false)
    }
  }

  const retryNotification = async (id: string) => {
    setRetryingId(id)
    setError('')

    try {
      const response = await fetch(`/api/admin/notifications/${id}/retry`, {
        method: 'POST',
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Failed to resend notification')
        return
      }

      setProcessingResult({
        message: result.message,
        timestamp: result.timestamp,
      })
      await loadNotifications()
    } catch {
      setError('An error occurred while resending notification')
    } finally {
      setRetryingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-neutral-600 bg-neutral-100'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'HOST_BROADCAST':
        return 'Broadcast'
      case 'PARTY_REMINDER_24H':
        return 'Guest 24h Reminder'
      case 'HOST_PARTY_REMINDER_24H':
        return 'Host 24h Reminder'
      case 'PHOTO_SHARING_AVAILABLE':
        return 'Photo Sharing'
      case 'BIRTHDAY_PARTY_REMINDER':
        return 'Birthday Reminder'
      case 'HOST_BROADCAST_PAYMENT_USAGE':
        return 'Broadcast Payment'
      default:
        return type
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const renderStats = stats ?? {
    total: notifications.length,
    pending: notifications.filter(n => n.status === 'pending').length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8 text-neutral-600">Loading notifications...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review delivery results, inspect broadcast sends, and manually resend failed emails.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void loadNotifications()}
              className="btn btn-secondary"
            >
              Refresh
            </button>
            <button
              onClick={testEmailSending}
              disabled={isTesting}
              className="btn btn-secondary disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Email'}
            </button>
            <button
              onClick={triggerNotificationProcessing}
              disabled={isProcessing}
              className="btn btn-primary disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Process Queue'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {processingResult?.message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {processingResult.message}
          </div>
        )}

        {testResult && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {testResult.message} at {new Date(testResult.timestamp).toLocaleTimeString()}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Pending" value={renderStats.pending} tone="text-yellow-700" />
          <StatCard label="Sent" value={renderStats.sent} tone="text-green-700" />
          <StatCard label="Failed" value={renderStats.failed} tone="text-red-700" />
          <StatCard label="Total" value={renderStats.total} tone="text-gray-700" />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
            className="input md:w-48"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All statuses' : status}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as (typeof TYPE_OPTIONS)[number])}
            className="input md:w-64"
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All types' : getTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        {emailConfig && (
          <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <h2 className="font-medium text-neutral-900 mb-3">Email Configuration</h2>
            {emailConfig.providers && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {emailConfig.providers.map((provider: any) => (
                  <div key={provider.name} className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200">
                    <span className="font-medium text-sm text-neutral-900">{provider.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      provider.status === 'working'
                        ? 'bg-green-100 text-green-700'
                        : provider.status === 'failed'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {provider.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const displayEmail = getGuestEmailDisplay(notification.email) || '(no deliverable email)'
              return (
                <div key={notification.id} className="border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-neutral-900">{notification.subject}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(notification.status)}`}>
                          {notification.status}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-700">
                          {getTypeLabel(notification.type)}
                        </span>
                      </div>

                      <div className="text-sm text-neutral-700 mb-1">{displayEmail}</div>
                      <div className="text-xs text-neutral-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Created: {formatDate(notification.createdAt)}</span>
                        <span>Scheduled: {formatDate(notification.scheduledAt)}</span>
                        <span>Sent: {formatDate(notification.sentAt)}</span>
                        <span>Attempts: {notification.attempts}</span>
                      </div>

                      {(notification.user || notification.party) && (
                        <div className="mt-2 text-xs text-neutral-500 flex flex-wrap gap-x-4 gap-y-1">
                          {notification.user && (
                            <span>Owner: {notification.user.name || notification.user.email}</span>
                          )}
                          {notification.party && (
                            <span>
                              Party: {notification.party.childName} ({formatDate(notification.party.eventDatetime)})
                            </span>
                          )}
                        </div>
                      )}

                      {notification.error && (
                        <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 p-2 rounded-lg">
                          Error: {notification.error}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => void retryNotification(notification.id)}
                        disabled={retryingId === notification.id}
                        className="btn btn-secondary disabled:opacity-50"
                      >
                        {retryingId === notification.id ? 'Resending...' : 'Resend'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-neutral-500">
            No notifications match the current filters.
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
      <div className="text-2xl font-bold text-neutral-900">{value}</div>
      <div className={`text-sm ${tone}`}>{label}</div>
    </div>
  )
}
