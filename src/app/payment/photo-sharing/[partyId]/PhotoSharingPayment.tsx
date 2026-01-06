'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PaymentForm from '@/components/PaymentForm'

interface PhotoSharingPaymentProps {
  partyId: string
  childName: string
}

export default function PhotoSharingPayment({ 
  partyId, 
  childName 
}: PhotoSharingPaymentProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      setIsProcessing(true)
      
      // Update party to enable photo sharing
      const response = await fetch(`/api/parties/${partyId}/enable-photo-sharing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }),
      })

      if (response.ok) {
        // Redirect to party dashboard
        router.push(`/party/${partyId}/dashboard?photoSharingEnabled=true`)
      } else {
        const error = await response.json()
        setError(error.message || 'Failed to enable photo sharing')
      }
    } catch (error) {
      console.error('Photo sharing enablement error:', error)
      setError('Failed to enable photo sharing')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentError = (error: string) => {
    setError(error)
  }

  const handleCancel = () => {
    router.push(`/party/${partyId}/dashboard`)
  }

  if (isProcessing) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Enabling Photo Sharing...
        </h3>
        <p className="text-neutral-600">
          Please wait while we set up your photo sharing feature.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 p-6 bg-purple-50 rounded-lg border border-purple-200">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-purple-900 mb-2">
            Photo Sharing Feature
          </h3>
          <div className="text-3xl font-bold text-purple-600 mb-1">
            $2.99
          </div>
          <p className="text-sm text-purple-700">
            One-time payment for {childName}'s party
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <PaymentForm
        amount={2.99}
        currency="USD"
        description={`Photo sharing for ${childName}'s party`}
        metadata={{
          partyId,
          feature: 'photo_sharing',
          childName,
        }}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onCancel={handleCancel}
      />

      <div className="mt-6 p-4 bg-neutral-50 rounded-lg text-center">
        <p className="text-xs text-neutral-600 mb-2">
          <span className="font-medium">Secure Payment:</span> We use Hyperswitch for secure payment processing
        </p>
        <div className="flex items-center justify-center space-x-4 text-xs text-neutral-500">
          <span>💳 Credit Cards</span>
          <span>🍎 Apple Pay</span>
          <span>📱 Google Pay</span>
          <span>💙 PayPal</span>
        </div>
      </div>
    </div>
  )
}