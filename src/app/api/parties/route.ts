import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { partySchema } from '@/lib/validations'
import { createReminderSchedule } from '@/lib/scheduler'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = partySchema.parse({
      ...body,
      eventDatetime: new Date(body.eventDatetime)
    })

    const party = await prisma.party.create({
      data: {
        userId: session.user.id,
        childName: validatedData.childName,
        childAge: validatedData.childAge,
        eventDatetime: validatedData.eventDatetime,
        location: validatedData.location,
        theme: validatedData.theme || null,
        notes: validatedData.notes || null,
      }
    })

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
        guests: {
          include: {
            rsvp: true
          }
        }
      },
      orderBy: { eventDatetime: 'asc' }
    })

    const partiesWithStats = parties.map(party => {
      const rsvps = party.guests.map(g => g.rsvp).filter(Boolean)
      const stats = {
        total: party.guests.length,
        attending: rsvps.filter(r => r?.status === 'YES').length,
        notAttending: rsvps.filter(r => r?.status === 'NO').length,
        maybe: rsvps.filter(r => r?.status === 'MAYBE').length,
      }
      
      return {
        id: party.id,
        childName: party.childName,
        childAge: party.childAge,
        eventDatetime: party.eventDatetime,
        location: party.location,
        theme: party.theme,
        notes: party.notes,
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