import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { isValidUUID, sanitizeInput } from '@/lib/security'
import { sendEmail, generateGuestMessageEmail } from '@/lib/email'
import { calculateAge, getBaseUrl } from '@/lib/utils'

const MESSAGE_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes
const MESSAGE_DAILY_LIMIT = 10

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!isValidUUID(token)) {
      return NextResponse.json({ error: 'Invalid invitation link' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id || !session.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const message = sanitizeInput(body?.message || '')
    if (!message || message.length < 2) {
      return NextResponse.json({ error: 'Message is too short' }, { status: 400 })
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 })
    }

    const party = await prisma.party.findUnique({
      where: { publicRsvpToken: token },
      include: {
        child: true,
        user: true
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    const guest = await prisma.guest.findFirst({
      where: {
        partyId: party.id,
        email: session.user.email
      },
      include: {
        rsvp: true
      }
    })

    if (!guest || !guest.rsvp || guest.rsvp.status === 'NO') {
      return NextResponse.json(
        { error: 'You need an active RSVP to message the host' },
        { status: 403 }
      )
    }

    const relatedId = `${party.id}:${guest.id}`
    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)

    const sentToday = await prisma.emailNotification.count({
      where: {
        type: 'GUEST_MESSAGE',
        relatedId,
        createdAt: {
          gte: dayStart
        }
      }
    })

    if (sentToday >= MESSAGE_DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily message limit reached. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    const latestMessage = await prisma.emailNotification.findFirst({
      where: {
        type: 'GUEST_MESSAGE',
        relatedId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        createdAt: true
      }
    })

    if (latestMessage) {
      const waitMs = MESSAGE_COOLDOWN_MS - (now.getTime() - latestMessage.createdAt.getTime())
      if (waitMs > 0) {
        return NextResponse.json(
          {
            error: `Please wait ${Math.ceil(waitMs / 1000)} seconds before sending another message.`
          },
          { status: 429 }
        )
      }
    }

    const childAge = calculateAge(party.child.birthDate)
    const emailContent = generateGuestMessageEmail(
      {
        childName: party.child.name,
        childAge,
        eventDatetime: party.eventDatetime,
        eventLocalDate: party.eventLocalDate,
        eventLocalTime: party.eventLocalTime,
        location: party.location,
        dashboardUrl: `${getBaseUrl()}/en/dashboard`,
      },
      {
        childName: guest.childName,
        email: guest.email,
        message,
      }
    )

    await sendEmail({
      to: party.user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    })

    await prisma.emailNotification.create({
      data: {
        userId: party.userId,
        email: party.user.email,
        type: 'GUEST_MESSAGE',
        subject: emailContent.subject,
        content: message,
        htmlContent: emailContent.html,
        relatedId,
        status: 'sent',
        sentAt: now
      } as any
    })

    return NextResponse.json({ message: 'Message sent to host' })
  } catch (error) {
    console.error('Send guest message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
