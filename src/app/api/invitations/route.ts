import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

// Get user's invitations (parties where they are invited as guests)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all guests records for the current user's email
    const invitations = await prisma.guest.findMany({
      where: {
        OR: [
          { userId: session.user.id }, // Direct user linkage
          { email: session.user.email } // Email-based matching for older entries
        ]
      },
      include: {
        party: {
          include: {
            child: true, // Include child information
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        rsvp: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to include calculated child age and clean structure
    const transformedInvitations = invitations.map(guest => {
      const today = new Date()
      const birthDate = new Date(guest.party.child.birthDate)
      const childAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

      return {
        id: guest.id,
        partyId: guest.partyId,
        parentName: guest.parentName,
        childName: guest.childName,
        email: guest.email,
        phone: guest.phone,
        createdAt: guest.createdAt,
        party: {
          id: guest.party.id,
          childName: guest.party.child.name,
          childAge,
          eventDatetime: guest.party.eventDatetime,
          location: guest.party.location,
          theme: guest.party.theme,
          notes: guest.party.notes,
          publicRsvpToken: guest.party.publicRsvpToken,
          user: guest.party.user
        },
        rsvp: guest.rsvp
      }
    })

    return NextResponse.json(transformedInvitations)
  } catch (error) {
    console.error('Fetch invitations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}