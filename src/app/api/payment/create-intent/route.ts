import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

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

    // Validate and normalize currency code
    if (typeof currency !== 'string') {
      return NextResponse.json({
        error: 'Currency must be a string'
      }, { status: 400 })
    }

    // Ensure currency is uppercase (ISO 4217 standard)
    const normalizedCurrency = String(currency).trim().toUpperCase()
    
    // Validate currency code format (should be 3 uppercase letters)
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      return NextResponse.json({
        error: `Invalid currency code format: ${currency}. Must be 3 uppercase letters (e.g., USD, EUR, CNY)`
      }, { status: 400 })
    }

    console.log('💰 Currency validation:', {
      original: currency,
      normalized: normalizedCurrency,
      type: typeof currency
    })

    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is not set')
      return NextResponse.json({
        error: 'Payment service configuration error: Missing Stripe secret key'
      }, { status: 500 })
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: normalizedCurrency,
      description: description || 'Kid Party RSVP Payment',
      metadata: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
    })

    console.log('✅ Payment intent created successfully')
    console.log('📊 Payment intent ID:', paymentIntent.id)

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert back to dollars
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    })

  } catch (error) {
    console.error('❌ Payment intent creation error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        error: 'Failed to create payment intent',
        details: error.message,
        code: error.code,
        stripeError: error.type
      }, { status: 500 })
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
