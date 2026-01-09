'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { useLocale } from '@/contexts/LanguageContext'

function VerifyResultContent() {
    const searchParams = useSearchParams()
    const locale = useLocale()
    
    const status = searchParams.get('status')
    const reason = searchParams.get('reason')
    
    const isSuccess = status === 'success'
    
    const getErrorMessage = () => {
        switch (reason) {
            case 'missing':
                return 'Verification link is invalid.'
            case 'invalid':
                return 'This link has already been used or is invalid. Your email may already be verified.'
            case 'expired':
                return 'This verification link has expired. Please request a new one.'
            case 'server':
                return 'An error occurred. Please try again later.'
            default:
                return 'Verification failed. Please try again.'
        }
    }

    const iconBgClass = isSuccess ? 'bg-green-100' : 'bg-red-100'
    const titleClass = isSuccess ? 'text-green-700' : 'text-red-700'

    return (
        <main className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md text-center">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${iconBgClass}`}>
                    {isSuccess ? (
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </div>

                <h1 className={`text-2xl font-bold mb-4 ${titleClass}`}>
                    {isSuccess ? 'Email Verified!' : 'Verification Failed'}
                </h1>

                <p className="text-neutral-600 mb-8">
                    {isSuccess
                        ? 'Your email has been successfully verified. You can now use all features.'
                        : getErrorMessage()
                    }
                </p>

                <div className="space-y-3">
                    <Link
                        href={`/${locale}/dashboard`}
                        className="btn btn-primary w-full"
                    >
                        Go to Dashboard
                    </Link>

                    {!isSuccess && (
                        <Link
                            href={`/${locale}`}
                            className="btn btn-secondary w-full"
                        >
                            Go to Home
                        </Link>
                    )}
                </div>
            </div>
        </main>
    )
}

export default function VerifyResultPage() {
    return (
        <Suspense fallback={
            <main className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </main>
        }>
            <VerifyResultContent />
        </Suspense>
    )
}
