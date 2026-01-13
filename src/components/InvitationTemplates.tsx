'use client'

import { useRef, useState, useEffect } from 'react'
import { useLocale } from '@/contexts/LanguageContext'
import CanvasInvitation from './CanvasInvitation'
import type { InvitationTemplate, TemplatesApiResponse } from '@/types/invitation-template'

interface Party {
  childName: string
  childAge: number
  eventDatetime: string
  location: string
  theme?: string
  notes?: string
}

interface InvitationTemplateProps {
  party: Party
  qrCodeUrl?: string
  rsvpUrl?: string
  template: string
  showControls?: boolean
  isCollapsible?: boolean
}

const translations = {
  en: {
    collapse: 'Collapse',
    expand: 'Expand',
    clickToExpand: 'Click to expand invitation',
    birthdayInvitation: "'s Birthday Invitation",
    loadingTemplate: 'Loading template...',
    templateNotFound: 'Template not found',
  },
  zh: {
    collapse: '折叠',
    expand: '展开',
    clickToExpand: '点击展开查看完整邀请卡',
    birthdayInvitation: '的生日邀请卡',
    loadingTemplate: '加载模板中...',
    templateNotFound: '模板未找到',
  }
}

export default function InvitationTemplate({
  party,
  qrCodeUrl,
  rsvpUrl,
  template,
  showControls = false,
  isCollapsible = false,
}: InvitationTemplateProps) {
  const [isExpanded, setIsExpanded] = useState(!isCollapsible)
  const [dynamicTemplate, setDynamicTemplate] = useState<InvitationTemplate | null>(null)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const locale = useLocale()
  const t = translations[locale as keyof typeof translations] || translations.en

  // 加载动态模板配置
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!template) {
        setIsLoadingTemplate(false)
        setError(t.templateNotFound)
        return
      }

      setIsLoadingTemplate(true)
      setError(null)

      try {
        // 从模板ID解析主题名（格式为 theme_number，如 dinosaur_1）
        const themeName = template.split('_').slice(0, -1).join('_') || template.split('_')[0]

        const response = await fetch('/api/templates')
        if (!response.ok) {
          throw new Error('Failed to fetch templates')
        }

        const data: TemplatesApiResponse = await response.json()

        // 在所有主题中查找模板
        let found: InvitationTemplate | null = null
        for (const themeData of data.themes) {
          const templateData = themeData.templates.find((t) => t.id === template)
          if (templateData) {
            found = templateData
            break
          }
        }

        if (found) {
          setDynamicTemplate(found)
        } else {
          setError(t.templateNotFound)
        }
      } catch (err) {
        console.error('Failed to load template:', err)
        setError(t.templateNotFound)
      } finally {
        setIsLoadingTemplate(false)
      }
    }

    fetchTemplate()
  }, [template, t.templateNotFound])

  // 渲染内容
  const renderContent = () => {
    if (isLoadingTemplate) {
      return (
        <div className="flex items-center justify-center h-64 bg-neutral-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-neutral-600 text-sm">{t.loadingTemplate}</p>
          </div>
        </div>
      )
    }

    if (error || !dynamicTemplate) {
      return (
        <div className="flex items-center justify-center h-64 bg-neutral-100 rounded-lg">
          <div className="text-center">
            <svg className="w-12 h-12 text-neutral-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-neutral-600 text-sm">{error || t.templateNotFound}</p>
          </div>
        </div>
      )
    }

    return (
      <CanvasInvitation
        template={dynamicTemplate}
        party={party}
        qrCodeUrl={qrCodeUrl}
        showControls={showControls}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* 折叠/展开按钮 */}
      {isCollapsible && showControls && (
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            {isExpanded ? t.collapse : t.expand}
          </button>
        </div>
      )}

      {/* 邀请函内容 */}
      {isExpanded && renderContent()}

      {/* 折叠预览 */}
      {!isExpanded && isCollapsible && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => setIsExpanded(true)}
        >
          <div className="text-gray-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">{party.childName}{t.birthdayInvitation}</p>
          <p className="text-xs text-gray-500">{t.clickToExpand}</p>
        </div>
      )}
    </div>
  )
}
