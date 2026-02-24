import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { sendPartyUpdateEmail } from '@/lib/email'
import { getBaseUrl, calculateAge } from '@/lib/utils'

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

    const childAge = party.targetAge ?? calculateAge(party.child.birthDate)

    const partyWithStats = {
      ...party,
      childName: party.child.name,
      childAge,
      eventEndDatetime: party.eventEndDatetime,
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
    const eventDatetime = new Date(body.eventDatetime)
    // 如果没有提供结束时间，使用默认的开始时间+2小时
    const eventEndDatetime = body.eventEndDatetime
      ? new Date(body.eventEndDatetime)
      : new Date(eventDatetime.getTime() + 2 * 60 * 60 * 1000)

    const validatedData = {
      eventDatetime,
      eventEndDatetime,
      location: body.location,
      locationFull: body.locationFull || body.location,
      theme: body.theme || null,
      notes: body.notes || null,
      template: body.template !== undefined ? body.template : existingParty.template,
      targetAge: body.targetAge != null ? parseInt(body.targetAge) : null,
    }
    const existingLocationFull =
      ('locationFull' in existingParty ? (existingParty as { locationFull?: string | null }).locationFull : null)
      || existingParty.location

    const changes = {
      eventDatetime: existingParty.eventDatetime.getTime() !== validatedData.eventDatetime.getTime(),
      eventEndDatetime: (existingParty.eventEndDatetime?.getTime() ?? null) !== (validatedData.eventEndDatetime?.getTime() ?? null),
      location: existingParty.location !== validatedData.location,
      locationFull: existingLocationFull !== validatedData.locationFull,
      theme: existingParty.theme !== validatedData.theme,
      notes: existingParty.notes !== validatedData.notes,
      template: existingParty.template !== validatedData.template,
      targetAge: existingParty.targetAge !== validatedData.targetAge,
    }

    const hasAnyChanges = Object.values(changes).some(Boolean)

    // No-op save: avoid unnecessary DB update and skip notifications.
    if (!hasAnyChanges) {
      const rsvps = existingParty.guests.map(g => g.rsvp).filter(Boolean)
      const stats = {
        total: existingParty.guests.length,
        attending: rsvps.filter(r => r?.status === 'YES').length,
        notAttending: rsvps.filter(r => r?.status === 'NO').length,
        maybe: rsvps.filter(r => r?.status === 'MAYBE').length,
      }
      const childAge = existingParty.targetAge ?? calculateAge(existingParty.child.birthDate)

      return NextResponse.json({
        ...existingParty,
        childName: existingParty.child.name,
        childAge,
        eventEndDatetime: existingParty.eventEndDatetime,
        stats,
        rsvpUrl: `${getBaseUrl()}/rsvp/${existingParty.publicRsvpToken}`
      })
    }

    // Check if any important details changed (date/time/location)
    const importantChanges = {
      date: changes.eventDatetime || changes.eventEndDatetime,
      location: changes.location,
    }

    const hasImportantChanges = Object.values(importantChanges).some(Boolean)

    // Update the party
    const updatedParty = await prisma.party.update({
      where: { id: id },
      data: {
        eventDatetime: validatedData.eventDatetime,
        eventEndDatetime: validatedData.eventEndDatetime,
        location: validatedData.location,
        locationFull: validatedData.locationFull,
        theme: validatedData.theme,
        notes: validatedData.notes,
        template: validatedData.template,
        targetAge: validatedData.targetAge,
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
      const emailPartyData = {
        id: updatedParty.id,
        childName: updatedParty.child.name,
        childAge: updatedParty.targetAge ?? calculateAge(updatedParty.child.birthDate),
        eventDatetime: updatedParty.eventDatetime,
        location: updatedParty.location,
        theme: updatedParty.theme || undefined,
        notes: updatedParty.notes || undefined,
        publicRsvpToken: updatedParty.publicRsvpToken,
      }

      // Do not block the save response on SMTP latency.
      after(async () => {
        await Promise.allSettled(
          notifiableGuests
            .filter((guest) => Boolean(guest.email))
            .map((guest) =>
              sendPartyUpdateEmail(
                guest.email!,
                emailPartyData,
                importantChanges
              )
            )
        )
      })
    }

    const rsvps = updatedParty.guests.map(g => g.rsvp).filter(Boolean)
    const stats = {
      total: updatedParty.guests.length,
      attending: rsvps.filter(r => r?.status === 'YES').length,
      notAttending: rsvps.filter(r => r?.status === 'NO').length,
      maybe: rsvps.filter(r => r?.status === 'MAYBE').length,
    }

    const childAge = updatedParty.targetAge ?? calculateAge(updatedParty.child.birthDate)

    const partyWithStats = {
      ...updatedParty,
      childName: updatedParty.child.name,
      childAge,
      eventEndDatetime: updatedParty.eventEndDatetime,
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
