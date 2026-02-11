import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'
import { sendEmail } from '@/lib/email'
import { calculateAge } from '@/lib/utils'
import Stripe from 'stripe'

const BROADCAST_FREE_DAILY_LIMIT = 1
const BROADCAST_EXTRA_PRICE_CENTS = 99
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
    const paymentId = sanitizeInput(body?.paymentId || '')

    if (subject.length < 3 || subject.length > 120) {
      return NextResponse.json({ error: 'Subject must be 3-120 characters' }, { status: 400 })
    }
    if (message.length < 3 || message.length > 1000) {
      return NextResponse.json({ error: 'Message must be 3-1000 characters' }, { status: 400 })
    }

    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)

    const sentToday = await prisma.reminder.count({
      where: {
        partyId: party.id,
        type: 'HOST_BROADCAST',
        sentAt: {
          gte: dayStart
        }
      }
    })

    const extraBroadcastNeeded = sentToday >= BROADCAST_FREE_DAILY_LIMIT
    if (extraBroadcastNeeded) {
      if (!paymentId) {
        return NextResponse.json(
          {
            error: 'Payment required for additional broadcasts today',
            code: 'PAYMENT_REQUIRED',
            price: 0.99,
            currency: 'USD',
            sentToday,
            freeLimit: BROADCAST_FREE_DAILY_LIMIT
          },
          { status: 402 }
        )
      }

      const alreadyUsedPayment = await prisma.emailNotification.findFirst({
        where: {
          type: 'HOST_BROADCAST_PAYMENT_USAGE',
          relatedId: paymentId
        },
        select: { id: true }
      })
      if (alreadyUsedPayment) {
        return NextResponse.json(
          { error: 'This payment has already been used for a broadcast' },
          { status: 400 }
        )
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json(
          { error: 'Payment service is not configured' },
          { status: 500 }
        )
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia',
      })

      let paymentIntent: Stripe.PaymentIntent
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentId)
      } catch (verificationError) {
        return NextResponse.json(
          { error: 'Failed to verify payment' },
          { status: 400 }
        )
      }

      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json(
          { error: 'Payment has not been completed' },
          { status: 400 }
        )
      }
      if (paymentIntent.amount !== BROADCAST_EXTRA_PRICE_CENTS) {
        return NextResponse.json(
          { error: 'Payment amount verification failed' },
          { status: 400 }
        )
      }
      if (
        paymentIntent.metadata?.feature !== 'broadcast_extra' ||
        paymentIntent.metadata?.partyId !== party.id ||
        paymentIntent.metadata?.userId !== session.user.id
      ) {
        return NextResponse.json(
          { error: 'Payment metadata verification failed' },
          { status: 400 }
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

    // Record broadcast + payment usage in DB first, then return immediately
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

    if (extraBroadcastNeeded && paymentId) {
      await prisma.emailNotification.create({
        data: {
          userId: session.user.id!,
          email: session.user.email || '',
          type: 'HOST_BROADCAST_PAYMENT_USAGE',
          subject: 'Broadcast extra payment used',
          content: `Payment ${paymentId} used for party ${party.id}`,
          relatedId: paymentId,
          status: 'sent',
          sentAt: now
        } as any
      })
    }

    // Fire-and-forget: send emails in background, don't block response
    Promise.allSettled(
      recipients.map(email => sendEmail({ to: email, subject, text, html }))
    ).catch(err => console.error('Background email send error:', err))

    return NextResponse.json({
      message: `Sending broadcast to ${recipients.length} guests`,
      totalRecipients: recipients.length,
      sentToday: sentToday + 1,
      freeDailyLimit: BROADCAST_FREE_DAILY_LIMIT
    })
  } catch (error) {
    console.error('Broadcast send error:', error)
    return NextResponse.json(
      { error: 'Failed to send broadcast' },
      { status: 500 }
    )
  }
}

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
      where: { id, userId: session.user.id },
      select: { id: true }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)

    const sentToday = await prisma.reminder.count({
      where: {
        partyId: party.id,
        type: 'HOST_BROADCAST',
        sentAt: { gte: dayStart }
      }
    })

    return NextResponse.json({
      sentToday,
      freeLimit: BROADCAST_FREE_DAILY_LIMIT
    })
  } catch (error) {
    console.error('Broadcast usage query error:', error)
    return NextResponse.json(
      { error: 'Failed to query broadcast usage' },
      { status: 500 }
    )
  }
}
