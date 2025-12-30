import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { partySchema } from '@/lib/validations'
import { sendPartyUpdateEmail } from '@/lib/email'

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
        id: id,
        userId: session.user.id
      },
      include: {
        guests: {
          include: {
            rsvp: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    const rsvps = party.guests.map(g => g.rsvp).filter(Boolean)
    const stats = {
      total: party.guests.length,
      attending: rsvps.filter(r => r?.status === 'YES').length,
      notAttending: rsvps.filter(r => r?.status === 'NO').length,
      maybe: rsvps.filter(r => r?.status === 'MAYBE').length,
    }

    const partyWithStats = {
      ...party,
      stats,
      rsvpUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/rsvp/${party.publicRsvpToken}`
    }

    return NextResponse.json(partyWithStats)
  } catch (error) {
    console.error('Fetch party error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the existing party with guest emails for notifications
    const existingParty = await prisma.party.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        guests: {
          include: {
            rsvp: true
          }
        }
      }
    })

    if (!existingParty) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = partySchema.parse({
      ...body,
      eventDatetime: new Date(body.eventDatetime)
    })

    // Check if any important details changed (date, time, location)
    const importantChanges = {
      date: existingParty.eventDatetime.getTime() !== validatedData.eventDatetime.getTime(),
      location: existingParty.location !== validatedData.location,
      childName: existingParty.childName !== validatedData.childName,
      childAge: existingParty.childAge !== validatedData.childAge
    }

    const hasImportantChanges = Object.values(importantChanges).some(Boolean)

    // Update the party
    const updatedParty = await prisma.party.update({
      where: { id: id },
      data: {
        childName: validatedData.childName,
        childAge: validatedData.childAge,
        eventDatetime: validatedData.eventDatetime,
        location: validatedData.location,
        theme: validatedData.theme || null,
        notes: validatedData.notes || null,
      },
      include: {
        guests: {
          include: {
            rsvp: true
          }
        }
      }
    })

    // Send notification emails to guests who have RSVP'd "YES" or "MAYBE"
    if (hasImportantChanges) {
      const notifiableGuests = existingParty.guests.filter(guest =>
        guest.rsvp && ['YES', 'MAYBE'].includes(guest.rsvp.status)
      )

      for (const guest of notifiableGuests) {
        if (guest.email) {
          try {
            await sendPartyUpdateEmail(
              guest.email,
              guest.parentName || 'Guest',
              updatedParty,
              importantChanges
            )
          } catch (error) {
            console.error(`Failed to send update email to ${guest.email}:`, error)
          }
        }
      }
    }

    const rsvps = updatedParty.guests.map(g => g.rsvp).filter(Boolean)
    const stats = {
      total: updatedParty.guests.length,
      attending: rsvps.filter(r => r?.status === 'YES').length,
      notAttending: rsvps.filter(r => r?.status === 'NO').length,
      maybe: rsvps.filter(r => r?.status === 'MAYBE').length,
    }

    const partyWithStats = {
      ...updatedParty,
      stats,
      rsvpUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/rsvp/${updatedParty.publicRsvpToken}`
    }

    return NextResponse.json(partyWithStats)
  } catch (error) {
    console.error('Update party error:', error)

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the party with guests for cleanup
    const party = await prisma.party.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        guests: {
          include: {
            rsvp: true
          }
        }
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Delete all related data in correct order (due to foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete RSVPs first
      await tx.rSVP.deleteMany({
        where: {
          guest: {
            partyId: id
          }
        }
      })

      // Delete guests
      await tx.guest.deleteMany({
        where: { partyId: id }
      })



      // Finally delete the party
      await tx.party.delete({
        where: { id: id }
      })
    })

    return NextResponse.json({ message: 'Party deleted successfully' })
  } catch (error) {
    console.error('Delete party error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}