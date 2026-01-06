'use client'

import { useState } from 'react'
import InvitationTemplate from './InvitationTemplates'

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
  templatePaid: boolean
}

type TemplateType = 'free' | 'premium1' | 'premium2' | 'premium3' | 'premium4'

const templates = [
  {
    id: 'free',
    name: '基础版',
    description: '简单清洁的设计',
    price: '免费',
    isPremium: false,
    features: ['基础样式', '二维码', '基本信息显示']
  },
  {
    id: 'premium1',
    name: '优雅花卉',
    description: '专业渐变背景，优雅设计',
    price: '¥9.9',
    isPremium: true,
    features: ['高级渐变', '装饰元素', '毛玻璃效果', '专业排版']
  },
  {
    id: 'premium2',
    name: '可爱卡通',
    description: '充满童趣的卡通风格',
    price: '¥9.9',
    isPremium: true,
    features: ['动态表情', '彩色卡片', '3D效果', '可爱装饰']
  },
  {
    id: 'premium3',
    name: '简约现代',
    description: '极简主义，现代感设计',
    price: '¥9.9',
    isPremium: true,
    features: ['几何元素', '极简风格', '专业字体', '高端质感']
  },
  {
    id: 'premium4',
    name: '节日庆典',
    description: '充满节日气息的动感设计',
    price: '¥9.9',
    isPremium: true,
    features: ['动画效果', '节日元素', '丰富色彩', '互动设计']
  }
]

export default function TemplateSelector({ party, qrCodeUrl, rsvpUrl, onTemplateSelect, partyId, currentTemplate, templatePaid }: TemplateSelectorProps) {
  const [showPayment, setShowPayment] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const handleTemplateClick = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    
    if (template?.isPremium && !templatePaid) {
      setSelectedTemplate(templateId)
      setShowPayment(true)
      return
    }
    
    onTemplateSelect(templateId)
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
    <div className="space-y-6">
      {/* 模板画廊 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-neutral-900 mb-6">选择邀请卡样式</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`relative group border-2 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden ${
                currentTemplate === template.id
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : template.isPremium && !templatePaid 
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
                    {template.isPremium && !templatePaid && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                        需要购买
                      </span>
                    )}
                    {currentTemplate === template.id && (
                      <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                        当前使用
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
                      : template.isPremium && !templatePaid
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
                    ? '当前使用中' 
                    : template.isPremium && !templatePaid 
                    ? '购买使用 ¥9.9' 
                    : '选择此模板'}
                </button>
              </div>

              {/* 锁定遮罩 */}
              {template.isPremium && !templatePaid && (
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

        {/* 付费模板介绍 */}
        {!templatePaid && (
          <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 border border-orange-200 rounded-xl">
            <div className="text-center">
              <div className="text-orange-500 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-orange-800 mb-2">购买精美付费模板</h4>
              <p className="text-orange-700 mb-4 max-w-md mx-auto">
                为这个派对购买专业设计的邀请卡模板，让邀请更加精美特别！每个模板仅需¥9.9
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-4 text-sm">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="font-bold text-orange-600">按需购买</div>
                  <div className="text-orange-700">¥9.9 / 模板</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="font-bold text-orange-600">专业设计</div>
                  <div className="text-orange-700">4款精美样式</div>
                </div>
              </div>
              <p className="text-sm text-orange-600">
                点击上方付费模板的"购买使用"按钮即可购买使用
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-center text-neutral-900 mb-4">🎉 购买付费模板</h3>
            
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
                  立即支付
                </button>
                <button
                  onClick={() => setShowPayment(false)}
                  className="w-full btn btn-secondary"
                >
                  稍后再说
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}