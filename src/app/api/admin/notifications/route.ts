import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { isUndeliverableGuestEmail } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.authorized) {
      return adminCheck.response!
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const notifications = await prisma.emailNotification.findMany({
      where: {
        ...(status && status !== 'all' ? { status } : {}),
        ...(type && type !== 'all' ? { type } : {}),
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 200,
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
        createdAt: true,
        relatedId: true,
        user: {
          select: {
            email: true,
            name: true,
          }
        }
      }
    })

    const partyIds = Array.from(new Set(
      notifications
        .filter((notification) =>
          ['HOST_BROADCAST', 'PARTY_REMINDER_24H', 'HOST_PARTY_REMINDER_24H', 'PHOTO_SHARING_AVAILABLE'].includes(notification.type)
        )
        .map((notification) => notification.relatedId)
        .filter((id): id is string => Boolean(id))
    ))

    const parties = partyIds.length > 0
      ? await prisma.party.findMany({
          where: {
            id: { in: partyIds }
          },
          select: {
            id: true,
            eventDatetime: true,
            child: {
              select: {
                name: true
              }
            }
          }
        })
      : []

    const partyMap = new Map(
      parties.map((party) => [
        party.id,
        {
          id: party.id,
          childName: party.child.name,
          eventDatetime: party.eventDatetime,
        }
      ])
    )

    const stats = {
      total: notifications.length,
      pending: notifications.filter(n => n.status === 'pending').length,
      sent: notifications.filter(n => n.status === 'sent').length,
      failed: notifications.filter(n => n.status === 'failed').length,
    }

    return NextResponse.json({
      notifications: notifications.map((notification) => ({
        ...notification,
        email: isUndeliverableGuestEmail(notification.email) ? '' : notification.email,
        party: notification.relatedId ? partyMap.get(notification.relatedId) ?? null : null,
      })),
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
