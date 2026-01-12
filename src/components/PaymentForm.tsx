'use client'

import { useEffect, useState } from 'react'
import { 
  initializeStripe, 
  createPaymentIntent, 
  defaultPaymentConfig,
  type PaymentIntentRequest,
} from '@/lib/stripe'
import { Stripe, StripeElements } from '@stripe/stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'

interface PaymentFormProps {
  amount: number
  currency?: string
  description?: string
  metadata?: Record<string, string>
  onSuccess?: (paymentId: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export default function PaymentForm({
  amount,
  currency = 'USD',
  description,
  metadata,
  onSuccess,
  onError,
  onCancel
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [elements, setElements] = useState<StripeElements | null>(null)
  const [clientSecret, setClientSecret] = useState('')

  // Initialize Stripe
  useEffect(() => {
    const initPayment = async () => {
      try {
        const stripeInstance = await initializeStripe(defaultPaymentConfig)
        setStripe(stripeInstance)
      } catch (error) {
        console.error('Failed to initialize Stripe:', error)
        setError('Failed to initialize payment system')
        onError?.(error instanceof Error ? error.message : 'Failed to initialize payment system')
      }
    }

    initPayment()
  }, [onError])

  // Create payment intent and setup elements
  useEffect(() => {
    if (!stripe) return

    const setupPayment = async () => {
      try {
        setIsLoading(true)
        
        // Create payment intent
        const paymentIntent = await createPaymentIntent({
          amount,
          currency,
          description,
          metadata,
        })

        setClientSecret(paymentIntent.client_secret)

        // Create elements instance
        const elementsOptions: StripeElementsOptions = {
          clientSecret: paymentIntent.client_secret,
          appearance: defaultPaymentConfig.appearance,
        }

        const elementsInstance = stripe.elements(elementsOptions)
        setElements(elementsInstance)

        // Mount payment element with wallet options
        const paymentElement = elementsInstance.create('payment', {
          layout: 'tabs',
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          wallets: {
            applePay: 'auto',
            googlePay: 'auto',
          },
        })
        
        paymentElement.mount('#payment-element')

      } catch (error) {
        console.error('Payment setup error:', error)
        setError('Failed to setup payment')
        onError?.(error instanceof Error ? error.message : 'Payment setup failed')
      } finally {
        setIsLoading(false)
      }
    }

    setupPayment()
  }, [stripe, amount, currency, description, metadata, onError])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    console.log('🔵 支付提交开始')

    if (!stripe || !elements || !clientSecret) {
      console.error('❌ 支付系统未准备好', { stripe: !!stripe, elements: !!elements, clientSecret: !!clientSecret })
      setError('Payment system not ready')
      return
    }

    console.log('✅ 支付系统已准备好')
    console.log('📋 Client Secret:', clientSecret.substring(0, 30) + '...')

    setIsLoading(true)
    setError('')

    try {
      console.log('🔄 正在调用 confirmPayment...')

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      })

      console.log('📊 confirmPayment 结果:', {
        hasError: !!confirmError,
        hasPaymentIntent: !!paymentIntent,
        status: paymentIntent?.status
      })

      if (confirmError) {
        console.error('❌ 支付错误:', confirmError)
        setError(confirmError.message || 'Payment failed')
        onError?.(confirmError.message || 'Payment failed')
      } else if (paymentIntent?.status === 'succeeded') {
        console.log('✅ 支付成功!', paymentIntent.id)
        onSuccess?.(paymentIntent.id)
      } else {
        console.warn('⚠️ 支付状态未知:', paymentIntent?.status)
        setError(`Unexpected payment status: ${paymentIntent?.status}`)
      }
    } catch (error) {
      console.error('💥 支付确认异常:', error)
      setError('Payment failed')
      onError?.(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsLoading(false)
      console.log('🔵 支付提交结束')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Complete Your Payment
        </h3>
        <div className="text-sm text-neutral-600">
          <span>Amount: </span>
          <span className="font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
            }).format(amount)}
          </span>
        </div>
        {description && (
          <div className="text-sm text-neutral-600 mt-1">
            {description}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Payment Element */}
        <div id="payment-element" className="mb-6"></div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !elements}
            className="flex-1 btn btn-primary disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </span>
            ) : (
              `Pay ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
              }).format(amount)}`
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 text-xs text-neutral-500 text-center">
        <div className="flex items-center justify-center space-x-4">
          <span>🔒 Secure payments</span>
          <span>💳 All major cards</span>
          <span>📱 Digital wallets</span>
        </div>
      </div>
    </div>
  )
}
