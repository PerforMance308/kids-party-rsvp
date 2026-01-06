import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { isValidUUID } from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partyId } = await params

    // Validate party ID format
    if (!isValidUUID(partyId)) {
      return NextResponse.json({ error: 'Invalid party ID' }, { status: 400 })
    }

    // Verify user authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.user.id

    // Verify party exists and user has access
    const party = await prisma.party.findUnique({
      where: { id: partyId }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Check if user is host or has RSVPed
    const isHost = party.userId === userId
    let hasAccess = isHost

    if (!isHost) {
      const hasRSVP = await prisma.guest.findFirst({
        where: {
          partyId: partyId,
          userId: userId,
          rsvp: {
            isNot: null
          }
        }
      })
      hasAccess = !!hasRSVP
    }

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Access denied' 
      }, { status: 403 })
    }

    // Check if photo sharing is enabled
    if (!party.allowPhotoSharing || !party.photoSharingPaid) {
      return NextResponse.json({ 
        error: 'Photo sharing is not enabled for this party' 
      }, { status: 403 })
    }

    // Get photos for this party
    const photos = await prisma.photo.findMany({
      where: {
        partyId: partyId
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

    return NextResponse.json({ photos })
  } catch (error) {
    console.error('Get party photos error:', error)
    return NextResponse.json(
      { error: 'Failed to get photos' },
      { status: 500 }
    )
  }
}