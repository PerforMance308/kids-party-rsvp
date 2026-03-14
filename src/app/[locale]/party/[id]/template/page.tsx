'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PaymentForm from '@/components/PaymentForm'
import TemplateSelectionLayout from '@/components/TemplateSelectionLayout'
import { useLanguage, useLocale } from '@/contexts/LanguageContext'
import { detectPreferredCurrency } from '@/lib/currency'
import { toast } from '@/lib/toast'
import type { SupportedCurrency, TemplatesApiResponse, Theme } from '@/types/invitation-template'
import { formatPrice, getEffectivePrice } from '@/types/invitation-template'

interface PartyData {
  id: string
  childName: string
  childAge: number
  eventDatetime: string
  eventEndDatetime?: string
  location: string
  theme?: string
  notes?: string
  template?: string
  paidTemplates?: string[]
  rsvpUrl?: string
}

export default function ChangeTemplatePage() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const locale = useLocale()

  const [party, setParty] = useState<PartyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplateMeta, setSelectedTemplateMeta] = useState<{
    name: string
    price: number
    currency: string
    isFree: boolean
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [isFooterVisible, setIsFooterVisible] = useState(false)
  const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrency>('USD')

  // For payment modal: we need theme info to show template preview
  const [themes, setThemes] = useState<Theme[]>([])

  useEffect(() => {
    setPreferredCurrency(detectPreferredCurrency(locale))
  }, [locale])

  useEffect(() => {
    const fetchParty = async () => {
      try {
        const response = await fetch(`/api/parties/${id}`)
        if (response.ok) {
          const data = await response.json()
          setParty(data)
          setSelectedTemplateId(data.template || null)
        } else {
          setError(locale === 'zh' ? '加载派对失败' : 'Failed to load party')
        }
      } catch {
        setError(locale === 'zh' ? '加载派对时出错' : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) fetchParty()
  }, [id, locale])

  // Fetch QR code for preview.
  // Re-fetch when selected template changes so qr colors follow template JSON.
  useEffect(() => {
    const loadQR = async () => {
      if (!id) return
      try {
        let qrUrl = `/api/parties/${id}/qr?t=${Date.now()}`
        if (selectedTemplateId) {
          const selectedTemplate = themes
            .flatMap((th) => th.templates)
            .find((tpl) => tpl.id === selectedTemplateId)
          const darkColor = selectedTemplate?.config?.qr_code?.darkColor
          const lightColor = selectedTemplate?.config?.qr_code?.lightColor

          if (darkColor) {
            qrUrl += `&darkColor=${encodeURIComponent(darkColor)}`
          }
          if (lightColor) {
            qrUrl += `&lightColor=${encodeURIComponent(lightColor)}`
          }
        }

        const response = await fetch(qrUrl)
        if (response.ok) {
          const data = await response.json()
          setQrCode(data.qrCode)
        }
      } catch {
        // ignore
      }
    }
    if (id) loadQR()
  }, [id, selectedTemplateId, themes])

  // Fetch templates for payment modal preview
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates')
        if (response.ok) {
          const data: TemplatesApiResponse = await response.json()
          setThemes(data.themes)
        }
      } catch {
        // ignore
      }
    }
    fetchTemplates()
  }, [])

  // Lock background scroll when payment modal is open
  useEffect(() => {
    if (showPayment) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [showPayment])

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return

    const observer = new IntersectionObserver(
      (entries) => {
        setIsFooterVisible(entries[0]?.isIntersecting ?? false)
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -48px 0px',
      }
    )

    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  const handleTemplateSelect = useCallback((templateId: string, meta: { name: string; price: number; currency: string; isFree: boolean }) => {
    setSelectedTemplateId(templateId)
    setSelectedTemplateMeta(meta)
  }, [])

  const handleSubmit = async () => {
    if (!selectedTemplateId || !party) return

    // If it's the same as current, just go back
    if (selectedTemplateId === party.template) {
      router.push(`/${locale}/party/${id}/dashboard`)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/parties/${id}/upgrade-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selectedTemplateId }),
      })

      if (response.ok) {
        toast.success(
          t('dashboard.templateChanged'),
          selectedTemplateMeta?.name || ''
        )
        router.push(`/${locale}/party/${id}/dashboard`)
      } else {
        const data = await response.json()
        toast.error(
          locale === 'zh' ? '更换失败' : 'Change failed',
          data.error || ''
        )
      }
    } catch {
      toast.error(
        locale === 'zh' ? '出现错误' : 'Error occurred',
        locale === 'zh' ? '请重试' : 'Please try again'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePayRequest = () => {
    setShowPayment(true)
  }

  const handleCtaClick = () => {
    if (!selectedTemplateId || !party) return

    if (selectedTemplateId === party.template) {
      router.push(`/${locale}/party/${id}/dashboard`)
      return
    }

    if (
      selectedTemplateMeta &&
      !selectedTemplateMeta.isFree &&
      !(party.paidTemplates || []).includes(selectedTemplateId)
    ) {
      handlePayRequest()
      return
    }

    handleSubmit()
  }

  const handlePaymentSuccess = async (paymentId: string) => {
    if (!selectedTemplateId || !party) return

    try {
      const response = await fetch(`/api/parties/${id}/upgrade-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplateId,
          paymentId,
          paymentCurrency: selectedTemplateMeta?.currency,
        }),
      })

      if (response.ok) {
        setShowPayment(false)
        toast.success(
          locale === 'zh' ? '付款成功！' : 'Payment Successful!',
          t('dashboard.templateChanged')
        )
        router.push(`/${locale}/party/${id}/dashboard`)
      } else {
        const data = await response.json()
        toast.error(
          locale === 'zh' ? '支付验证失败' : 'Payment verification failed',
          data.error || (locale === 'zh' ? '请重试' : 'Please try again')
        )
      }
    } catch {
      toast.error(
        locale === 'zh' ? '出现错误' : 'Error occurred',
        locale === 'zh' ? '请重试' : 'Please try again'
      )
    }
  }

  const selectedFullTemplate = selectedTemplateId
    ? themes.flatMap((th) => th.templates).find((t) => t.id === selectedTemplateId)
    : null

  const getThemeInfo = (themeId: string) => themes.find((th) => th.id === themeId)

  // Has the user picked a different template from the current one?
  const hasNewSelection = selectedTemplateId && selectedTemplateId !== party?.template

  if (isLoading) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center">{t('home.loading')}</div>
      </main>
    )
  }

  if (error || !party) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">{error || t('rsvp.invitationNotFound')}</h1>
          <Link href={`/${locale}/dashboard`} className="btn btn-primary">
            {locale === 'zh' ? '返回仪表板' : 'Back to Dashboard'}
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 px-4 py-4 lg:py-4">
      <div className="max-w-7xl mx-auto">
        {/* Back navigation */}
        <Link
          href={`/${locale}/party/${id}/dashboard`}
          className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-3"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {locale === 'zh' ? '返回派对管理' : 'Back to Dashboard'}
        </Link>

        <TemplateSelectionLayout
          locale={locale}
          selectedTemplateId={selectedTemplateId}
          previewParty={{
            childName: party.childName,
            childAge: party.childAge,
            eventDatetime: party.eventDatetime,
            eventEndDatetime: party.eventEndDatetime,
            location: party.location,
            theme: party.theme,
            notes: party.notes,
          }}
          qrCodeUrl={qrCode}
          rsvpUrl={party.rsvpUrl}
          onTemplateSelect={handleTemplateSelect}
          currentTemplate={party.template}
          paidTemplates={party.paidTemplates}
        />
      </div>

      <div className="pointer-events-none sticky bottom-6 z-30 mt-4 hidden justify-end sm:flex">
        <button
          type="button"
          onClick={handleCtaClick}
          disabled={isSubmitting}
          className="pointer-events-auto inline-flex h-11 items-center justify-center rounded-full bg-primary-600 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(168,85,247,0.24)] transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
            </span>
          ) : (
            'Change'
          )}
        </button>
      </div>

      <div className={`${isFooterVisible ? 'hidden' : 'fixed'} bottom-[calc(0.4rem+env(safe-area-inset-bottom))] right-4 z-30 sm:hidden`}>
        <button
          type="button"
          onClick={handleCtaClick}
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary-600 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(168,85,247,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
            </span>
          ) : (
            'Change'
          )}
        </button>
      </div>

      {/* Payment modal */}
      {showPayment && selectedFullTemplate && selectedTemplateMeta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[120]" onClick={() => setShowPayment(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-neutral-900">
                  {locale === 'zh' ? '购买精美付费模板' : 'Purchase Premium Template'}
                </h3>
                <button onClick={() => setShowPayment(false)} className="text-neutral-400 hover:text-neutral-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg mb-4 flex items-center gap-3">
                {selectedFullTemplate.imageUrl ? (
                  <img
                    src={selectedFullTemplate.imageUrl}
                    alt={selectedFullTemplate.name}
                    className="w-20 h-28 rounded-lg shadow-md object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-28 rounded-lg shadow-md flex-shrink-0 bg-neutral-100 flex items-center justify-center">
                    <span className="text-2xl">ART</span>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-orange-800">{selectedFullTemplate.name}</h4>
                  <p className="text-sm text-orange-700">
                    {getThemeInfo(selectedFullTemplate.theme)?.icon}{' '}
                    {getThemeInfo(selectedFullTemplate.theme)?.name[locale as 'zh' | 'en']}
                  </p>
                  <p className="text-lg font-bold text-orange-600 mt-1">
                    {formatPrice(selectedTemplateMeta.price, selectedTemplateMeta.currency, locale)}
                  </p>
                </div>
              </div>

              <PaymentForm
                amount={selectedTemplateMeta.price}
                currency={selectedTemplateMeta.currency}
                description={`Premium template: ${selectedFullTemplate.name}`}
                metadata={{
                  partyId: party.id,
                  feature: 'template',
                  templateId: selectedTemplateId!,
                  templateName: selectedFullTemplate.name,
                  currency: selectedTemplateMeta.currency,
                }}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => console.error('Payment error:', msg)}
                onCancel={() => setShowPayment(false)}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
