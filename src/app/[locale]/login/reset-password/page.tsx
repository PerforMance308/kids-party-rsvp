'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage, useLocale } from '@/contexts/LanguageContext'
import Link from 'next/link'

function ResetPasswordForm() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const router = useRouter()
    const searchParams = useSearchParams()
    const locale = useLocale()
    const token = searchParams.get('token')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setStatus('error')
            setMessage('Passwords do not match')
            return
        }

        setStatus('loading')
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            })

            if (response.ok) {
                setStatus('success')
                setTimeout(() => router.push(`/${locale}/login`), 3000)
            } else {
                const data = await response.json()
                setStatus('error')
                setMessage(data.error || 'Failed to reset password')
            }
        } catch (error) {
            setStatus('error')
            setMessage('Network error. Please try again.')
        }
    }

    if (!token) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 font-medium">Invalid or missing reset token.</p>
                <Link href={`/${locale}/login/forgot-password`} className="text-primary-600 underline mt-4 inline-block">
                    Request a new link
                </Link>
            </div>
        )
    }

    return (
        <div className="card">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-neutral-900">Set New Password</h1>
                <p className="text-neutral-600 mt-2">Enter your new secure password</p>
            </div>

            {status === 'success' ? (
                <div className="text-center">
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
                        Password reset successful! Redirecting to login...
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            required
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input"
                            required
                        />
                    </div>

                    {status === 'error' && (
                        <div className="text-red-600 text-sm">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full btn btn-primary disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Updating...' : 'Reset Password'}
                    </button>
                </form>
            )}
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </main>
    )
}
