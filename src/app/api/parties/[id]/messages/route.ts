import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const party = await prisma.party.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      select: { id: true }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    const notifications = await prisma.emailNotification.findMany({
      where: {
        type: 'GUEST_MESSAGE',
        relatedId: {
          startsWith: `${id}:`
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
      select: {
        id: true,
        relatedId: true,
        content: true,
        createdAt: true
      }
    })

    const guestIds = Array.from(
      new Set(
        notifications
          .map(n => (n.relatedId || '').split(':')[1])
          .filter(Boolean)
      )
    )

    const guests = guestIds.length > 0
      ? await prisma.guest.findMany({
          where: {
            id: {
              in: guestIds
            }
          },
          select: {
            id: true,
            childName: true,
            email: true
          }
        })
      : []

    const guestMap = new Map(guests.map(g => [g.id, g]))

    const messages = notifications.map(n => {
      const guestId = (n.relatedId || '').split(':')[1]
      const guest = guestId ? guestMap.get(guestId) : undefined
      return {
        id: n.id,
        guestId: guest?.id || null,
        childName: guest?.childName || 'Guest',
        guestEmail: guest?.email || '',
        message: n.content,
        createdAt: n.createdAt
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Get guest messages error:', error)
    return NextResponse.json(
      { error: 'Failed to load messages' },
      { status: 500 }
    )
  }
}
