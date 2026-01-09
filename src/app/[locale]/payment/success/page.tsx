import Link from 'next/link'
import { Suspense } from 'react'
import { useLocale } from '@/contexts/LanguageContext'

function PaymentSuccessContent() {
  const locale = useLocale()
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-neutral-600 mb-6">
              Your photo sharing feature has been enabled successfully.
              Guests will now be able to upload and share photos from your party.
            </p>

            <div className="space-y-3">
              <Link
                href={`/${locale}/dashboard`}
                className="btn btn-primary w-full"
              >
                Return to Dashboard
              </Link>
              <p className="text-sm text-neutral-500">
                You'll receive a confirmation email shortly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}