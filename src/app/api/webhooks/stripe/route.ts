import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('🎉 Payment succeeded:', paymentIntent.id)
    
    // Extract metadata
    const { partyId, feature, templateId } = paymentIntent.metadata || {}
    
    if (feature === 'photo_sharing' && partyId) {
      // Enable photo sharing for the party
      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: {
          allowPhotoSharing: true,
          photoSharingPaid: true,
          photoSharingPaymentId: paymentIntent.id,
          photoSharingEnabledAt: new Date(),
        }
      })
      
      console.log('📷 Photo sharing enabled for party:', partyId)
      
      // Schedule photo sharing notifications
      try {
        const { schedulePhotoSharingNotifications } = await import('@/lib/notification-scheduler')
        await schedulePhotoSharingNotifications(partyId)
        console.log('📧 Photo sharing notifications scheduled')
      } catch (error) {
        console.error('Failed to schedule notifications:', error)
      }
    } else if (feature === 'template' && partyId && templateId) {
      // Enable template for the party
      const party = await prisma.party.findUnique({
        where: { id: partyId },
        select: { paidTemplates: true }
      })

      if (party) {
        const paidTemplates = (party.paidTemplates || []) as string[]
        if (!paidTemplates.includes(templateId)) {
          await prisma.party.update({
            where: { id: partyId },
            data: {
              template: templateId,
              paidTemplates: { push: templateId }
            }
          })
          console.log('🎨 Template enabled for party:', partyId, 'Template:', templateId)
        }
      }
    }
    
    // Log successful payment
    const amount = paymentIntent.amount / 100
    console.log(`✅ Payment processed: ${paymentIntent.id} - ${paymentIntent.currency.toUpperCase()} ${amount}`)
    
  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('❌ Payment failed:', paymentIntent.id)
    
    // Log failed payment for analysis
    const amount = paymentIntent.amount / 100
    console.log(`💸 Payment failed: ${paymentIntent.id} - ${paymentIntent.currency.toUpperCase()} ${amount}`)
    
    // You could implement retry logic, notification to user, etc.
    
  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
  })
  try {
    // Get request body and signature
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')
    
    if (!signature) {
      console.error('❌ Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET is not set')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }
    
    console.log('📨 Webhook received:', {
      hasBody: !!body,
      hasSignature: !!signature,
      bodyLength: body.length
    })
    
    let event: Stripe.Event
    
    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }
    
    console.log('🔄 Processing webhook event:', {
      type: event.type,
      id: event.id
    })
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'payment_intent.processing':
        console.log('⏳ Payment processing:', (event.data.object as Stripe.PaymentIntent).id)
        break
        
      case 'payment_intent.canceled':
        console.log('🚫 Payment cancelled:', (event.data.object as Stripe.PaymentIntent).id)
        break
        
      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }
    
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('💥 Webhook processing error:', error)
    
    // Return 500 to trigger retry from Stripe
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'stripe-webhooks'
  })
}