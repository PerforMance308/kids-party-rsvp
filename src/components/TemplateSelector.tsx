'use client'

import { useState, useRef } from 'react'
import InvitationTemplate from './InvitationTemplates'
import { useTranslations, useLocale } from '@/contexts/LanguageContext'
import PaymentForm from './PaymentForm'
import { toast } from '@/lib/toast'

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
  onPaymentSuccess?: () => void  // 支付成功后的回调，用于刷新数据
}

type TemplateType = 'free' | 'premium1' | 'premium2' | 'premium3' | 'premium4'


export default function TemplateSelector({ party, qrCodeUrl, rsvpUrl, onTemplateSelect, partyId, currentTemplate, paidTemplates, onPaymentSuccess }: TemplateSelectorProps) {
  const t = useTranslations('templates')
  const locale = useLocale()
  
  // 添加CSS样式来隐藏滚动条
  const hideScrollbarStyle = `
    .template-scroll-container::-webkit-scrollbar {
      display: none;
    }
  `
  
  const featureTranslations = {
    en: {
      free: ['Basic style', 'QR code', 'Basic info display'],
      premium1: ['Premium gradient', 'Decorations', 'Glassmorphism', 'Pro layout'],
      premium2: ['Emojis', 'Colorful cards', '3D effects', 'Cute decor'],
      premium3: ['Geometric', 'Minimal style', 'Pro fonts', 'Premium feel'],
      premium4: ['Animations', 'Festive', 'Rich colors', 'Interactive']
    },
    zh: {
      free: ['基础样式', '二维码', '基本信息显示'],
      premium1: ['高级渐变', '装饰元素', '毛玻璃效果', '专业排版'],
      premium2: ['动态表情', '彩色卡片', '3D效果', '可爱装饰'],
      premium3: ['几何元素', '极简风格', '专业字体', '高端质感'],
      premium4: ['动画效果', '节日元素', '丰富色彩', '互动设计']
    }
  }

  const features = featureTranslations[locale as keyof typeof featureTranslations] || featureTranslations.en

  const templates = [
    {
      id: 'free',
      name: t('free'),
      description: t('freeDesc'),
      price: t('price'),
      isPremium: false,
      features: features.free
    },
    {
      id: 'premium1',
      name: t('premium1'),
      description: t('premium1Desc'),
      price: t('premiumPrice'),
      isPremium: true,
      features: features.premium1
    },
    {
      id: 'premium2',
      name: t('premium2'),
      description: t('premium2Desc'),
      price: t('premiumPrice'),
      isPremium: true,
      features: features.premium2
    },
    {
      id: 'premium3',
      name: t('premium3'),
      description: t('premium3Desc'),
      price: t('premiumPrice'),
      isPremium: true,
      features: features.premium3
    },
    {
      id: 'premium4',
      name: t('premium4'),
      description: t('premium4Desc'),
      price: t('premiumPrice'),
      isPremium: true,
      features: features.premium4
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

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      // 支付成功后，调用 API 启用模板
      const response = await fetch(`/api/parties/${partyId}/upgrade-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          paymentId: paymentId
        })
      })

      if (response.ok) {
        setShowPayment(false)

        // 显示成功提示
        toast.success(
          locale === 'zh' ? '付款成功！' : 'Payment Successful!',
          locale === 'zh' ? '模板已解锁，正在应用...' : 'Template unlocked, applying...'
        )

        // 选择模板
        onTemplateSelect(selectedTemplate)

        // 调用父组件的刷新回调，而不是刷新整个页面
        if (onPaymentSuccess) {
          onPaymentSuccess()
        }
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
        locale === 'zh' ? '支付验证过程中出现错误，请重试' : 'An error occurred during payment verification. Please try again.'
      )
    }
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    // 错误信息已经在 PaymentForm 中显示，这里不需要额外处理
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
          {/* Left scroll button */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg border border-neutral-200 rounded-full p-2 transition-all hover:scale-110"
            aria-label={locale === 'zh' ? '向左滚动' : 'Scroll left'}
          >
            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right scroll button */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg border border-neutral-200 rounded-full p-2 transition-all hover:scale-110"
            aria-label={locale === 'zh' ? '向右滚动' : 'Scroll right'}
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
              
              {/* Template preview */}
              <div className="aspect-[3/2] overflow-hidden bg-neutral-100 border-b relative">
                <div className="scale-[0.6] origin-top-left w-[167%] h-[167%]">
                  <InvitationTemplate
                    party={{
                      childName: locale === 'zh' ? "小明" : "Emma",
                      childAge: 6,
                      eventDatetime: party.eventDatetime,
                      location: locale === 'zh' ? "示例地址" : "Sample Location",
                      theme: locale === 'zh' ? "示例主题" : "Sample Theme"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl my-8">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-center text-neutral-900 mb-4">🎉 {t('purchaseTitle')}</h3>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg mb-4">
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
            </div>
            
            <PaymentForm
              amount={1.39} // $1.39 ≈ ¥9.9 (根据当前汇率)
              currency="USD"
              description={`Premium template: ${templates.find(t => t.id === selectedTemplate)?.name}`}
              metadata={{
                partyId,
                feature: 'template',
                templateId: selectedTemplate,
                templateName: templates.find(t => t.id === selectedTemplate)?.name || '',
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