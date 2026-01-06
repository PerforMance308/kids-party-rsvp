'use client'

import { useEffect, useState } from 'react'
import { 
  initializeHyperswitch, 
  createPaymentIntent, 
  defaultPaymentConfig,
  type PaymentIntentRequest,
  type PaymentStatus
} from '@/lib/hyperswitch'

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
  const [hyperswitch, setHyperswitch] = useState<any>(null)
  const [elements, setElements] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState('')

  // Initialize Hyperswitch
  useEffect(() => {
    const initPayment = async () => {
      try {
        const hyper = await initializeHyperswitch(defaultPaymentConfig)
        setHyperswitch(hyper)
      } catch (error) {
        console.error('Failed to initialize Hyperswitch:', error)
        setError('Failed to initialize payment system')
      }
    }

    initPayment()
  }, [])

  // Create payment intent and setup elements
  useEffect(() => {
    if (!hyperswitch) return

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
        const elementsInstance = hyperswitch.elements({
          clientSecret: paymentIntent.client_secret,
          appearance: defaultPaymentConfig.appearance,
        })

        setElements(elementsInstance)

        // Mount payment element
        const paymentElement = elementsInstance.create('payment')
        paymentElement.mount('#payment-element')

        // Setup express checkout buttons
        const expressCheckoutElement = elementsInstance.create('expressCheckout', {
          wallets: {
            applePay: 'always',
            googlePay: 'always',
            payPal: 'always',
          },
        })
        expressCheckoutElement.mount('#express-checkout-element')

      } catch (error) {
        console.error('Payment setup error:', error)
        setError('Failed to setup payment')
        onError?.(error instanceof Error ? error.message : 'Payment setup failed')
      } finally {
        setIsLoading(false)
      }
    }

    setupPayment()
  }, [hyperswitch, amount, currency, description, metadata, onError])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!hyperswitch || !elements || !clientSecret) {
      setError('Payment system not ready')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { error, paymentIntent } = await hyperswitch.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setError(error.message || 'Payment failed')
        onError?.(error.message || 'Payment failed')
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess?.(paymentIntent.id)
      }
    } catch (error) {
      console.error('Payment confirmation error:', error)
      setError('Payment failed')
      onError?.(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsLoading(false)
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
        {/* Express Checkout Buttons */}
        <div className="mb-4">
          <div id="express-checkout-element" className="mb-4"></div>
          <div className="text-center text-sm text-neutral-500 mb-4">
            or pay with card
          </div>
        </div>

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