'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useLocale, useLanguage } from '@/contexts/LanguageContext'
import { SparklesIcon, QrCodeIcon, UserGroupIcon } from '@heroicons/react/24/outline'

function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [termsShake, setTermsShake] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const { t } = useLanguage()
  const redirectUrl = searchParams.get('redirect')

  // Password strength
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }
  const strength = Object.values(checks).filter(Boolean).length

  const triggerTermsShake = () => {
    setTermsShake(true)
    setTimeout(() => setTermsShake(false), 600)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreedToTerms) {
      triggerTermsShake()
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (response.ok) {
        const loginResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl: redirectUrl || '/',
        })
        if (loginResult?.ok) {
          window.location.href = redirectUrl || `/${locale}`
        }
        return
      } else {
        const data = await response.json()
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!agreedToTerms) {
      triggerTermsShake()
      return
    }
    try {
      await signIn('google', { callbackUrl: redirectUrl || `/${locale}` })
    } catch {
      setError(t('register.googleSignUpFailed'))
    }
  }

  const valuePoints = locale === 'zh'
    ? [
        { icon: <QrCodeIcon className="w-5 h-5" />, text: '扫码即可回复邀请' },
        { icon: <UserGroupIcon className="w-5 h-5" />, text: '实时宾客追踪' },
        { icon: <SparklesIcon className="w-5 h-5" />, text: '精美邀请函模板' },
      ]
    : [
        { icon: <QrCodeIcon className="w-5 h-5" />, text: 'QR code instant RSVP' },
        { icon: <UserGroupIcon className="w-5 h-5" />, text: 'Real-time guest tracking' },
        { icon: <SparklesIcon className="w-5 h-5" />, text: 'Beautiful invitation templates' },
      ]

  return (
    <div className="min-h-[80vh] flex">
      {/* Left: Brand area (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-500 via-primary-600 to-purple-700 items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        </div>
        <div className="relative text-white max-w-md">
          <h2 className="font-display text-3xl font-bold mb-4">
            {locale === 'zh' ? '开始规划完美派对' : 'Start planning the perfect party'}
          </h2>
          <p className="text-primary-100 mb-8 leading-relaxed">
            {locale === 'zh'
              ? '免费注册，几分钟内创建专业邀请函。'
              : 'Sign up free and create professional invitations in minutes.'}
          </p>
          <div className="space-y-4">
            {valuePoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  {point.icon}
                </div>
                <span className="text-sm font-medium">{point.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form area */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden h-1.5 w-16 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full mb-8" />

          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Kid Party RSVP"
              width={200}
              height={50}
              className="h-12 w-auto object-contain"
              priority
            />
          </div>

          <h1 className="font-display text-2xl font-bold text-neutral-900 text-center mb-1">
            {t('register.title')}
          </h1>
          <p className="text-neutral-500 text-center mb-6">
            {locale === 'zh' ? '开始规划精彩派对' : 'Start planning amazing parties'}
          </p>

          {/* Terms - above all sign-up methods */}
          <motion.div
            animate={termsShake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.5 }}
            className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors mb-6 ${
              termsShake ? 'bg-red-50 border-red-300' :
              agreedToTerms ? 'bg-green-50 border-green-200' :
              'bg-neutral-50 border-neutral-100'
            }`}
          >
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => { setAgreedToTerms(e.target.checked); setError('') }}
              className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-neutral-600 cursor-pointer">
              {locale === 'zh' ? '我同意' : 'I agree to the'}{' '}
              <Link href={`/${locale}/terms`} className="text-primary-600 hover:underline font-medium" target="_blank">
                {locale === 'zh' ? '服务条款' : 'Terms'}
              </Link>
              {' '}{locale === 'zh' ? '和' : 'and'}{' '}
              <Link href={`/${locale}/privacy`} className="text-primary-600 hover:underline font-medium" target="_blank">
                {locale === 'zh' ? '隐私政策' : 'Privacy Policy'}
              </Link>
            </label>
          </motion.div>

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-3 border border-neutral-200 rounded-xl bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm mb-6"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('register.signUpWithGoogle')}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#fdf4ff] lg:bg-white px-4 text-neutral-400 font-medium tracking-wider">
                {locale === 'zh' ? '或使用邮箱注册' : 'Or sign up with email'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t('register.email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t('register.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength
                            ? strength <= 2 ? 'bg-red-400' : strength <= 3 ? 'bg-amber-400' : 'bg-party-green'
                            : 'bg-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className={checks.length ? 'text-party-green' : 'text-neutral-400'}>
                      {checks.length ? '✓' : '○'} 8+ characters
                    </span>
                    <span className={checks.upper ? 'text-party-green' : 'text-neutral-400'}>
                      {checks.upper ? '✓' : '○'} Uppercase
                    </span>
                    <span className={checks.number ? 'text-party-green' : 'text-neutral-400'}>
                      {checks.number ? '✓' : '○'} Number
                    </span>
                    <span className={checks.special ? 'text-party-green' : 'text-neutral-400'}>
                      {checks.special ? '✓' : '○'} Special char
                    </span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary disabled:opacity-50"
            >
              {isLoading ? t('register.creatingAccount') : t('register.signUp')}
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-neutral-500 text-sm">
              {t('register.haveAccount')}{' '}
              <Link href={`/${locale}/login`} className="text-primary-600 hover:text-primary-700 font-semibold">
                {t('register.signInLink')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>}>
      <RegisterForm />
    </Suspense>
  )
}
