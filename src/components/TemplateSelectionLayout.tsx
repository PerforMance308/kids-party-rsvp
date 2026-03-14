'use client'

import { useEffect, useState } from 'react'
import InvitationTemplate from '@/components/InvitationTemplates'
import PartyTemplateStep from '@/components/PartyTemplateStep'

interface TemplateMeta {
  name: string
  price: number
  currency: string
  isFree: boolean
}

interface PreviewParty {
  childName: string
  childAge: number
  eventDatetime: string
  eventEndDatetime?: string
  location: string
  theme?: string
  notes?: string
}

interface TemplateSelectionLayoutProps {
  locale: string
  selectedTemplateId: string | null
  previewParty: PreviewParty
  qrCodeUrl?: string
  rsvpUrl?: string
  onTemplateSelect: (templateId: string, templateMeta: TemplateMeta) => void
  onBack?: () => void
  onSubmit?: () => void
  onPayRequest?: () => void
  isSubmitting?: boolean
  currentTemplate?: string
  paidTemplates?: string[]
  mobileSpacerSelectedClass?: string
  mobileSpacerEmptyClass?: string
  showPreviewCard?: boolean
  showGridCard?: boolean
}

export default function TemplateSelectionLayout({
  locale,
  selectedTemplateId,
  previewParty,
  qrCodeUrl,
  rsvpUrl,
  onTemplateSelect,
  onBack,
  onSubmit,
  onPayRequest,
  isSubmitting,
  currentTemplate,
  paidTemplates,
  mobileSpacerSelectedClass = 'h-[255px]',
  mobileSpacerEmptyClass = 'h-[120px]',
  showPreviewCard = true,
  showGridCard = true,
}: TemplateSelectionLayoutProps) {
  const [isFooterVisible, setIsFooterVisible] = useState(false)

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsFooterVisible(entry.isIntersecting)
      },
      {
        // Delay hiding until footer is much closer to overlap on mobile.
        threshold: 0.4,
        rootMargin: '0px 0px -96px 0px',
      }
    )

    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex flex-col lg:flex-row gap-2 lg:gap-6 lg:h-[calc(100vh-6rem)]">
      {/* Left on desktop / Top on mobile: Live preview */}
      <div className={`${isFooterVisible ? 'hidden' : 'fixed top-14 left-0 right-0 z-30 px-4'} lg:static lg:block lg:px-0 lg:w-[400px] xl:w-[440px] flex-shrink-0 lg:overflow-y-auto lg:h-full`}>
        <div className={showPreviewCard ? 'card rounded-2xl' : 'rounded-2xl'}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base lg:text-lg font-semibold text-neutral-900">
              {locale === 'zh' ? '实时预览' : 'Live Preview'}
            </h3>
            {!selectedTemplateId && (
              <span className="lg:hidden text-xs text-neutral-400">
                {locale === 'zh' ? '下方选择模板' : 'Choose below'}
              </span>
            )}
          </div>

          {selectedTemplateId ? (
            <div className="max-w-[160px] mx-auto lg:max-w-none">
              <InvitationTemplate
                key={selectedTemplateId}
                party={previewParty}
                qrCodeUrl={qrCodeUrl}
                rsvpUrl={rsvpUrl}
                template={selectedTemplateId}
                showControls={false}
                isCollapsible={false}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 lg:h-48 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
              <p className="text-sm text-neutral-400">
                {locale === 'zh'
                  ? '请在下方选择模板查看预览'
                  : 'Select a template below to preview'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Spacer for fixed mobile preview */}
      <div className={`lg:hidden ${isFooterVisible ? 'h-0' : (selectedTemplateId ? mobileSpacerSelectedClass : mobileSpacerEmptyClass)}`} />

      {/* Right on desktop / Bottom on mobile: Template grid */}
      <div className="flex-1 min-w-0 lg:overflow-y-auto lg:h-full">
        <div className={showGridCard ? 'card' : ''}>
          <PartyTemplateStep
            onTemplateSelect={onTemplateSelect}
            selectedTemplateId={selectedTemplateId}
            currentTemplate={currentTemplate}
            paidTemplates={paidTemplates}
          />
        </div>
      </div>
    </div>
  )
}
