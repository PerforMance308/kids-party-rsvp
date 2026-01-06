'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import NotificationManager from '@/components/NotificationManager'

export default function NotificationsAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Notifications Admin
          </h1>
          <p className="text-neutral-600">
            Manage and monitor automated email notifications
          </p>
        </div>

        <NotificationManager />

        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="btn btn-secondary"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}