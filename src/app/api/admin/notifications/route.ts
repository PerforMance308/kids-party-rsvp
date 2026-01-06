import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd want to restrict this to admin users only
    // For demo purposes, we'll allow authenticated users to see notifications
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get all notifications, ordered by creation date
    const notifications = await prisma.emailNotification.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 100, // Limit to last 100 notifications
      select: {
        id: true,
        email: true,
        type: true,
        subject: true,
        status: true,
        sentAt: true,
        scheduledAt: true,
        attempts: true,
        error: true,
        createdAt: true
      }
    })

    // Get statistics
    const stats = {
      total: notifications.length,
      pending: notifications.filter(n => n.status === 'pending').length,
      sent: notifications.filter(n => n.status === 'sent').length,
      failed: notifications.filter(n => n.status === 'failed').length,
    }

    return NextResponse.json({
      notifications,
      stats
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}