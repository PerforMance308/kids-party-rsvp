import { loadHyper } from '@juspay-tech/hyper-js'

export interface PaymentConfig {
  publishableKey: string
  clientSecret?: string
  appearance?: {
    theme: 'auto' | 'dark' | 'light' | 'night'
    variables: {
      colorPrimary: string
      colorBackground: string
      colorText: string
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
    throw new Error('Failed to create payment intent')
  }

  return response.json()
}

export function initializeHyperswitch(config: PaymentConfig) {
  if (typeof window === 'undefined') {
    throw new Error('Hyperswitch can only be initialized on the client side')
  }

  return loadHyper(config.publishableKey)
}

export const defaultPaymentConfig: PaymentConfig = {
  publishableKey: process.env.NEXT_PUBLIC_HYPERSWITCH_PUBLISHABLE_KEY || '',
  appearance: {
    theme: 'auto',
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