import { NextRequest, NextResponse, after } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withBackgroundPrisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'
import { sendEmail, generateBroadcastEmail } from '@/lib/email'
import { calculateAge, getBaseUrl, isUndeliverableGuestEmail } from '@/lib/utils'
import { getBroadcastExtraPrice, normalizeSupportedCurrency } from '@/lib/broadcast-pricing'
import Stripe from 'stripe'

const BROADCAST_FREE_DAILY_LIMIT = 1
const BROADCAST_MAX_RECIPIENTS = 200

function uniqueEmails(emails: string[]) {
  return Array.from(new Set(emails.map(e => e.trim().toLowerCase()).filter(Boolean)))
}

function isDeliverableEmail(email: string) {
  return !isUndeliverableGuestEmail(email)
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
    const requestedCurrency = normalizeSupportedCurrency(body?.currency)

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
        const pricing = getBroadcastExtraPrice(requestedCurrency)
        return NextResponse.json(
          {
            error: 'Payment required for additional broadcasts today',
            code: 'PAYMENT_REQUIRED',
            price: pricing.price,
            currency: pricing.currency,
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
      if (paymentIntent.amount <= 0) {
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

      const expectedPricing = getBroadcastExtraPrice(paymentIntent.metadata?.currency || paymentIntent.currency)
      if (paymentIntent.amount !== Math.round(expectedPricing.price * 100)) {
        return NextResponse.json(
          { error: 'Payment amount verification failed' },
          { status: 400 }
        )
      }
      if (paymentIntent.currency.toUpperCase() !== expectedPricing.currency) {
        return NextResponse.json(
          { error: 'Payment currency verification failed' },
          { status: 400 }
        )
      }
    }

    const recipients = uniqueEmails(party.guests.map(g => g.email)).filter(isDeliverableEmail)
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No deliverable guest emails found for this party' }, { status: 400 })
    }
    if (recipients.length > BROADCAST_MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Too many recipients. Maximum ${BROADCAST_MAX_RECIPIENTS} per broadcast.` },
        { status: 400 }
      )
    }

    const childAge = party.targetAge ?? calculateAge(party.child.birthDate)
    const hostName = session.user.name || 'The Host'
    const rsvpUrl = party.publicRsvpToken ? `${getBaseUrl()}/rsvp/${party.publicRsvpToken}` : getBaseUrl()

    const emailContent = generateBroadcastEmail(
      {
        childName: party.child.name,
        childAge,
        eventDatetime: party.eventDatetime,
        eventLocalDate: party.eventLocalDate,
        eventLocalTime: party.eventLocalTime,
        location: party.location,
        rsvpUrl,
      },
      subject,
      message,
      hostName
    )

    const html = emailContent.html
    const text = emailContent.text

    const notifications = await prisma.$transaction(async (tx) => {
      await tx.reminder.create({
        data: {
          partyId: party.id,
          type: 'HOST_BROADCAST',
          sentAt: now
        }
      })

      const createdNotifications = await Promise.all(
        recipients.map(email =>
          tx.emailNotification.create({
            data: {
              userId: session.user.id!,
              email,
              type: 'HOST_BROADCAST',
              subject,
              content: text,
              htmlContent: html,
              relatedId: party.id,
              status: 'pending',
              scheduledAt: now
            } as any,
            select: {
              id: true,
              email: true
            }
          })
        )
      )

      if (extraBroadcastNeeded && paymentId) {
        await tx.emailNotification.create({
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

      return createdNotifications
    })

    after(async () => {
      await withBackgroundPrisma(async (backgroundPrisma) => {
        await Promise.allSettled(
          notifications.map(async (notification) => {
            try {
              await sendEmail({
                to: notification.email,
                subject,
                text,
                html
              })

              await backgroundPrisma.emailNotification.update({
                where: { id: notification.id },
                data: {
                  status: 'sent',
                  sentAt: new Date(),
                  error: null
                }
              })
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error)
              console.error(`Broadcast email failed for ${notification.email}:`, error)

              await backgroundPrisma.emailNotification.update({
                where: { id: notification.id },
                data: {
                  status: 'failed',
                  error: errorMessage,
                  attempts: {
                    increment: 1
                  }
                }
              })
            }
          })
        )
      })
    })

    return NextResponse.json({
      message: `Broadcast queued for ${recipients.length} guests`,
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
