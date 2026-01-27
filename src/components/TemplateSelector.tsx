'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from '@/contexts/LanguageContext'
import PaymentForm from './PaymentForm'
import { toast } from '@/lib/toast'
import type {
  Theme,
  InvitationTemplate,
  TemplatesApiResponse,
} from '@/types/invitation-template'
import { formatPrice } from '@/types/invitation-template'

interface Party {
  childName: string
  childAge: number
  eventDatetime: string
  eventEndDatetime?: string
  location: string
  theme?: string
  notes?: string
}

interface TemplateSelectorProps {
  party: Party
  qrCodeUrl?: string
  rsvpUrl?: string
  onTemplateSelect: (template: string) => void
  partyId: string
  currentTemplate: string
  paidTemplates: string[]
  onPaymentSuccess?: () => void
}

export default function TemplateSelector({
  party,
  qrCodeUrl,
  rsvpUrl,
  onTemplateSelect,
  partyId,
  currentTemplate,
  paidTemplates,
  onPaymentSuccess,
}: TemplateSelectorProps) {
  const t = useTranslations('templates')
  const locale = useLocale()

  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<InvitationTemplate | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const hideScrollbarStyle = `
    .template-scroll-container::-webkit-scrollbar {
      display: none;
    }
  `

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates')
        if (response.ok) {
          const data: TemplatesApiResponse = await response.json()
          setThemes(data.themes)
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  const isTemplatePurchased = (templateId: string) => {
    return paidTemplates.includes(templateId)
  }

  const allTemplates = themes.flatMap((theme) => theme.templates)

  const filteredTemplates = selectedTheme
    ? themes.find((t) => t.id === selectedTheme)?.templates || []
    : allTemplates

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const aFree = a.effectivePrice.isFree
    const bFree = b.effectivePrice.isFree
    const aPurchased = isTemplatePurchased(a.id)
    const bPurchased = isTemplatePurchased(b.id)

    if (aFree && !bFree) return -1
    if (!aFree && bFree) return 1
    if (aPurchased && !bPurchased) return -1
    if (!aPurchased && bPurchased) return 1
    return 0
  })

  const handleTemplateClick = (template: InvitationTemplate) => {
    if (template.effectivePrice.isFree || isTemplatePurchased(template.id)) {
      onTemplateSelect(template.id)
      return
    }
    setSelectedTemplate(template)
    setShowPayment(true)
  }

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }

  const handlePaymentSuccess = async (paymentId: string) => {
    if (!selectedTemplate) return

    try {
      const response = await fetch(`/api/parties/${partyId}/upgrade-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate.id,
          paymentId,
        }),
      })

      if (response.ok) {
        setShowPayment(false)
        toast.success(
          locale === 'zh' ? '付款成功！' : 'Payment Successful!',
          locale === 'zh' ? '模板已解锁，正在应用...' : 'Template unlocked, applying...'
        )
        onTemplateSelect(selectedTemplate.id)
        onPaymentSuccess?.()
      } else {
        const error = await response.json()
        toast.error(
          locale === 'zh' ? '支付验证失败' : 'Payment verification failed',
          error.message || (locale === 'zh' ? '请重试' : 'Please try again')
        )
      }
    } catch (error) {
      console.error('Template upgrade error:', error)
      toast.error(
        locale === 'zh' ? '出现错误' : 'Error occurred',
        locale === 'zh' ? '请重试' : 'Please try again'
      )
    }
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
  }

  const getThemeInfo = (themeId: string) => {
    return themes.find((t) => t.id === themeId)
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-64 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyle }} />
      <div className="space-y-6">
        <div className="card">
          <div className="flex flex-col gap-4 mb-6">
            {/* Header with clear title and action hint */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  {locale === 'zh' ? '更换邀请卡样式' : 'Change Invitation Style'}
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  {locale === 'zh'
                    ? `共 ${sortedTemplates.length} 款模板可选，点击即可切换`
                    : `${sortedTemplates.length} templates available, tap to switch`}
                </p>
              </div>
              {/* Scroll hint - only show on larger screens */}
              <div className="hidden sm:flex text-sm text-neutral-500 items-center gap-1 bg-neutral-50 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                {t('scrollHint')}
              </div>
            </div>

            {/* Mobile swipe hint */}
            <div className="sm:hidden flex items-center justify-center gap-2 text-xs text-neutral-400 bg-neutral-50 py-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {locale === 'zh' ? '左右滑动查看更多模板' : 'Swipe to see more templates'}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTheme(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTheme === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
              >
                {locale === 'zh' ? '全部' : 'All'}
              </button>
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTheme === theme.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                >
                  {theme.icon} {theme.name[locale as 'zh' | 'en'] || theme.name.en}
                </button>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden">
            {/* Navigation arrows - larger and more visible */}
            <button
              onClick={scrollLeft}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-primary-600 hover:bg-primary-700 shadow-lg rounded-full p-2.5 transition-all hover:scale-110 text-white"
              aria-label={locale === 'zh' ? '向左滚动' : 'Scroll left'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={scrollRight}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-primary-600 hover:bg-primary-700 shadow-lg rounded-full p-2.5 transition-all hover:scale-110 text-white"
              aria-label={locale === 'zh' ? '向右滚动' : 'Scroll right'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div
              ref={scrollContainerRef}
              className="template-scroll-container flex overflow-x-auto gap-3 sm:gap-4 pb-4 px-8 sm:px-10 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {sortedTemplates.map((template) => {
                const themeInfo = getThemeInfo(template.theme)
                const isFree = template.effectivePrice.isFree
                const isPurchased = isTemplatePurchased(template.id)
                const isCurrent = currentTemplate === template.id
                const hasDiscount = template.effectivePrice.hasDiscount

                return (
                  <div
                    key={template.id}
                    className={`relative flex flex-col group border-2 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden flex-shrink-0 snap-center w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px] ${isCurrent
                      ? 'border-primary-500 bg-primary-50 shadow-lg ring-2 ring-primary-200'
                      : !isFree && !isPurchased
                        ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 hover:border-orange-300 hover:shadow-lg'
                        : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-lg'
                      }`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="aspect-[5/7] overflow-hidden bg-neutral-100 border-b relative">
                      <img
                        src={template.imageUrl}
                        alt={template.name}
                        className="w-full h-full object-fill"
                        loading="lazy"
                      />

                      {(isFree || hasDiscount) && (
                        <div className="absolute top-2 left-2">
                          {isFree ? (
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {locale === 'zh' ? '免费' : 'FREE'}
                            </span>
                          ) : hasDiscount ? (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {template.effectivePrice.discountPercent}% OFF
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="p-2 sm:p-3 flex-grow flex flex-col">
                      <div className="text-center mb-2 flex-grow">
                        <h4 className="font-bold text-xs sm:text-sm md:text-base text-neutral-900 mb-0.5 truncate">{template.name}</h4>
                        <p className="text-xs text-neutral-600 mb-1 hidden sm:block">
                          {themeInfo?.icon} {themeInfo?.name[locale as 'zh' | 'en'] || template.theme}
                        </p>

                        <div className="flex justify-center items-center gap-1 sm:gap-2 mb-2 flex-wrap">
                          {!isPurchased && (
                            <>
                              {hasDiscount && template.effectivePrice.originalPrice && (
                                <span className="text-xs text-neutral-400 line-through hidden sm:inline">
                                  {formatPrice(template.effectivePrice.originalPrice, template.config.pricing.currency, locale)}
                                </span>
                              )}
                              <span className={`text-sm sm:text-base md:text-lg font-bold ${isFree ? 'text-green-600' : 'text-orange-600'}`}>
                                {formatPrice(template.effectivePrice.price, template.config.pricing.currency, locale)}
                              </span>
                            </>
                          )}

                          {isPurchased && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              {locale === 'zh' ? '已购' : 'Owned'}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
                              {locale === 'zh' ? '使用中' : 'In Use'}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        className={`w-full py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${isCurrent
                          ? 'bg-green-600 text-white'
                          : !isFree && !isPurchased
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTemplateClick(template)
                        }}
                        disabled={isCurrent}
                      >
                        {isCurrent
                          ? (locale === 'zh' ? '使用中' : 'In Use')
                          : !isFree && !isPurchased
                            ? (locale === 'zh' ? '购买' : 'Buy')
                            : (locale === 'zh' ? '使用' : 'Use')}
                      </button>
                    </div>

                    {!isFree && !isPurchased && (
                      <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/10 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 rounded-full p-3 shadow-lg">
                          <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {sortedTemplates.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              {locale === 'zh' ? '暂无模板' : 'No templates available'}
            </div>
          )}
        </div>

        {showPayment && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl my-8">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-center text-neutral-900 mb-4">
                  {t('purchaseTitle')}
                </h3>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-orange-800 mb-2">{selectedTemplate.name}</h4>
                  <p className="text-sm text-orange-700 mb-2">
                    {getThemeInfo(selectedTemplate.theme)?.icon}{' '}
                    {getThemeInfo(selectedTemplate.theme)?.name[locale as 'zh' | 'en']}
                  </p>
                  <img
                    src={selectedTemplate.imageUrl}
                    alt={selectedTemplate.name}
                    className="w-full aspect-[5/7] rounded-lg shadow-md object-fill"
                  />
                </div>
              </div>

              <PaymentForm
                amount={selectedTemplate.effectivePrice.price}
                currency={selectedTemplate.config.pricing.currency}
                description={`Premium template: ${selectedTemplate.name}`}
                metadata={{
                  partyId,
                  feature: 'template',
                  templateId: selectedTemplate.id,
                  templateName: selectedTemplate.name,
                }}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={() => setShowPayment(false)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
