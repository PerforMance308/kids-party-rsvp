import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { amount, currency, description, metadata } = await request.json()

    if (!amount || !currency) {
      return NextResponse.json({ 
        error: 'Amount and currency are required' 
      }, { status: 400 })
    }

    // Create payment intent with Hyperswitch API
    const hyperswitchResponse = await fetch(`${process.env.HYPERSWITCH_SERVER_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HYPERSWITCH_SECRET_KEY}`,
        'api-key': process.env.HYPERSWITCH_SECRET_KEY || '',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        description: description || 'Kid Party RSVP Payment',
        metadata: {
          userId: session.user.id,
          userEmail: session.user.email,
          ...metadata,
        },
        capture_method: 'automatic',
        payment_methods: ['card', 'wallet', 'paypal'],
      }),
    })

    if (!hyperswitchResponse.ok) {
      const error = await hyperswitchResponse.json()
      console.error('Hyperswitch API error:', error)
      return NextResponse.json({ 
        error: 'Failed to create payment intent' 
      }, { status: 500 })
    }

    const paymentIntent = await hyperswitchResponse.json()

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      id: paymentIntent.payment_id,
      amount: paymentIntent.amount / 100, // Convert back to dollars
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    })

  } catch (error) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}