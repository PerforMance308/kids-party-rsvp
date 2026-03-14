'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { detectPreferredCurrency } from '@/lib/currency'
import type {
  Theme,
  InvitationTemplate,
  TemplatesApiResponse,
  SupportedCurrency,
} from '@/types/invitation-template'
import { formatPrice, getEffectivePrice } from '@/types/invitation-template'

interface TemplateMeta {
  name: string
  price: number
  currency: string
  isFree: boolean
}

interface PartyTemplateStepProps {
  onTemplateSelect: (templateId: string, templateMeta: TemplateMeta) => void
  selectedTemplateId: string | null
  currentTemplate?: string
  paidTemplates?: string[]
}

export default function PartyTemplateStep({
  onTemplateSelect,
  selectedTemplateId,
  currentTemplate,
  paidTemplates,
}: PartyTemplateStepProps) {
  const { locale, t } = useLanguage()

  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrency>('USD')

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

  useEffect(() => {
    setPreferredCurrency(detectPreferredCurrency(locale))
  }, [locale])

  const allTemplates = themes.flatMap((theme) => theme.templates)

  const filteredTemplates = selectedTheme
    ? themes.find((th) => th.id === selectedTheme)?.templates || []
    : allTemplates

  const isTemplatePurchased = (templateId: string) =>
    paidTemplates?.includes(templateId) ?? false

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

  const handleTemplateClick = (template: InvitationTemplate) => {
    const effectivePrice = getEffectivePrice(template.config.pricing, preferredCurrency)
    onTemplateSelect(template.id, {
      name: template.name,
      price: effectivePrice.price,
      currency: effectivePrice.currency,
      isFree: effectivePrice.isFree,
    })
  }

  const getThemeInfo = (themeId: string) => {
    return themes.find((th) => th.id === themeId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/3 rounded bg-neutral-200"></div>
          <div className="flex gap-2">
            <div className="h-8 w-16 rounded-full bg-neutral-200"></div>
            <div className="h-8 w-20 rounded-full bg-neutral-200"></div>
            <div className="h-8 w-20 rounded-full bg-neutral-200"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-neutral-200"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">
          {currentTemplate ? t('dashboard.changeTemplate') : t('newParty.step2Title')}
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          {t('newParty.templateStepHint')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTheme(null)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
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
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedTheme === theme.id
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {theme.icon} {theme.name[locale as 'zh' | 'en'] || theme.name.en}
          </button>
        ))}
      </div>

      {sortedTemplates.length === 0 ? (
        <div className="py-8 text-center text-neutral-500">
          {locale === 'zh' ? '暂无模板' : 'No templates available'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {sortedTemplates.map((template) => {
            const effectivePrice = getEffectivePrice(template.config.pricing, preferredCurrency)
            const themeInfo = getThemeInfo(template.theme)
            const isFree = effectivePrice.isFree
            const isSelected = selectedTemplateId === template.id
            const hasDiscount = effectivePrice.hasDiscount
            const isCurrent = currentTemplate === template.id
            const isPurchased = isTemplatePurchased(template.id)

            return (
              <div
                key={template.id}
                className={`relative flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-lg ring-2 ring-primary-200'
                    : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-md'
                }`}
                onClick={() => handleTemplateClick(template)}
              >
                <div className="relative flex aspect-[5/7] items-center justify-center overflow-hidden border-b bg-neutral-100">
                  {template.imageUrl ? (
                    <img
                      src={template.imageUrl}
                      alt={template.name}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ backgroundColor: template.config.backgroundColor || '#f5f5f5' }}
                    >
                      <div
                        className="flex h-[90%] w-[85%] items-center justify-center rounded-lg border-4"
                        style={{ borderColor: template.config.borderColor || '#ccc' }}
                      >
                        <span
                          className="text-2xl font-bold"
                          style={{ color: template.config.borderColor || '#666' }}
                        >
                          {template.id.includes('boy') ? 'B' : template.id.includes('girl') ? 'G' : 'P'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="absolute left-2 top-2">
                    {isFree ? (
                      <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                        {t('newParty.templateFree')}
                      </span>
                    ) : hasDiscount ? (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        {effectivePrice.discountPercent}% OFF
                      </span>
                    ) : null}
                  </div>

                  {isSelected && (
                    <div className="absolute right-2 top-2 rounded-full bg-primary-600 p-1 text-white">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-2 sm:p-3">
                  <h4 className="truncate text-xs font-semibold text-neutral-900 sm:text-sm">
                    {template.name}
                  </h4>
                  <p className="mt-0.5 hidden text-xs text-neutral-500 sm:block">
                    {themeInfo?.icon} {themeInfo?.name[locale as 'zh' | 'en'] || template.theme}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className={`text-sm font-bold ${isFree ? 'text-green-600' : 'text-orange-600'}`}>
                      {!isPurchased || isFree
                        ? formatPrice(effectivePrice.price, effectivePrice.currency, locale)
                        : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      {isCurrent && (
                        <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs text-primary-700">
                          {locale === 'zh' ? '使用中' : 'In Use'}
                        </span>
                      )}
                      {isPurchased && !isFree && (
                        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                          {locale === 'zh' ? '已购' : 'Owned'}
                        </span>
                      )}
                      {isSelected && !isCurrent && (
                        <span className="text-xs font-medium text-primary-600">
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
    </div>
  )
}
