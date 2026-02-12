import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { schedulePhotoSharingNotifications } from '@/lib/notification-scheduler'
import Stripe from 'stripe'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
  })
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

    // Verify payment with Stripe API
    console.log('🔍 Verifying payment:', paymentId)

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId)

      console.log('📄 Payment data:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      })

      // Check if payment actually succeeded
      if (paymentIntent.status !== 'succeeded') {
        console.error('❌ Payment not succeeded:', paymentIntent.status)
        return NextResponse.json(
          {
            error: 'Payment has not been completed',
            status: paymentIntent.status
          },
          { status: 400 }
        )
      }

      // Verify amount is correct ($2.99 = 299 cents)
      const expectedAmount = 299 // $2.99 in cents
      if (paymentIntent.amount !== expectedAmount) {
        console.error('❌ Payment amount mismatch:', {
          expected: expectedAmount,
          received: paymentIntent.amount,
        })
        return NextResponse.json(
          { error: 'Payment amount verification failed' },
          { status: 400 }
        )
      }

      console.log('✅ Payment verified successfully')

    } catch (verificationError) {
      console.error('💥 Payment verification error:', verificationError)
      
      if (verificationError instanceof Stripe.errors.StripeError) {
        return NextResponse.json(
          { error: 'Payment verification failed', details: verificationError.message },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to verify payment' },
        { status: 500 }
      )
    }

    // Record payment in database (in case webhook doesn't fire)
    try {
      const existingPayment = await prisma.payment.findUnique({
        where: { stripePaymentId: paymentId }
      })
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            userId: session.user.id,
            partyId: id,
            stripePaymentId: paymentId,
            feature: 'photo_sharing',
            amount: 299, // $2.99 in cents
            currency: 'usd',
            status: 'succeeded',
            metadata: JSON.stringify({}),
          },
        })
        console.log('💾 Payment recorded in database')
      }
    } catch (paymentRecordError) {
      console.error('Failed to record payment (may already exist):', paymentRecordError)
    }

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