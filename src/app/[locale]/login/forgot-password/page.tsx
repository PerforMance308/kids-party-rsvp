'use client'

import { useState } from 'react'
import { useLanguage, useLocale } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const { t } = useLanguage()
    const locale = useLocale()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, locale })
            })

            if (response.ok) {
                setStatus('success')
                setMessage('If an account exists with that email, we have sent a password reset link.')
            } else {
                setStatus('error')
                setMessage('Something went wrong. Please try again.')
            }
        } catch (error) {
            setStatus('error')
            setMessage('Network error. Please try again.')
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="card">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-neutral-900">Reset Password</h1>
                        <p className="text-neutral-600 mt-2">Enter your email to receive a reset link</p>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
                                {message}
                            </div>
                            <Link href={`/${locale}/login`} className="btn btn-primary w-full block">
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                            </button>

                            <div className="text-center mt-4">
                                <Link href={`/${locale}/login`} className="text-primary-600 hover:text-primary-700 text-sm">
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </main>
    )
}
