import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import Stripe from 'stripe'
import { getTemplateConfig, getEffectivePrice } from '@/lib/template-utils'


export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
  })
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { amount, currency, description, metadata } = await request.json()

    // Determine the actual charge amount
    let chargeAmount: number
    let chargeDescription = description || 'Kid Party RSVP Payment'
    const isTemplatePayment = metadata?.feature === 'template' && metadata?.templateId

    if (isTemplatePayment) {
      // Server-side price computation for template payments (prevents price tampering)
      const templateConfig = getTemplateConfig(metadata.templateId)
      if (!templateConfig) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      const effectivePrice = getEffectivePrice(templateConfig.pricing)
      if (effectivePrice.isFree) {
        return NextResponse.json(
          { error: 'This template is free, no payment needed' },
          { status: 400 }
        )
      }

      chargeAmount = effectivePrice.price
      chargeDescription = description || `Template: ${metadata.templateId}`
    } else {
      // Non-template payments (e.g., photo-sharing) use front-end amount
      if (!amount || !currency) {
        return NextResponse.json({
          error: 'Amount and currency are required'
        }, { status: 400 })
      }
      chargeAmount = amount
    }

    // Validate and normalize currency code
    const rawCurrency = currency || 'USD'
    if (typeof rawCurrency !== 'string') {
      return NextResponse.json({
        error: 'Currency must be a string'
      }, { status: 400 })
    }

    // Ensure currency is uppercase (ISO 4217 standard)
    const normalizedCurrency = String(rawCurrency).trim().toUpperCase()

    // Validate currency code format (should be 3 uppercase letters)
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      return NextResponse.json({
        error: `Invalid currency code format: ${rawCurrency}. Must be 3 uppercase letters (e.g., USD, EUR, CNY)`
      }, { status: 400 })
    }

    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set')
      return NextResponse.json({
        error: 'Payment service configuration error: Missing Stripe secret key'
      }, { status: 500 })
    }

    // Build metadata with userId always set server-side
    const intentMetadata: Record<string, string> = {
      userId: session.user.id,
      userEmail: session.user.email || '',
    }
    if (metadata?.feature) intentMetadata.feature = metadata.feature
    if (metadata?.templateId) intentMetadata.templateId = metadata.templateId
    if (metadata?.flow) intentMetadata.flow = metadata.flow
    if (metadata?.partyId) intentMetadata.partyId = metadata.partyId

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(chargeAmount * 100), // Convert to cents
      currency: normalizedCurrency,
      description: chargeDescription,
      metadata: intentMetadata,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
    })

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert back to dollars
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    })

  } catch (error) {
    console.error('Payment intent creation error:', error)

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
