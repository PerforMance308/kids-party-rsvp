import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { partySchema, legacyPartySchema } from '@/lib/validations'
import { createReminderSchedule } from '@/lib/scheduler'
import { calculateAge } from '@/lib/utils'
import { getTemplateConfig, getEffectivePrice } from '@/lib/template-utils'
import Stripe from 'stripe'

interface SelectedGuestInput {
  childName?: string
  email?: string
  phone?: string
}

function normalizeSelectedGuests(input: unknown): Array<{ childName: string; email: string; phone: string | null }> {
  if (!Array.isArray(input)) return []

  const emailSeen = new Set<string>()
  const guests: Array<{ childName: string; email: string; phone: string | null }> = []

  for (const raw of input as SelectedGuestInput[]) {
    const email = (raw?.email || '').trim().toLowerCase()
    if (!email || emailSeen.has(email)) continue

    const childName = (raw?.childName || '').trim()
    if (!childName) continue

    guests.push({
      childName,
      email,
      phone: raw?.phone?.trim() || null,
    })
    emailSeen.add(email)
  }

  return guests
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate and resolve template
    const templateId: string = body.templateId
    if (!templateId) {
      return NextResponse.json({ error: 'Template selection is required' }, { status: 400 })
    }

    const templateConfig = getTemplateConfig(templateId)
    if (!templateConfig) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const effectivePrice = getEffectivePrice(templateConfig.pricing)

    // For paid templates, verify payment
    let verifiedAmount = 0
    let verifiedCurrency = 'usd'
    const isPaid = !effectivePrice.isFree

    if (isPaid) {
      const { paymentId } = body
      if (!paymentId) {
        return NextResponse.json(
          { error: 'Payment ID is required for premium templates' },
          { status: 400 }
        )
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-02-24.acacia',
      })

      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId)

        if (paymentIntent.status !== 'succeeded') {
          return NextResponse.json(
            { error: 'Payment has not been completed', status: paymentIntent.status },
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
          paymentIntent.metadata?.feature !== 'template' ||
          paymentIntent.metadata?.templateId !== templateId ||
          paymentIntent.metadata?.userId !== session.user.id
        ) {
          return NextResponse.json(
            { error: 'Payment metadata verification failed' },
            { status: 400 }
          )
        }

        verifiedAmount = paymentIntent.amount
        verifiedCurrency = paymentIntent.currency
      } catch (verificationError) {
        console.error('Payment verification error:', verificationError)

        if (verificationError instanceof Stripe.errors.StripeError) {
          return NextResponse.json(
            { error: 'Payment verification failed', details: verificationError.message },
            { status: 400 }
          )
        }

        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
      }
    }

    let party
    const selectedGuests = normalizeSelectedGuests(body.selectedGuests)

    // Try new schema first (with childId)
    if (body.childId) {
      const validatedData = partySchema.parse({
        ...body,
        eventDatetime: new Date(body.eventDatetime)
      })

      // Verify the child belongs to the current user
      const child = await prisma.child.findFirst({
        where: {
          id: validatedData.childId,
          userId: session.user.id
        }
      })

      if (!child) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 })
      }

      // 计算默认结束时间（开始时间+2小时）
      const eventEndDatetime = body.eventEndDatetime
        ? new Date(body.eventEndDatetime)
        : new Date(validatedData.eventDatetime.getTime() + 2 * 60 * 60 * 1000)

      party = await prisma.party.create({
        data: {
          userId: session.user.id,
          childId: validatedData.childId,
          eventDatetime: validatedData.eventDatetime,
          eventEndDatetime,
          location: validatedData.location,
          locationFull: validatedData.locationFull || validatedData.location,
          theme: validatedData.theme || null,
          notes: validatedData.notes || null,
          targetAge: validatedData.targetAge || null,
          childGender: body.childGender || null,
          template: templateId,
          ...(isPaid ? { paidTemplates: [templateId] } : {}),
        },
        include: {
          child: true
        }
      })
    } else {
      // Fallback to legacy schema (for backward compatibility)
      const validatedData = legacyPartySchema.parse({
        ...body,
        eventDatetime: new Date(body.eventDatetime)
      })

      // First, create a child entry for this party
      const child = await prisma.child.create({
        data: {
          userId: session.user.id,
          name: validatedData.childName,
          birthDate: new Date(new Date().getFullYear() - validatedData.childAge, 0, 1), // Approximate birth date
          notes: `Auto-created from party: ${validatedData.location}`
        }
      })

      // 计算默认结束时间（开始时间+2小时）
      const legacyEventEndDatetime = body.eventEndDatetime
        ? new Date(body.eventEndDatetime)
        : new Date(validatedData.eventDatetime.getTime() + 2 * 60 * 60 * 1000)

      party = await prisma.party.create({
        data: {
          userId: session.user.id,
          childId: child.id,
          eventDatetime: validatedData.eventDatetime,
          eventEndDatetime: legacyEventEndDatetime,
          location: validatedData.location,
          locationFull: validatedData.locationFull || validatedData.location,
          theme: validatedData.theme || null,
          notes: validatedData.notes || null,
          targetAge: validatedData.targetAge || null,
          childGender: body.childGender || null,
          template: templateId,
          ...(isPaid ? { paidTemplates: [templateId] } : {}),
        },
        include: {
          child: true
        }
      })
    }

    // Record payment in database after party creation (partyId is now available)
    if (isPaid && body.paymentId) {
      try {
        const existingPayment = await prisma.payment.findUnique({
          where: { stripePaymentId: body.paymentId }
        })
        if (!existingPayment) {
          await prisma.payment.create({
            data: {
              userId: session.user.id,
              partyId: party.id,
              stripePaymentId: body.paymentId,
              feature: 'template',
              amount: verifiedAmount,
              currency: verifiedCurrency,
              status: 'succeeded',
              metadata: JSON.stringify({ templateId }),
            },
          })
        }
      } catch (paymentRecordError) {
        console.error('Failed to record payment (may already exist):', paymentRecordError)
      }
    }

    // Sync host phone to user profile if provided
    const hostPhone: string | undefined = typeof body.hostPhone === 'string' ? body.hostPhone.trim() : undefined
    if (hostPhone) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone: hostPhone }
      })
    }

    // Create reminder schedule in the background (Non-blocking)
    after(async () => {
      try {
        if (selectedGuests.length > 0) {
          await prisma.guest.createMany({
            data: selectedGuests.map((guest) => ({
              partyId: party.id,
              childName: guest.childName,
              email: guest.email,
              phone: guest.phone,
            })),
            skipDuplicates: true,
          })
        }
        await createReminderSchedule(party.id)
      } catch (error) {
        console.error('Failed to create reminder schedule in background:', error)
      }
    })

    return NextResponse.json(party, { status: 201 })
  } catch (error) {
    console.error('Party creation error:', error)

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parties = await prisma.party.findMany({
      where: { userId: session.user.id },
      include: {
        child: true,
        _count: {
          select: {
            guests: true
          }
        }
      },
      orderBy: { eventDatetime: 'asc' }
    })

    // Get all party IDs for batching RSVP stats
    const partyIds = parties.map(p => p.id)

    // Pre-calculate stats per party for O(1) lookup
    const statsMap: Record<string, { total: number; attending: number; notAttending: number; maybe: number }> = {}

    // Initialize statsMap
    partyIds.forEach(id => {
      const party = parties.find(p => p.id === id)
      statsMap[id] = {
        total: party?._count.guests || 0,
        attending: 0,
        notAttending: 0,
        maybe: 0
      }
    })

    // Process RSVP stats in memory to avoid N+1 queries
    // We fetch all relevant RSVPs for all parties in one go
    const rsvps = await prisma.rSVP.findMany({
      where: { guest: { partyId: { in: partyIds } } },
      select: { status: true, guest: { select: { partyId: true } } }
    })

    rsvps.forEach(rsvp => {
      const pId = rsvp.guest.partyId
      if (statsMap[pId]) {
        if (rsvp.status === 'YES') statsMap[pId].attending++
        else if (rsvp.status === 'NO') statsMap[pId].notAttending++
        else if (rsvp.status === 'MAYBE') statsMap[pId].maybe++
      }
    })

    const partiesWithStats = parties.map((party) => {
      const stats = statsMap[party.id]
      const childAge = party.targetAge ?? calculateAge(party.child.birthDate)

      return {
        id: party.id,
        childName: party.child.name,
        childAge,
        childGender: party.childGender,
        eventDatetime: party.eventDatetime,
        eventEndDatetime: party.eventEndDatetime,
        location: party.location,
        locationFull: party.locationFull,
        theme: party.theme,
        notes: party.notes,
        targetAge: party.targetAge,
        template: party.template,
        templatePaid: party.paidTemplates.includes(party.template),
        publicRsvpToken: party.publicRsvpToken,
        stats
      }
    })

    return NextResponse.json(partiesWithStats)
  } catch (error) {
    console.error('Fetch parties error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
