import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { schedulePhotoSharingNotifications } from '@/lib/notification-scheduler'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify party ownership
    const party = await prisma.party.findUnique({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found or access denied' }, { status: 404 })
    }

    // Check if already enabled
    if (party.photoSharingPaid) {
      return NextResponse.json({ error: 'Photo sharing is already enabled' }, { status: 400 })
    }

    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Verify payment with Hyperswitch (optional - for extra security)
    // You could add payment verification here if needed

    // Update party to enable photo sharing
    const updatedParty = await prisma.party.update({
      where: { id },
      data: {
        allowPhotoSharing: true,
        photoSharingPaid: true,
        photoSharingPaymentId: paymentId,
        photoSharingEnabledAt: new Date(),
      }
    })

    // Schedule photo sharing notifications for after the party
    try {
      await schedulePhotoSharingNotifications(id)
    } catch (notificationError) {
      console.error('Failed to schedule photo sharing notifications:', notificationError)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      message: 'Photo sharing enabled successfully',
      party: {
        id: updatedParty.id,
        allowPhotoSharing: updatedParty.allowPhotoSharing,
        photoSharingPaid: updatedParty.photoSharingPaid,
      }
    })

  } catch (error) {
    console.error('Enable photo sharing error:', error)
    return NextResponse.json(
      { error: 'Failed to enable photo sharing' },
      { status: 500 }
    )
  }
}