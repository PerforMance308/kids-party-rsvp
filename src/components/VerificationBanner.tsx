'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface VerificationBannerProps {
    email: string
}

export default function VerificationBanner({ email }: VerificationBannerProps) {
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
    const { t } = useLanguage()

    console.log('[DEBUG] VerificationBanner rendering for:', email, 'status:', status)

    const handleResend = async () => {
        setStatus('sending')
        try {
            const response = await fetch('/api/auth/verify/send', {
                method: 'POST',
            })
            if (response.ok) {
                setStatus('success')
            } else {
                setStatus('error')
            }
        } catch (error) {
            setStatus('error')
        }
    }

    if (status === 'success') {
        return (
            <div className="bg-green-50 border-b border-green-200 py-3 px-4">
                <div className="container mx-auto text-center text-sm text-green-700">
                    <span>✅ {t('auth.verifySent')} <strong>{email}</strong></span>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-amber-800">
                <div className="flex items-center gap-2">
                    <span className="text-lg">✉️</span>
                    <span>{t('auth.verifyReminder')} <strong>{email}</strong></span>
                </div>
                <button
                    onClick={handleResend}
                    disabled={status === 'sending'}
                    className="font-semibold underline hover:text-amber-900 disabled:opacity-50"
                >
                    {status === 'sending' ? t('auth.sending') : t('auth.resendVerify')}
                </button>
                {status === 'error' && (
                    <span className="text-red-600 font-medium">❌ {t('auth.sendFailed')}</span>
                )}
            </div>
        </div>
    )
}
