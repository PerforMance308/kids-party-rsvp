import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { isValidUUID } from '@/lib/security'
import { schedulePhotoSharingNotifications } from '@/lib/notification-scheduler'

export async function POST(
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

    // Verify party exists and user owns it
    const party = await prisma.party.findUnique({
      where: { id: partyId }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    if (party.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if photo sharing is already purchased
    if (party.photoSharingPaid) {
      return NextResponse.json({ 
        error: 'Photo sharing is already enabled for this party' 
      }, { status: 400 })
    }

    // Simulate payment processing (in real app, integrate with Stripe/PayPal)
    // For now, just enable the feature
    const updatedParty = await prisma.party.update({
      where: { id: partyId },
      data: {
        photoSharingPaid: true,
        allowPhotoSharing: true
      }
    })

    // Schedule photo sharing notifications for after the party
    try {
      await schedulePhotoSharingNotifications(partyId)
      console.log(`📧 Photo sharing notifications scheduled for party ${partyId}`)
    } catch (error) {
      console.error('Failed to schedule photo sharing notifications:', error)
      // Don't fail the purchase if notification scheduling fails
    }

    return NextResponse.json({
      message: 'Photo sharing enabled successfully!',
      photoSharingPaid: updatedParty.photoSharingPaid,
      allowPhotoSharing: updatedParty.allowPhotoSharing
    })
  } catch (error) {
    console.error('Enable photo sharing error:', error)
    return NextResponse.json(
      { error: 'Failed to enable photo sharing' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Verify party exists and user owns it
    const party = await prisma.party.findUnique({
      where: { id: partyId }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    if (party.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Disable photo sharing (this won't delete existing photos)
    const updatedParty = await prisma.party.update({
      where: { id: partyId },
      data: {
        allowPhotoSharing: false
      }
    })

    return NextResponse.json({
      message: 'Photo sharing disabled',
      allowPhotoSharing: updatedParty.allowPhotoSharing
    })
  } catch (error) {
    console.error('Disable photo sharing error:', error)
    return NextResponse.json(
      { error: 'Failed to disable photo sharing' },
      { status: 500 }
    )
  }
}