import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

interface HyperswitchWebhookEvent {
  type: string
  data: {
    payment_id: string
    amount: number
    currency: string
    status: string
    metadata?: Record<string, string>
    client_secret?: string
    created_at: string
  }
  created_at: string
}

async function handlePaymentSuccess(data: HyperswitchWebhookEvent['data']) {
  try {
    console.log('🎉 Payment succeeded:', data.payment_id)
    
    // Extract metadata
    const { partyId, feature } = data.metadata || {}
    
    if (feature === 'photo_sharing' && partyId) {
      // Enable photo sharing for the party
      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: {
          allowPhotoSharing: true,
          photoSharingPaid: true,
          photoSharingPaymentId: data.payment_id,
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
    }
    
    // Log successful payment
    console.log(`✅ Payment processed: ${data.payment_id} - ${data.currency} ${data.amount / 100}`)
    
  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailure(data: HyperswitchWebhookEvent['data']) {
  try {
    console.log('❌ Payment failed:', data.payment_id)
    
    // Log failed payment for analysis
    console.log(`💸 Payment failed: ${data.payment_id} - ${data.currency} ${data.amount / 100}`)
    
    // You could implement retry logic, notification to user, etc.
    
  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}

async function verifyWebhookSignature(
  body: string,
  signature: string | null
): Promise<boolean> {
  if (!signature || !process.env.HYPERSWITCH_WEBHOOK_SECRET) {
    console.error('Missing signature or webhook secret')
    return false
  }
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.HYPERSWITCH_WEBHOOK_SECRET)
      .update(body, 'utf8')
      .digest('hex')
    
    // Compare signatures securely
    const signatureBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false
    }
    
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get request body and headers
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('x-webhook-signature') || 
                     headersList.get('hyperswitch-signature')
    
    console.log('📨 Webhook received:', {
      hasBody: !!body,
      hasSignature: !!signature,
      bodyLength: body.length
    })
    
    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      const isValid = await verifyWebhookSignature(body, signature)
      if (!isValid) {
        console.error('❌ Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }
    
    // Parse the event
    let event: HyperswitchWebhookEvent
    try {
      event = JSON.parse(body)
    } catch (error) {
      console.error('❌ Invalid JSON in webhook body:', error)
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }
    
    console.log('🔄 Processing webhook event:', {
      type: event.type,
      paymentId: event.data.payment_id,
      status: event.data.status
    })
    
    // Handle different event types
    switch (event.type) {
      case 'payment_succeeded':
      case 'payment.succeeded':
        await handlePaymentSuccess(event.data)
        break
        
      case 'payment_failed':
      case 'payment.failed':
        await handlePaymentFailure(event.data)
        break
        
      case 'payment_processing':
      case 'payment.processing':
        console.log('⏳ Payment processing:', event.data.payment_id)
        break
        
      case 'payment_cancelled':
      case 'payment.cancelled':
        console.log('🚫 Payment cancelled:', event.data.payment_id)
        break
        
      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }
    
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('💥 Webhook processing error:', error)
    
    // Return 500 to trigger retry from Hyperswitch
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
    service: 'hyperswitch-webhooks'
  })
}