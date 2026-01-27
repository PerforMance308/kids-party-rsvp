import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { partySchema, legacyPartySchema } from '@/lib/validations'
import { createReminderSchedule } from '@/lib/scheduler'
import { calculateAge } from '@/lib/utils'

// Get default template based on child gender
function getDefaultTemplate(childGender?: string | null): string {
  if (childGender === 'boy') {
    return 'dinosaur/dinosaur_1'
  } else if (childGender === 'girl') {
    return 'unicorn/unicorn_1'
  }
  return 'dinosaur/dinosaur_1' // Default fallback
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Determine default template based on gender
    const defaultTemplate = getDefaultTemplate(body.childGender)

    let party

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
          theme: validatedData.theme || null,
          notes: validatedData.notes || null,
          targetAge: validatedData.targetAge || null,
          childGender: body.childGender || null,
          template: defaultTemplate,
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
          theme: validatedData.theme || null,
          notes: validatedData.notes || null,
          targetAge: validatedData.targetAge || null,
          childGender: body.childGender || null,
          template: defaultTemplate,
        },
        include: {
          child: true
        }
      })
    }

    // Create reminder schedule
    try {
      await createReminderSchedule(party.id)
    } catch (error) {
      console.error('Failed to create reminder schedule:', error)
    }

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

    const partiesWithStats = await Promise.all(parties.map(async (party) => {
      const rsvpStats = await prisma.rSVP.groupBy({
        by: ['status'],
        where: {
          guest: {
            partyId: party.id
          }
        },
        _count: {
          status: true
        }
      })

      const stats = {
        total: party._count.guests,
        attending: rsvpStats.find(s => s.status === 'YES')?._count.status || 0,
        notAttending: rsvpStats.find(s => s.status === 'NO')?._count.status || 0,
        maybe: rsvpStats.find(s => s.status === 'MAYBE')?._count.status || 0,
      }

      const childAge = party.targetAge ?? calculateAge(party.child.birthDate)

      return {
        id: party.id,
        childName: party.child.name,
        childAge,
        childGender: party.childGender,
        eventDatetime: party.eventDatetime,
        eventEndDatetime: party.eventEndDatetime,
        location: party.location,
        theme: party.theme,
        notes: party.notes,
        targetAge: party.targetAge,
        template: party.template,
        templatePaid: party.paidTemplates.includes(party.template),
        publicRsvpToken: party.publicRsvpToken,
        stats
      }
    }))

    return NextResponse.json(partiesWithStats)
  } catch (error) {
    console.error('Fetch parties error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}