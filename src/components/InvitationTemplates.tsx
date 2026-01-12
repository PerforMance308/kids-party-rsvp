'use client'

import { useRef, useState } from 'react'
import { formatDate } from '@/lib/utils'
import { useLocale } from '@/contexts/LanguageContext'

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
  template: 'free' | 'premium1' | 'premium2' | 'premium3' | 'premium4'
  showControls?: boolean
  isCollapsible?: boolean
}

// 翻译文本
const translations = {
  en: {
    // 控制按钮
    print: 'Print',
    download: 'Download',
    collapse: 'Collapse',
    expand: 'Expand',
    clickToExpand: 'Click to expand invitation',
    birthdayInvitation: "'s Birthday Invitation",
    downloadFailed: 'Download failed, please try print instead',

    // 模板通用文字
    youreInvited: "You're Invited!",
    when: 'When:',
    where: 'Where:',
    note: 'Note:',
    pleaseRsvp: 'Please RSVP',
    scanQr: 'Scan QR code →',

    // Premium1
    specialInvitation: 'Special Invitation',
    birthday: 'Birthday',
    theme: 'Theme',
    rsvpRequired: 'RSVP Required',
    scanToRespond: 'Scan to respond →',

    // Premium2
    birthdayParty: 'Birthday Party',
    turning: 'Turning',
    scanTheCode: 'Scan the code →',

    // Premium3
    birthdayInvitationTitle: 'BIRTHDAY INVITATION',
    turns: 'turns',
    dateTime: 'DATE & TIME',
    location: 'LOCATION',
    rsvp: 'RSVP',

    // Premium4
    letsCelebrate: "LET'S CELEBRATE!",
    isTurning: 'is turning',
    rsvpNow: 'RSVP NOW!',
    scanAndJoin: 'Scan & Join!',
  },
  zh: {
    // 控制按钮
    print: '打印',
    download: '下载',
    collapse: '折叠',
    expand: '展开',
    clickToExpand: '点击展开查看完整邀请卡',
    birthdayInvitation: '的生日邀请卡',
    downloadFailed: '下载失败，请尝试使用打印功能',

    // 模板通用文字
    youreInvited: '诚挚邀请您！',
    when: '时间：',
    where: '地点：',
    note: '备注：',
    pleaseRsvp: '请回复',
    scanQr: '扫码回复 →',

    // Premium1
    specialInvitation: '特别邀请',
    birthday: '岁生日',
    theme: '主题',
    rsvpRequired: '请回复出席',
    scanToRespond: '扫码回复 →',

    // Premium2
    birthdayParty: '生日派对',
    turning: '即将',
    scanTheCode: '扫码回复 →',

    // Premium3
    birthdayInvitationTitle: '生日邀请函',
    turns: '即将',
    dateTime: '日期时间',
    location: '地点',
    rsvp: '回复',

    // Premium4
    letsCelebrate: '一起庆祝吧！',
    isTurning: '即将满',
    rsvpNow: '立即回复！',
    scanAndJoin: '扫码参加！',
  }
}

export default function InvitationTemplate({ party, qrCodeUrl, rsvpUrl, template, showControls = false, isCollapsible = false }: InvitationTemplateProps) {
  const [isExpanded, setIsExpanded] = useState(!isCollapsible)
  const invitationRef = useRef<HTMLDivElement>(null)
  const locale = useLocale()
  const t = translations[locale as keyof typeof translations] || translations.en

  const baseProps = {
    party,
    qrCodeUrl,
    rsvpUrl,
    locale,
    t
  }

  const handlePrint = () => {
    if (invitationRef.current) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const content = invitationRef.current.outerHTML
        const title = locale === 'zh'
          ? `邀请卡 - ${party.childName}的生日派对`
          : `Invitation - ${party.childName}'s Birthday Party`
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  body { margin: 0; padding: 20px; }
                  .invitation-card {
                    width: 6in !important;
                    height: 4in !important;
                    max-width: none !important;
                    page-break-inside: avoid;
                  }
                }
                body { font-family: system-ui, -apple-system, sans-serif; }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleDownload = async () => {
    if (invitationRef.current) {
      try {
        const html2canvas = (await import('html2canvas')).default

        const canvas = await html2canvas(invitationRef.current, {
          useCORS: true,
          allowTaint: true
        })

        const link = document.createElement('a')
        link.download = `${party.childName}-birthday-invitation.png`
        link.href = canvas.toDataURL()
        link.click()
      } catch (error) {
        console.error('Download failed:', error)
        alert(t.downloadFailed)
      }
    }
  }

  const templateComponent = (() => {
    switch (template) {
      case 'free':
        return <FreeTemplate {...baseProps} />
      case 'premium1':
        return <PremiumTemplate1 {...baseProps} />
      case 'premium2':
        return <PremiumTemplate2 {...baseProps} />
      case 'premium3':
        return <PremiumTemplate3 {...baseProps} />
      case 'premium4':
        return <PremiumTemplate4 {...baseProps} />
      default:
        return <FreeTemplate {...baseProps} />
    }
  })()

  return (
    <div className="space-y-4">
      {/* Control buttons */}
      {showControls && (
        <div className="flex flex-wrap gap-2 print:hidden">
          {isCollapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              {isExpanded ? t.collapse : t.expand}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            🖨️ {t.print}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
          >
            📥 {t.download}
          </button>
        </div>
      )}

      {/* Invitation content */}
      {isExpanded && (
        <div ref={invitationRef}>
          {templateComponent}
        </div>
      )}

      {/* Collapsed preview */}
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

// Template props type
interface TemplateProps {
  party: Party
  qrCodeUrl?: string
  rsvpUrl?: string
  locale: string
  t: typeof translations.en
}

// Free template
function FreeTemplate({ party, qrCodeUrl, locale, t }: TemplateProps) {
  return (
    <div
      className="invitation-card border border-amber-800 rounded-lg shadow-lg overflow-hidden relative mx-auto w-full"
      style={{
        aspectRatio: '3/2',
        background: 'linear-gradient(135deg, #FFE5F1 0%, #FFCCCB 30%, #FFE4B5 100%)',
        maxWidth: '100%',
        fontSize: 'clamp(0.75rem, 2.5vw, 1rem)'
      }}
    >
      <div className="absolute inset-0 p-4 flex flex-col justify-between text-amber-900">
        <div className="text-center">
          <h1 className="text-lg font-bold mb-2">🎉 {t.youreInvited} 🎉</h1>
          <h2 className="text-base font-semibold">
            {locale === 'zh'
              ? `${party.childName}的${party.childAge}岁生日派对`
              : `${party.childName}'s ${party.childAge}th Birthday Party`}
          </h2>
          {party.theme && <p className="text-sm mt-1">{party.theme} {locale === 'zh' ? '主题' : 'Theme'}</p>}
        </div>

        <div className="text-sm space-y-1">
          <p><strong>{t.when}</strong> {formatDate(new Date(party.eventDatetime), locale)}</p>
          <p><strong>{t.where}</strong> {party.location}</p>
          {party.notes && <p><strong>{t.note}</strong> {party.notes}</p>}
        </div>

        <div className="flex justify-between items-end">
          <div className="text-xs">
            <p>{t.pleaseRsvp}</p>
            <p>{t.scanQr}</p>
          </div>
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="RSVP QR Code"
              className="w-14 h-14 sm:w-16 sm:h-16 border border-amber-700 rounded"
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Premium Template 1 - Elegant
function PremiumTemplate1({ party, qrCodeUrl, locale, t }: TemplateProps) {
  return (
    <div
      className="invitation-card relative mx-auto w-full overflow-hidden rounded-2xl shadow-2xl"
      style={{
        aspectRatio: '3/2',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        maxWidth: '100%',
      }}
    >
      {/* Decorative background */}
      <div className="absolute inset-0">
        <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/15 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-white/10 rounded-full"></div>
      </div>

      <div className="relative h-full p-3 sm:p-4 flex flex-col justify-between text-white">
        {/* Header */}
        <div className="text-center">
          <div className="inline-block px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm mb-1">
            <h1 className="text-sm sm:text-base font-bold">✨ {t.specialInvitation} ✨</h1>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-1">
            {locale === 'zh'
              ? `${party.childName}的${party.childAge}${t.birthday}`
              : `${party.childName}'s ${party.childAge}th ${t.birthday}`}
          </h2>
          {party.theme && (
            <div className="inline-block px-2 py-0.5 bg-white/20 rounded-full">
              <p className="text-xs font-medium">{party.theme} {locale === 'zh' ? '主题' : 'Theme'}</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="bg-white/20 rounded-xl p-2 sm:p-3 backdrop-blur-sm">
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="flex items-center">
              <span className="text-sm mr-1">📅</span>
              <span>{formatDate(new Date(party.eventDatetime), locale)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm mr-1">📍</span>
              <span>{party.location}</span>
            </div>
            {party.notes && (
              <div className="flex items-start">
                <span className="text-sm mr-1">💌</span>
                <span className="flex-1 line-clamp-2">{party.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <div className="text-xs">
            <p className="font-semibold">{t.rsvpRequired}</p>
            <p className="text-white/80">{t.scanToRespond}</p>
          </div>
          {qrCodeUrl && (
            <div className="p-1 bg-white rounded-lg shadow-lg">
              <img
                src={qrCodeUrl}
                alt="RSVP QR Code"
                className="w-12 h-12 sm:w-14 sm:h-14"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Premium Template 2 - Cute Cartoon
function PremiumTemplate2({ party, qrCodeUrl, locale, t }: TemplateProps) {
  return (
    <div
      className="invitation-card relative mx-auto w-full overflow-hidden rounded-3xl shadow-2xl"
      style={{
        aspectRatio: '3/2',
        background: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
        maxWidth: '100%',
      }}
    >
      {/* Cute decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-2 left-4 text-2xl">🎈</div>
        <div className="absolute top-4 right-8 text-xl">🎂</div>
        <div className="absolute bottom-6 left-2 text-xl">🎁</div>
        <div className="absolute bottom-2 right-4 text-lg">🎊</div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl opacity-10">🎉</div>
      </div>

      <div className="relative h-full p-3 sm:p-4 flex flex-col justify-between">
        {/* Header */}
        <div className="text-center">
          <div className="inline-block mb-1">
            <h1 className="text-base sm:text-lg font-bold text-pink-800">🌟 {t.birthdayParty} 🌟</h1>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-purple-800 mb-1 transform -rotate-1">
            {party.childName}
          </h2>
          <div className="inline-block px-3 py-1 bg-white rounded-full shadow-lg">
            <p className="text-sm font-bold text-pink-600">
              {locale === 'zh' ? `${t.turning}${party.childAge}岁!` : `${t.turning} ${party.childAge}!`}
            </p>
          </div>
          {party.theme && (
            <div className="ml-1 inline-block px-2 py-0.5 bg-yellow-300 rounded-full shadow-md">
              <p className="text-xs font-bold text-yellow-800">{party.theme}</p>
            </div>
          )}
        </div>

        {/* Details Card */}
        <div className="bg-white/90 rounded-xl p-2 shadow-lg border-2 border-pink-200">
          <div className="space-y-1 text-xs">
            <div className="flex items-center bg-blue-50 rounded-lg p-1.5">
              <span className="text-sm mr-2">⏰</span>
              <span className="font-semibold text-blue-800">{formatDate(new Date(party.eventDatetime), locale)}</span>
            </div>
            <div className="flex items-center bg-green-50 rounded-lg p-1.5">
              <span className="text-sm mr-2">🏠</span>
              <span className="font-semibold text-green-800 flex-1">{party.location}</span>
            </div>
            {party.notes && (
              <div className="bg-purple-50 rounded-lg p-1.5">
                <div className="flex items-start">
                  <span className="text-sm mr-2">💌</span>
                  <span className="font-semibold text-purple-800 flex-1 line-clamp-1">{party.notes}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end">
          <div className="bg-white/80 rounded-lg p-2 shadow-lg">
            <p className="text-xs font-bold text-pink-700">{t.pleaseRsvp}!</p>
            <p className="text-xs text-pink-600">{t.scanTheCode}</p>
          </div>
          {qrCodeUrl && (
            <div className="p-1.5 bg-white rounded-xl shadow-xl border-2 border-pink-300">
              <img
                src={qrCodeUrl}
                alt="RSVP QR Code"
                className="w-12 h-12 sm:w-14 sm:h-14"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Premium Template 3 - Modern Minimal
function PremiumTemplate3({ party, qrCodeUrl, locale, t }: TemplateProps) {
  return (
    <div
      className="invitation-card relative mx-auto w-full overflow-hidden shadow-2xl"
      style={{
        aspectRatio: '3/2',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        maxWidth: '100%',
      }}
    >
      {/* Geometric decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 transform rotate-45 translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 transform -rotate-45 -translate-x-12 translate-y-12"></div>
      </div>

      <div className="relative h-full p-3 sm:p-4 flex flex-col justify-between text-white">
        {/* Header */}
        <div>
          <div className="flex items-center mb-2">
            <div className="w-0.5 h-8 bg-gradient-to-b from-blue-300 to-blue-500 mr-2"></div>
            <div>
              <h1 className="text-xs sm:text-sm font-light tracking-wide">{t.birthdayInvitationTitle}</h1>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-thin mb-1">
            {party.childName}
          </h2>
          <div className="flex items-baseline space-x-1">
            <span className="text-base font-light">{t.turns}</span>
            <span className="text-3xl sm:text-4xl font-thin text-blue-300">{party.childAge}</span>
            {locale === 'zh' && <span className="text-base font-light">岁</span>}
            {party.theme && (
              <span className="ml-2 text-xs text-blue-200 uppercase">{party.theme}</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1">
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-300">{t.dateTime}</p>
            <p className="text-sm font-light">{formatDate(new Date(party.eventDatetime), locale)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-300">{t.location}</p>
            <p className="text-sm font-light">{party.location}</p>
          </div>
          {party.notes && (
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-300">{t.note.replace(':', '')}</p>
              <p className="text-xs font-light text-blue-100 line-clamp-1">{party.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-2 border-t border-white/20">
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-300">{t.rsvp}</p>
            <p className="text-xs font-light">{t.scanToRespond.replace(' →', '')}</p>
          </div>
          {qrCodeUrl && (
            <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
              <img
                src={qrCodeUrl}
                alt="RSVP QR Code"
                className="w-12 h-12 sm:w-14 sm:h-14"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Premium Template 4 - Festive
function PremiumTemplate4({ party, qrCodeUrl, locale, t }: TemplateProps) {
  return (
    <div
      className="invitation-card relative mx-auto w-full overflow-hidden rounded-2xl shadow-2xl"
      style={{
        aspectRatio: '3/2',
        background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
        maxWidth: '100%',
      }}
    >
      {/* Festive decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-2 left-2 text-2xl animate-bounce">🎈</div>
        <div className="absolute top-6 right-6 text-xl animate-pulse">🎂</div>
        <div className="absolute bottom-4 left-6 text-lg animate-bounce delay-300">🎁</div>
        <div className="absolute bottom-2 right-2 text-xl animate-pulse delay-500">🎊</div>
        <div className="absolute top-1/3 right-1/4 text-sm animate-bounce delay-700">🎵</div>
        <div className="absolute bottom-1/3 left-1/3 text-sm animate-pulse delay-1000">⭐</div>
      </div>

      <div className="relative h-full p-3 sm:p-4 flex flex-col justify-between text-white">
        {/* Festive Header */}
        <div className="text-center">
          <h1 className="text-base sm:text-lg font-bold mb-1">
            🎉 {t.letsCelebrate} 🎉
          </h1>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-yellow-100">
              {party.childName}
            </h2>
            <div className="flex justify-center items-center space-x-1">
              <span className="text-sm">{t.isTurning}</span>
              <span className="text-2xl sm:text-3xl font-bold text-yellow-200">{party.childAge}</span>
              <span className="text-sm">{locale === 'zh' ? '岁!' : '!'}</span>
            </div>
          </div>

          {party.theme && (
            <div className="inline-block bg-yellow-300 text-orange-800 px-2 py-0.5 rounded-full shadow-lg">
              <p className="text-xs font-bold">🌟 {party.theme} 🌟</p>
            </div>
          )}
        </div>

        {/* Party Details */}
        <div className="space-y-1">
          <div className="bg-white/90 rounded-lg p-2 text-orange-800 shadow-lg flex items-center">
            <span className="text-sm mr-2">🗓️</span>
            <div>
              <p className="text-xs font-bold">{formatDate(new Date(party.eventDatetime), locale)}</p>
            </div>
          </div>

          <div className="bg-white/90 rounded-lg p-2 text-orange-800 shadow-lg flex items-center">
            <span className="text-sm mr-2">📍</span>
            <p className="text-xs font-bold flex-1">{party.location}</p>
          </div>

          {party.notes && (
            <div className="bg-white/90 rounded-lg p-2 text-orange-800 shadow-lg flex items-center">
              <span className="text-sm mr-2">💝</span>
              <p className="text-xs font-bold flex-1 line-clamp-1">{party.notes}</p>
            </div>
          )}
        </div>

        {/* RSVP Section */}
        <div className="flex justify-between items-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
            <p className="text-xs font-bold">📱 {t.rsvpNow}</p>
            <p className="text-xs">{t.scanAndJoin}</p>
          </div>
          {qrCodeUrl && (
            <div className="p-1.5 bg-white rounded-lg shadow-xl border-2 border-yellow-300">
              <img
                src={qrCodeUrl}
                alt="RSVP QR Code"
                className="w-12 h-12 sm:w-14 sm:h-14"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}