import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js'

export interface PaymentConfig {
  publishableKey: string
  appearance?: {
    theme: 'stripe' | 'night' | 'flat'
    variables?: {
      colorPrimary?: string
      colorBackground?: string
      colorText?: string
    }
  }
}

export interface PaymentIntentRequest {
  amount: number
  currency: string
  description?: string
  metadata?: Record<string, string>
}

export interface PaymentIntentResponse {
  client_secret: string
  id: string
  amount: number
  currency: string
  status: string
}

export async function createPaymentIntent(
  data: PaymentIntentRequest
): Promise<PaymentIntentResponse> {
  const response = await fetch('/api/payment/create-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    let errorMessage = 'Failed to create payment intent'

    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage

      console.error('❌ Payment intent creation failed:', errorData)

      // Create a more detailed error
      const error = new Error(errorMessage) as any
      error.details = errorData.details
      error.code = errorData.code
      error.stripeError = errorData.stripeError
      error.statusCode = response.status
      throw error
    } catch (parseError) {
      // If we can't parse the error (parseError will be thrown),
      // check if it's our custom error or a parsing error
      if (parseError instanceof Error && (parseError as any).details !== undefined) {
        // It's our custom error, re-throw it
        throw parseError
      }
      // It's a parsing error, throw a generic error
      throw new Error(errorMessage)
    }
  }

  return response.json()
}

export async function initializeStripe(config: PaymentConfig): Promise<Stripe | null> {
  if (typeof window === 'undefined') {
    throw new Error('Stripe can only be initialized on the client side')
  }

  console.log('🔧 Initializing Stripe with config:', {
    hasPublishableKey: !!config.publishableKey,
    keyPrefix: config.publishableKey?.substring(0, 10),
    keyLength: config.publishableKey?.length,
  })

  if (!config.publishableKey) {
    throw new Error('Publishable key is missing. Check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env')
  }

  if (!config.publishableKey.startsWith('pk_')) {
    throw new Error(`Invalid publishable key format. Expected to start with 'pk_', got: ${config.publishableKey.substring(0, 10)}...`)
  }

  try {
    console.log('📦 Loading Stripe SDK...')
    const stripe = await loadStripe(config.publishableKey)
    
    if (!stripe) {
      throw new Error('Failed to load Stripe SDK')
    }

    console.log('✅ Stripe SDK loaded successfully')
    return stripe
  } catch (error: any) {
    console.error('❌ Failed to load Stripe SDK')
    console.error('📄 Error details:', {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      full: error,
    })

    if (error instanceof Error) {
      throw new Error(`Failed to initialize Stripe: ${error.message}`)
    }

    throw error
  }
}

export const defaultPaymentConfig: PaymentConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#3B82F6',
      colorBackground: '#FFFFFF',
      colorText: '#1F2937',
    },
  },
}

export type PaymentStatus = 
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'canceled'
