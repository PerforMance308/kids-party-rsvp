'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import type {
  Theme,
  InvitationTemplate,
  TemplatesApiResponse,
} from '@/types/invitation-template'
import { formatPrice } from '@/types/invitation-template'

interface TemplateMeta {
  name: string
  price: number
  currency: string
  isFree: boolean
}

interface PartyTemplateStepProps {
  onTemplateSelect: (templateId: string, templateMeta: TemplateMeta) => void
  selectedTemplateId: string | null
  onBack: () => void
  onSubmit: () => void
  onPayRequest: () => void
  isSubmitting: boolean
  /** Shows "In Use" badge on the current template (dashboard reuse) */
  currentTemplate?: string
  /** Templates already purchased — skip payment for these */
  paidTemplates?: string[]
}

export default function PartyTemplateStep({
  onTemplateSelect,
  selectedTemplateId,
  onBack,
  onSubmit,
  onPayRequest,
  isSubmitting,
  currentTemplate,
  paidTemplates,
}: PartyTemplateStepProps) {
  const { locale, t } = useLanguage()

  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const allTemplates = themes.flatMap((theme) => theme.templates)

  const filteredTemplates = selectedTheme
    ? themes.find((th) => th.id === selectedTheme)?.templates || []
    : allTemplates

  const isTemplatePurchased = (templateId: string) =>
    paidTemplates?.includes(templateId) ?? false

  // Sort: current first, then free, then purchased, then unpurchased
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (currentTemplate) {
      if (a.id === currentTemplate && b.id !== currentTemplate) return -1
      if (b.id === currentTemplate && a.id !== currentTemplate) return 1
    }
    const aFree = a.effectivePrice.isFree
    const bFree = b.effectivePrice.isFree
    if (aFree && !bFree) return -1
    if (!aFree && bFree) return 1
    const aPurchased = isTemplatePurchased(a.id)
    const bPurchased = isTemplatePurchased(b.id)
    if (aPurchased && !bPurchased) return -1
    if (!aPurchased && bPurchased) return 1
    return 0
  })

  const selectedTemplate = selectedTemplateId
    ? allTemplates.find((t) => t.id === selectedTemplateId)
    : null

  const handleTemplateClick = (template: InvitationTemplate) => {
    onTemplateSelect(template.id, {
      name: template.name,
      price: template.effectivePrice.price,
      currency: template.config.pricing.currency,
      isFree: template.effectivePrice.isFree,
    })
  }

  const getThemeInfo = (themeId: string) => {
    return themes.find((th) => th.id === themeId)
  }

  const handleAction = () => {
    if (
      selectedTemplate &&
      !selectedTemplate.effectivePrice.isFree &&
      !isTemplatePurchased(selectedTemplate.id)
    ) {
      onPayRequest()
    } else {
      onSubmit()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-neutral-200 rounded-full w-16"></div>
            <div className="h-8 bg-neutral-200 rounded-full w-20"></div>
            <div className="h-8 bg-neutral-200 rounded-full w-20"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">
          {currentTemplate
            ? t('dashboard.changeTemplate')
            : t('newParty.step2Title')}
        </h3>
        <p className="text-sm text-neutral-500 mt-1">
          {t('newParty.templateStepHint')}
        </p>
      </div>

      {/* Theme filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTheme(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedTheme === null
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          {t('newParty.templateAll')}
        </button>
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedTheme === theme.id
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {theme.icon} {theme.name[locale as 'zh' | 'en'] || theme.name.en}
          </button>
        ))}
      </div>

      {/* Template grid */}
      {sortedTemplates.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          {locale === 'zh' ? '暂无模板' : 'No templates available'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {sortedTemplates.map((template) => {
            const themeInfo = getThemeInfo(template.theme)
            const isFree = template.effectivePrice.isFree
            const isSelected = selectedTemplateId === template.id
            const hasDiscount = template.effectivePrice.hasDiscount
            const isCurrent = currentTemplate === template.id
            const isPurchased = isTemplatePurchased(template.id)

            return (
              <div
                key={template.id}
                className={`relative flex flex-col border-2 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-lg ring-2 ring-primary-200'
                    : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-md'
                }`}
                onClick={() => handleTemplateClick(template)}
              >
                {/* Thumbnail */}
                <div className="aspect-[5/7] overflow-hidden bg-neutral-100 border-b relative flex items-center justify-center">
                  {template.imageUrl ? (
                    <img
                      src={template.imageUrl}
                      alt={template.name}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: template.config.backgroundColor || '#f5f5f5' }}
                    >
                      <div
                        className="w-[85%] h-[90%] rounded-lg border-4 flex items-center justify-center"
                        style={{ borderColor: template.config.borderColor || '#ccc' }}
                      >
                        <span className="text-2xl font-bold" style={{ color: template.config.borderColor || '#666' }}>
                          {template.id.includes('boy') ? '♂' : template.id.includes('girl') ? '♀' : '🎈'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Price badge */}
                  <div className="absolute top-2 left-2">
                    {isFree ? (
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {t('newParty.templateFree')}
                      </span>
                    ) : hasDiscount ? (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {template.effectivePrice.discountPercent}% OFF
                      </span>
                    ) : null}
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Card info */}
                <div className="p-2 sm:p-3">
                  <h4 className="font-semibold text-xs sm:text-sm text-neutral-900 truncate">
                    {template.name}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">
                    {themeInfo?.icon} {themeInfo?.name[locale as 'zh' | 'en'] || template.theme}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={`text-sm font-bold ${isFree ? 'text-green-600' : 'text-orange-600'}`}>
                      {(!isPurchased || isFree)
                        ? formatPrice(template.effectivePrice.price, template.config.pricing.currency, locale)
                        : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      {isCurrent && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
                          {locale === 'zh' ? '使用中' : 'In Use'}
                        </span>
                      )}
                      {isPurchased && !isFree && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          {locale === 'zh' ? '已购' : 'Owned'}
                        </span>
                      )}
                      {isSelected && !isCurrent && (
                        <span className="text-xs text-primary-600 font-medium">
                          {t('newParty.templateSelected')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50"
        >
          {currentTemplate
            ? (locale === 'zh' ? '返回' : 'Back')
            : t('newParty.backStep')}
        </button>

        <button
          type="button"
          onClick={handleAction}
          disabled={!selectedTemplateId || isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {currentTemplate
                ? (locale === 'zh' ? '更换中...' : 'Changing...')
                : t('newParty.creating')}
            </span>
          ) : currentTemplate ? (
            selectedTemplate && !selectedTemplate.effectivePrice.isFree && !isTemplatePurchased(selectedTemplate.id)
              ? (locale === 'zh' ? '支付并更换模板' : 'Pay & Change Template')
              : t('dashboard.changeTemplate')
          ) : selectedTemplate && !selectedTemplate.effectivePrice.isFree ? (
            t('newParty.payAndCreate')
          ) : (
            t('newParty.createWithTemplate')
          )}
        </button>
      </div>
    </div>
  )
}
