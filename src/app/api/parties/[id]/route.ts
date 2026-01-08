import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { partySchema, legacyPartySchema } from '@/lib/validations'
import { sendPartyUpdateEmail } from '@/lib/email'
import { getBaseUrl } from '@/lib/utils'

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
        child: true,
        guests: {
          include: {
            rsvp: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            guests: true
          }
        }
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    const rsvpStats = await prisma.rSVP.groupBy({
      by: ['status'],
      where: {
        guest: {
          partyId: id
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

    // Calculate child age
    const today = new Date()
    const birthDate = new Date(party.child.birthDate)
    const childAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

    const partyWithStats = {
      ...party,
      childName: party.child.name,
      childAge,
      stats,
      rsvpUrl: `${getBaseUrl()}/rsvp/${party.publicRsvpToken}`
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
        child: true,
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
    
    // For party updates, we only allow updating basic party details, not child info
    // Child info should be updated through the child management system
    const validatedData = {
      eventDatetime: new Date(body.eventDatetime),
      location: body.location,
      theme: body.theme || null,
      notes: body.notes || null,
      template: body.template || 'free',
    }

    // Check if any important details changed (date, time, location)
    const importantChanges = {
      date: existingParty.eventDatetime.getTime() !== validatedData.eventDatetime.getTime(),
      location: existingParty.location !== validatedData.location,
    }

    const hasImportantChanges = Object.values(importantChanges).some(Boolean)

    // Update the party
    const updatedParty = await prisma.party.update({
      where: { id: id },
      data: {
        eventDatetime: validatedData.eventDatetime,
        location: validatedData.location,
        theme: validatedData.theme,
        notes: validatedData.notes,
        template: validatedData.template,
      },
      include: {
        child: true,
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

    // Calculate child age
    const today = new Date()
    const birthDate = new Date(updatedParty.child.birthDate)
    const childAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

    const partyWithStats = {
      ...updatedParty,
      childName: updatedParty.child.name,
      childAge,
      stats,
      rsvpUrl: `${getBaseUrl()}/rsvp/${updatedParty.publicRsvpToken}`
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