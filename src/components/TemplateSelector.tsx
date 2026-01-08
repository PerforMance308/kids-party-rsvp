'use client'

import { useState, useRef } from 'react'
import InvitationTemplate from './InvitationTemplates'
import { useTranslations } from '@/contexts/LanguageContext'

interface Party {
  childName: string
  childAge: number
  eventDatetime: string
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
}

type TemplateType = 'free' | 'premium1' | 'premium2' | 'premium3' | 'premium4'


export default function TemplateSelector({ party, qrCodeUrl, rsvpUrl, onTemplateSelect, partyId, currentTemplate, paidTemplates }: TemplateSelectorProps) {
  const t = useTranslations('templates')
  
  // 添加CSS样式来隐藏滚动条
  const hideScrollbarStyle = `
    .template-scroll-container::-webkit-scrollbar {
      display: none;
    }
  `
  
  const templates = [
    {
      id: 'free',
      name: t('free'),
      description: t('freeDesc'),
      price: t('price'),
      isPremium: false,
      features: ['基础样式', '二维码', '基本信息显示']
    },
    {
      id: 'premium1',
      name: t('premium1'),
      description: t('premium1Desc'),
      price: t('premiumPrice'),
      isPremium: true,
      features: ['高级渐变', '装饰元素', '毛玻璃效果', '专业排版']
    },
    {
      id: 'premium2',
      name: t('premium2'),
      description: t('premium2Desc'),
      price: t('premiumPrice'),
      isPremium: true,
      features: ['动态表情', '彩色卡片', '3D效果', '可爱装饰']
    },
    {
      id: 'premium3',
      name: t('premium3'),
      description: t('premium3Desc'),
      price: t('premiumPrice'),
      isPremium: true,
      features: ['几何元素', '极简风格', '专业字体', '高端质感']
    },
    {
      id: 'premium4',
      name: t('premium4'),
      description: t('premium4Desc'),
      price: t('premiumPrice'),
      isPremium: true,
      features: ['动画效果', '节日元素', '丰富色彩', '互动设计']
    }
  ]
  
  const [showPayment, setShowPayment] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 检查某个模板是否已购买
  const isTemplatePurchased = (templateId: string) => {
    return paidTemplates.includes(templateId)
  }

  const handleTemplateClick = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)

    // 如果是付费模板且未购买，显示支付弹窗
    if (template?.isPremium && !isTemplatePurchased(templateId)) {
      setSelectedTemplate(templateId)
      setShowPayment(true)
      return
    }

    onTemplateSelect(templateId)
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      // 滚动一个模板的宽度（包括gap）
      // 容器宽度 - 左右padding(48px) - 2个gap(48px) = 内容宽度，除以3得到每个模板宽度，加上gap得到滚动距离
      const containerWidth = scrollContainerRef.current.clientWidth
      const scrollDistance = (containerWidth - 48 - 48) / 3 + 24
      scrollContainerRef.current.scrollBy({ left: -scrollDistance, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      // 滚动一个模板的宽度（包括gap）
      const containerWidth = scrollContainerRef.current.clientWidth
      const scrollDistance = (containerWidth - 48 - 48) / 3 + 24
      scrollContainerRef.current.scrollBy({ left: scrollDistance, behavior: 'smooth' })
    }
  }

  const handlePayment = async () => {
    try {
      const response = await fetch(`/api/parties/${partyId}/upgrade-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`🎉 支付成功！\n\n您已成功购买"${templates.find(t => t.id === selectedTemplate)?.name}"模板，现在可以使用了！`)
        setShowPayment(false)
        // 选择模板
        onTemplateSelect(selectedTemplate)
        // 刷新页面以更新party状态
        window.location.reload()
      } else {
        alert('支付失败，请重试')
      }
    } catch (error) {
      alert('支付过程中出现错误，请重试')
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyle }} />
      <div className="space-y-6">
      {/* 模板画廊 */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-900">{t('title')}</h3>
          <div className="text-sm text-neutral-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            {t('scrollHint')}
          </div>
        </div>
        
        <div className="relative">
          {/* 左侧滚动按钮 */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg border border-neutral-200 rounded-full p-2 transition-all hover:scale-110"
            aria-label="向左滚动"
          >
            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 右侧滚动按钮 */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg border border-neutral-200 rounded-full p-2 transition-all hover:scale-110"
            aria-label="向右滚动"
          >
            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div 
            ref={scrollContainerRef}
            className="template-scroll-container flex overflow-x-auto gap-6 pb-4 px-6 snap-x snap-mandatory"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
          >
          {templates.map((template) => (
            <div
              key={template.id}
              className={`relative group border-2 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden flex-shrink-0 snap-center w-[280px] sm:w-[calc((100%-48px)/2)] lg:w-[calc((100%-96px)/3)] ${
                currentTemplate === template.id
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : template.isPremium && !isTemplatePurchased(template.id)
                  ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 hover:border-orange-300 hover:shadow-lg'
                  : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-lg'
              }`}
              onClick={() => handleTemplateClick(template.id)}
            >
              {/* Premium 标签 */}
              {template.isPremium && (
                <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-md z-10">
                  PREMIUM
                </div>
              )}
              
              {/* 模板预览 */}
              <div className="aspect-[3/2] overflow-hidden bg-neutral-100 border-b relative">
                <div className="scale-[0.6] origin-top-left w-[167%] h-[167%]">
                  <InvitationTemplate
                    party={{
                      childName: "小明",
                      childAge: 6,
                      eventDatetime: party.eventDatetime,
                      location: "示例地址",
                      theme: "示例主题"
                    }}
                    qrCodeUrl="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Crect x='10' y='10' width='15' height='15' fill='black'/%3E%3Crect x='75' y='10' width='15' height='15' fill='black'/%3E%3Crect x='10' y='75' width='15' height='15' fill='black'/%3E%3Crect x='30' y='20' width='5' height='5' fill='black'/%3E%3Crect x='40' y='30' width='5' height='5' fill='black'/%3E%3Crect x='50' y='40' width='5' height='5' fill='black'/%3E%3Crect x='60' y='50' width='5' height='5' fill='black'/%3E%3Crect x='70' y='60' width='5' height='5' fill='black'/%3E%3Crect x='20' y='60' width='5' height='5' fill='black'/%3E%3Crect x='60' y='20' width='5' height='5' fill='black'/%3E%3C/svg%3E"
                    rsvpUrl="/rsvp/demo"
                    template={template.id as TemplateType}
                  />
                </div>
              </div>

              {/* 模板信息 */}
              <div className="p-4">
                <div className="text-center mb-3">
                  <h4 className="font-bold text-lg text-neutral-900 mb-1">{template.name}</h4>
                  <p className="text-sm text-neutral-600 mb-2">{template.description}</p>
                  
                  <div className="flex justify-center items-center mb-3">
                    <span className={`text-xl font-bold ${
                      template.isPremium ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {template.price}
                    </span>
                    {template.isPremium && !isTemplatePurchased(template.id) && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                        {t('needsPurchase')}
                      </span>
                    )}
                    {currentTemplate === template.id && (
                      <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                        {t('currentlyUsing')}
                      </span>
                    )}
                  </div>

                  {/* 功能特性 */}
                  <div className="flex flex-wrap justify-center gap-1">
                    {template.features.map((feature, index) => (
                      <span key={index} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 选择按钮 */}
                <button
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    currentTemplate === template.id
                      ? 'bg-green-600 text-white'
                      : template.isPremium && !isTemplatePurchased(template.id)
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTemplateClick(template.id)
                  }}
                  disabled={currentTemplate === template.id}
                >
                  {currentTemplate === template.id 
                    ? t('currentlyUsing') 
                    : template.isPremium && !isTemplatePurchased(template.id) 
                    ? t('purchaseUse') 
                    : t('selectTemplate')}
                </button>
              </div>

              {/* 锁定遮罩 */}
              {template.isPremium && !isTemplatePurchased(template.id) && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/10 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 rounded-full p-3 shadow-lg">
                    <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        </div>

      </div>

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-center text-neutral-900 mb-4">🎉 {t('purchaseTitle')}</h3>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">
                  {templates.find(t => t.id === selectedTemplate)?.name}
                </h4>
                <p className="text-sm text-orange-700 mb-2">
                  {templates.find(t => t.id === selectedTemplate)?.description}
                </p>
                <ul className="text-sm text-orange-700 space-y-1">
                  {templates.find(t => t.id === selectedTemplate)?.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">¥9.9</div>
                <p className="text-sm text-neutral-600">为此聚会购买这个模板</p>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={handlePayment}
                  className="w-full btn btn-primary"
                >
                  {t('payNow')}
                </button>
                <button
                  onClick={() => setShowPayment(false)}
                  className="w-full btn btn-secondary"
                >
                  {t('payLater')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}