import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { isValidUUID } from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Validate token format
    if (!isValidUUID(token)) {
      return NextResponse.json({ error: 'Invalid invitation link' }, { status: 400 })
    }

    // Verify user authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = (session.user.email || '').toString()

    const party = await prisma.party.findUnique({
      where: { publicRsvpToken: token },
      include: {
        child: true,
        user: true
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Check if user has RSVPed to this party
    const myGuest = await prisma.guest.findFirst({
      where: {
        partyId: party.id,
        email: userEmail
      },
      include: {
        rsvp: true
      }
    })

    // If no RSVP found, redirect to RSVP page
    if (!myGuest || !myGuest.rsvp) {
      return NextResponse.json(
        { error: 'Please RSVP first' },
        { status: 401 }
      )
    }

    // If user declined the invitation, they cannot access the party page
    if (myGuest.rsvp.status === 'NO') {
      return NextResponse.json(
        { error: 'You have declined this invitation and cannot access the party page' },
        { status: 403 }
      )
    }

    // Calculate child age
    const today = new Date()
    const birthDate = new Date(party.child.birthDate)
    const calculatedAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

    const childAge = (party as any).targetAge ?? calculatedAge

    const partyData = {
      id: party.id,
      childName: party.child.name,
      childAge,
      eventDatetime: party.eventDatetime,
      location: party.location,
      theme: party.theme,
      notes: party.notes,
      allowPhotoSharing: party.allowPhotoSharing,
      photoSharingPaid: party.photoSharingPaid,
      guestCanSeeOthers: party.guestCanSeeOthers
    }

    // Get other guests (if enabled)
    let guests: any[] = []
    if (party.guestCanSeeOthers) {
      guests = await prisma.guest.findMany({
        where: {
          partyId: party.id,
          rsvp: {
            isNot: null
          }
        },
        include: {
          rsvp: true
        },
        orderBy: {
          parentName: 'asc'
        }
      })
    }

    // Get photos (if photo sharing is enabled and paid for)
    let photos: any[] = []
    if (party.allowPhotoSharing && party.photoSharingPaid) {
      photos = await prisma.photo.findMany({
        where: {
          partyId: party.id
        },
        orderBy: {
          uploadedAt: 'desc'
        },
        select: {
          id: true,
          filename: true,
          originalName: true,
          caption: true,
          uploaderName: true,
          uploadedAt: true
        }
      })
    }

    return NextResponse.json({
      party: {
        id: party.id,
        childName: party.child.name,
        childAge,
        eventDatetime: party.eventDatetime,
        location: party.location,
        theme: party.theme,
        notes: party.notes,
        allowPhotoSharing: party.allowPhotoSharing,
        photoSharingPaid: party.photoSharingPaid,
        guestCanSeeOthers: party.guestCanSeeOthers
      },
      myRSVP: myGuest.rsvp,
      guests: guests.map(guest => ({
        id: guest.id,
        parentName: guest.parentName,
        childName: guest.childName,
        email: guest.email,
        phone: guest.phone,
        rsvp: guest.rsvp
      })),
      photos
    })
  } catch (error) {
    console.error('Get guest party data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}