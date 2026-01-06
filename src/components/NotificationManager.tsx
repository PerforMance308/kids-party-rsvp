'use client'

import { useState, useEffect } from 'react'

interface EmailNotification {
  id: string
  email: string
  type: string
  subject: string
  status: string
  sentAt?: string
  scheduledAt?: string
  attempts: number
  error?: string
}

export default function NotificationManager() {
  const [notifications, setNotifications] = useState<EmailNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [processingResult, setProcessingResult] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [emailConfig, setEmailConfig] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    loadNotifications()
    checkEmailConfig()
  }, [])

  const checkEmailConfig = async () => {
    try {
      const response = await fetch('/api/admin/test-email')
      if (response.ok) {
        const data = await response.json()
        setEmailConfig(data)
      }
    } catch (error) {
      console.error('Failed to check email config:', error)
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
        body: JSON.stringify({}) // Will use current user's email
      })

      const result = await response.json()

      if (response.ok) {
        setTestResult(result)
      } else {
        setError(result.error || 'Failed to send test email')
      }
    } catch (error) {
      setError('An error occurred while sending test email')
    } finally {
      setIsTesting(false)
    }
  }

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else {
        setError('Failed to load notifications')
      }
    } catch (error) {
      setError('An error occurred while loading notifications')
    } finally {
      setIsLoading(false)
    }
  }

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
        // Reload notifications after processing
        setTimeout(() => loadNotifications(), 1000)
      } else {
        setError(result.error || 'Failed to process notifications')
      }
    } catch (error) {
      setError('An error occurred while processing notifications')
    } finally {
      setIsProcessing(false)
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

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'PHOTO_SHARING_AVAILABLE':
        return '📷'
      case 'BIRTHDAY_PARTY_REMINDER':
        return '🎂'
      default:
        return '📧'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-neutral-600">Loading notifications...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Email Notifications
          </h2>
          <p className="text-neutral-600 text-sm">
            Manage automated email notifications
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={testEmailSending}
            disabled={isTesting}
            className="btn btn-secondary disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : '🧪 Test Email'}
          </button>
          <button
            onClick={triggerNotificationProcessing}
            disabled={isProcessing}
            className="btn btn-primary disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : '🔄 Process Notifications'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {processingResult && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ Processing completed! Processed {processingResult.emailsProcessed} emails.
        </div>
      )}

      {testResult && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ {testResult.message} at {new Date(testResult.timestamp).toLocaleTimeString()}
        </div>
      )}

      {/* Email Configuration Status */}
      {emailConfig && (
        <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
          <h3 className="font-medium text-neutral-900 mb-3">📧 Email Configuration</h3>
          
          {emailConfig.providers && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {emailConfig.providers.map((provider: any) => (
                <div key={provider.name} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium">{provider.name}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    provider.status === 'working' ? 'bg-green-100 text-green-700' :
                    provider.status === 'failed' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {provider.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {emailConfig.recommendations && emailConfig.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-neutral-800">Recommendations:</h4>
              {emailConfig.recommendations.map((rec: any, index: number) => (
                <div key={index} className={`p-2 rounded text-sm ${
                  rec.type === 'success' ? 'bg-green-50 text-green-700' :
                  rec.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  <div className="font-medium">{rec.message}</div>
                  <div className="text-xs mt-1 opacity-75">{rec.action}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {['pending', 'sent', 'failed'].map(status => {
          const count = notifications.filter(n => n.status === status).length
          return (
            <div key={status} className="bg-neutral-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-neutral-900">{count}</div>
              <div className={`text-sm capitalize ${getStatusColor(status).split(' ')[0]}`}>
                {status}
              </div>
            </div>
          )
        })}
        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-neutral-900">{notifications.length}</div>
          <div className="text-sm text-neutral-600">Total</div>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div key={notification.id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getTypeEmoji(notification.type)}</span>
                    <span className="text-sm font-medium text-neutral-900">
                      {notification.email}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(notification.status)}`}>
                      {notification.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-neutral-700 mb-2 line-clamp-1">
                    {notification.subject}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>Scheduled: {formatDate(notification.scheduledAt)}</span>
                    {notification.sentAt && (
                      <span>Sent: {formatDate(notification.sentAt)}</span>
                    )}
                    <span>Attempts: {notification.attempts}</span>
                  </div>
                  
                  {notification.error && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      Error: {notification.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📧</div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            No notifications yet
          </h3>
          <p className="text-neutral-600">
            Email notifications will appear here when scheduled or sent.
          </p>
        </div>
      )}
    </div>
  )
}