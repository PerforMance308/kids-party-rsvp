import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'
import { sendEmail } from '@/lib/email'
import { calculateAge } from '@/lib/utils'

const BROADCAST_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes
const BROADCAST_DAILY_LIMIT = 3
const BROADCAST_MAX_RECIPIENTS = 200

function uniqueEmails(emails: string[]) {
  return Array.from(new Set(emails.map(e => e.trim().toLowerCase()).filter(Boolean)))
}

export async function POST(
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
      include: {
        child: true,
        guests: true
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    const body = await request.json()
    const subject = sanitizeInput(body?.subject || '')
    const message = sanitizeInput(body?.message || '')

    if (subject.length < 3 || subject.length > 120) {
      return NextResponse.json({ error: 'Subject must be 3-120 characters' }, { status: 400 })
    }
    if (message.length < 3 || message.length > 1000) {
      return NextResponse.json({ error: 'Message must be 3-1000 characters' }, { status: 400 })
    }

    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const sentToday = await prisma.reminder.count({
      where: {
        partyId: party.id,
        type: 'HOST_BROADCAST',
        sentAt: {
          gte: dayAgo
        }
      }
    })

    if (sentToday >= BROADCAST_DAILY_LIMIT) {
      return NextResponse.json(
        { error: `Daily broadcast limit reached (${BROADCAST_DAILY_LIMIT}/day)` },
        { status: 429 }
      )
    }

    const lastBroadcast = await prisma.reminder.findFirst({
      where: {
        partyId: party.id,
        type: 'HOST_BROADCAST',
        sentAt: { not: null }
      },
      orderBy: {
        sentAt: 'desc'
      }
    })

    if (lastBroadcast?.sentAt) {
      const waitMs = BROADCAST_COOLDOWN_MS - (now.getTime() - lastBroadcast.sentAt.getTime())
      if (waitMs > 0) {
        return NextResponse.json(
          { error: `Please wait ${Math.ceil(waitMs / 60_000)} minutes before next broadcast` },
          { status: 429 }
        )
      }
    }

    const recipients = uniqueEmails(party.guests.map(g => g.email))
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No guest emails found for this party' }, { status: 400 })
    }
    if (recipients.length > BROADCAST_MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Too many recipients. Maximum ${BROADCAST_MAX_RECIPIENTS} per broadcast.` },
        { status: 400 }
      )
    }

    const childAge = party.targetAge ?? calculateAge(party.child.birthDate)
    const whenText = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(party.eventDatetime))

    const safeMessage = message.replace(/\n/g, '<br>')
    const html = `
      <p><strong>Party update for ${party.child.name}'s ${childAge}th birthday</strong></p>
      <p><strong>When:</strong> ${whenText}</p>
      <p><strong>Where:</strong> ${party.location}</p>
      <hr />
      <p>${safeMessage}</p>
    `
    const text = `Party update for ${party.child.name}'s ${childAge}th birthday\nWhen: ${whenText}\nWhere: ${party.location}\n\n${message}`

    const results = await Promise.allSettled(
      recipients.map(email => sendEmail({ to: email, subject, text, html }))
    )
    const successCount = results.filter(r => r.status === 'fulfilled').length

    await prisma.reminder.create({
      data: {
        partyId: party.id,
        type: 'HOST_BROADCAST',
        sentAt: now
      }
    })

    await prisma.emailNotification.createMany({
      data: recipients.map(email => ({
        userId: session.user.id!,
        email,
        type: 'HOST_BROADCAST',
        subject,
        content: text,
        htmlContent: html,
        relatedId: party.id,
        status: 'sent',
        sentAt: now
      })) as any[]
    })

    return NextResponse.json({
      message: `Broadcast sent to ${successCount} guests`,
      totalRecipients: recipients.length,
      sentToday: sentToday + 1,
      dailyLimit: BROADCAST_DAILY_LIMIT
    })
  } catch (error) {
    console.error('Broadcast send error:', error)
    return NextResponse.json(
      { error: 'Failed to send broadcast' },
      { status: 500 }
    )
  }
}
