'use client'

import { useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { formatDate } from '@/lib/utils'

interface InvitationCardProps {
  party: {
    childName: string
    childAge: number
    eventDatetime: string
    location: string
    theme?: string
    notes?: string
  }
  qrCodeUrl: string
  rsvpUrl: string
}

export default function InvitationCard({ party, qrCodeUrl, rsvpUrl }: InvitationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const downloadPDF = async () => {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        width: 1200,
        height: 800,
      } as any)

      const pdf = new jsPDF('l', 'mm', 'a4') // 横向A4
      
      // A4 landscape: 297 x 210mm
      const pdfWidth = 297
      const pdfHeight = 210
      const imgWidth = pdfWidth - 10 // 5mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Center the image
      const x = (pdfWidth - imgWidth) / 2
      const y = (pdfHeight - imgHeight) / 2
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, imgWidth, imgHeight)
      pdf.save(`${party.childName}-birthday-invitation.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const printInvitation = () => {
    if (!cardRef.current) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Party Invitation Card</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 10mm; 
              font-family: 'Georgia', serif;
              background: white;
            }
            .invitation-card {
              width: 277mm;
              height: 190mm;
              margin: 0 auto;
              background: white;
              border: 3px solid #8B4513;
              border-radius: 15px;
              overflow: hidden;
              position: relative;
              page-break-inside: avoid;
              display: flex;
            }
            .fold-line {
              position: absolute;
              left: 50%;
              top: 0;
              bottom: 0;
              width: 2px;
              background: repeating-linear-gradient(
                to bottom,
                #ccc 0px,
                #ccc 5px,
                transparent 5px,
                transparent 10px
              );
              z-index: 10;
            }
            .left-panel, .right-panel {
              width: 50%;
              position: relative;
              background: linear-gradient(135deg, #FFE5F1 0%, #FFCCCB 30%, #FFE4B5 100%);
            }
            .front-cover {
              padding: 30px;
              text-align: center;
              color: #8B4513;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              background-image: 
                radial-gradient(circle at 20% 20%, rgba(255,182,193,0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255,218,185,0.3) 0%, transparent 50%);
            }
            .inner-content {
              padding: 25px;
              color: #2C1810;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: linear-gradient(45deg, #FFF8DC 0%, #FFFACD 100%);
            }
            .decorative-border {
              position: absolute;
              top: 15px;
              left: 15px;
              right: 15px;
              bottom: 15px;
              border: 2px solid #DDA0DD;
              border-radius: 10px;
              pointer-events: none;
            }
            .title {
              font-size: 42px;
              font-weight: bold;
              margin-bottom: 20px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
              font-family: 'Georgia', serif;
            }
            .subtitle {
              font-size: 24px;
              margin-bottom: 30px;
              color: #CD853F;
            }
            .details {
              font-size: 16px;
              line-height: 1.8;
              margin-bottom: 20px;
            }
            .detail-item {
              display: flex;
              align-items: center;
              margin-bottom: 12px;
              font-weight: 500;
            }
            .emoji {
              font-size: 20px;
              margin-right: 12px;
              width: 30px;
            }
            .qr-section {
              text-align: center;
              padding: 15px;
              background: white;
              border-radius: 10px;
              border: 2px solid #DDA0DD;
              margin-top: 15px;
            }
            .qr-code {
              width: 120px;
              height: 120px;
              margin: 0 auto 10px;
              border-radius: 8px;
            }
            .rsvp-text {
              font-size: 14px;
              color: #8B4513;
              font-weight: bold;
            }
            .decorative-elements {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              pointer-events: none;
              overflow: hidden;
            }
            .balloon {
              position: absolute;
              font-size: 24px;
              opacity: 0.4;
            }
            .special-notes {
              background: rgba(255, 255, 255, 0.8);
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #FF69B4;
              margin-top: 15px;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 5mm;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .invitation-card {
                width: 287mm;
                height: 200mm;
              }
            }
          </style>
        </head>
        <body>
          ${cardRef.current.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 500);
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
      </html>
    `)
    
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      {/* 可折叠邀请卡预览 - 等比缩放设计 */}
      <div 
        ref={cardRef}
        className="invitation-card border border-amber-800 rounded-lg shadow-lg overflow-hidden relative mx-auto w-full"
        style={{ 
          aspectRatio: '3/2', // 保持宽高比 3:2
          background: 'linear-gradient(135deg, #FFE5F1 0%, #FFCCCB 30%, #FFE4B5 100%)',
          maxWidth: '100%',
          fontSize: 'clamp(0.75rem, 2.5vw, 1rem)' // 基于视口宽度的等比缩放
        }}
      >
        {/* 折叠线 */}
        <div className="fold-line absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 opacity-50 z-10"
             style={{
               background: 'repeating-linear-gradient(to bottom, #ccc 0px, #ccc 5px, transparent 5px, transparent 10px)'
             }}>
        </div>

        {/* 装饰边框 */}
        <div className="decorative-border absolute border-2 border-purple-300 rounded-lg pointer-events-none"
             style={{
               top: '1%',
               left: '1%',
               right: '1%',  
               bottom: '1%'
             }}></div>

        {/* 装饰元素 */}
        <div className="decorative-elements absolute inset-0 overflow-hidden pointer-events-none"
             style={{ fontSize: 'clamp(1rem, 4vw, 2.5rem)' }}>
          <div className="balloon absolute opacity-40" style={{ top: '8%', left: '8%' }}>🎈</div>
          <div className="balloon absolute opacity-50" style={{ top: '12%', right: '25%' }}>🎉</div>
          <div className="balloon absolute opacity-35" style={{ bottom: '20%', left: '12%' }}>🎂</div>
          <div className="balloon absolute opacity-45" style={{ bottom: '15%', right: '12%' }}>🎁</div>
          <div className="balloon absolute opacity-30" style={{ top: '50%', left: '25%' }}>✨</div>
          <div className="balloon absolute opacity-40" style={{ top: '33%', right: '30%' }}>🌟</div>
          <div className="balloon absolute opacity-35" style={{ top: '18%', left: '48%' }}>🎊</div>
          <div className="balloon absolute opacity-40" style={{ bottom: '35%', left: '48%' }}>💖</div>
        </div>

        {/* 左半部分 - 封面 */}
        <div className="left-panel absolute left-0 top-0 w-1/2 h-full">
          <div className="front-cover h-full flex flex-col justify-center items-center text-center text-amber-800"
               style={{
                 background: 'radial-gradient(circle at 30% 30%, rgba(255,182,193,0.4) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(255,218,185,0.4) 0%, transparent 60%)',
                 padding: '5%'
               }}>
            <div className="relative z-20">
              <h1 className="title font-bold leading-tight"
                  style={{ 
                    fontFamily: 'Georgia, serif',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.15)',
                    color: '#8B4513',
                    fontSize: 'clamp(1.2rem, 6vw, 3.5rem)',
                    marginBottom: 'clamp(0.5rem, 3vw, 1.5rem)'
                  }}>
                You're<br/>Invited!
              </h1>
              <div className="subtitle text-yellow-700 font-medium"
                   style={{
                     fontSize: 'clamp(0.7rem, 2.5vw, 1.2rem)',
                     marginBottom: 'clamp(0.5rem, 2vw, 1rem)'
                   }}>
                🎊 Birthday Party 🎊
              </div>
              <div className="text-pink-600 font-semibold"
                   style={{
                     fontSize: 'clamp(0.8rem, 3vw, 1.5rem)'
                   }}>
                {party.childName} is turning {party.childAge}!
              </div>
              {party.theme && (
                <div className="text-purple-600 font-medium bg-white/60 rounded-full"
                     style={{
                       fontSize: 'clamp(0.6rem, 2vw, 1rem)',
                       marginTop: 'clamp(0.5rem, 2vw, 1rem)',
                       padding: 'clamp(0.3rem, 1.5vw, 0.8rem) clamp(0.8rem, 3vw, 1.5rem)'
                     }}>
                  {party.theme} Theme
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右半部分 - 详细信息 */}
        <div className="right-panel absolute right-0 top-0 w-1/2 h-full">
          <div className="inner-content h-full flex flex-col justify-between text-amber-900"
               style={{
                 background: 'linear-gradient(45deg, #FFF8DC 0%, #FFFACD 100%)',
                 padding: '3%'
               }}>
            <div className="relative z-20">
              <h2 className="font-bold text-center text-pink-700"
                  style={{ 
                    fontFamily: 'Georgia, serif',
                    fontSize: 'clamp(0.8rem, 3vw, 1.8rem)',
                    marginBottom: 'clamp(0.5rem, 2vw, 1rem)'
                  }}>
                Party Details
              </h2>
              
              <div className="details" style={{ marginBottom: 'clamp(0.8rem, 3vw, 1.5rem)' }}>
                <div className="detail-item flex items-center" style={{ marginBottom: 'clamp(0.3rem, 1.5vw, 0.8rem)' }}>
                  <span className="emoji" style={{ 
                    fontSize: 'clamp(0.8rem, 3vw, 1.5rem)',
                    marginRight: 'clamp(0.3rem, 1.5vw, 0.8rem)'
                  }}>📅</span>
                  <div>
                    <div className="font-semibold" style={{ fontSize: 'clamp(0.6rem, 2.5vw, 1rem)' }}>When</div>
                    <div style={{ fontSize: 'clamp(0.5rem, 2vw, 0.9rem)' }}>{formatDate(new Date(party.eventDatetime))}</div>
                  </div>
                </div>
                
                <div className="detail-item flex items-center" style={{ marginBottom: 'clamp(0.3rem, 1.5vw, 0.8rem)' }}>
                  <span className="emoji" style={{ 
                    fontSize: 'clamp(0.8rem, 3vw, 1.5rem)',
                    marginRight: 'clamp(0.3rem, 1.5vw, 0.8rem)'
                  }}>📍</span>
                  <div>
                    <div className="font-semibold" style={{ fontSize: 'clamp(0.6rem, 2.5vw, 1rem)' }}>Where</div>
                    <div className="break-words" style={{ fontSize: 'clamp(0.5rem, 2vw, 0.9rem)' }}>{party.location}</div>
                  </div>
                </div>

                <div className="detail-item flex items-center" style={{ marginBottom: 'clamp(0.3rem, 1.5vw, 0.8rem)' }}>
                  <span className="emoji" style={{ 
                    fontSize: 'clamp(0.8rem, 3vw, 1.5rem)',
                    marginRight: 'clamp(0.3rem, 1.5vw, 0.8rem)'
                  }}>🎈</span>
                  <div>
                    <div className="font-semibold" style={{ fontSize: 'clamp(0.6rem, 2.5vw, 1rem)' }}>Age</div>
                    <div style={{ fontSize: 'clamp(0.5rem, 2vw, 0.9rem)' }}>{party.childAge} years old</div>
                  </div>
                </div>

                {party.notes && (
                  <div className="special-notes bg-white/80 rounded-lg border-l-4 border-pink-400"
                       style={{
                         padding: 'clamp(0.5rem, 2vw, 1rem)',
                         marginTop: 'clamp(0.5rem, 2vw, 1rem)'
                       }}>
                    <h3 className="font-bold text-pink-700" 
                        style={{ 
                          fontSize: 'clamp(0.6rem, 2.5vw, 1rem)',
                          marginBottom: 'clamp(0.2rem, 1vw, 0.5rem)'
                        }}>Special Notes:</h3>
                    <p className="leading-relaxed" style={{ fontSize: 'clamp(0.5rem, 2vw, 0.9rem)' }}>{party.notes}</p>
                  </div>
                )}
              </div>

              <div className="qr-section bg-white rounded-lg border border-purple-300 text-center shadow-lg"
                   style={{
                     padding: 'clamp(0.5rem, 2vw, 1rem)',
                     marginBottom: 'clamp(0.5rem, 2vw, 1rem)'
                   }}>
                <img 
                  src={qrCodeUrl} 
                  alt="RSVP QR Code" 
                  className="mx-auto rounded border border-gray-200"
                  style={{
                    width: 'clamp(3rem, 12vw, 8rem)',
                    height: 'clamp(3rem, 12vw, 8rem)',
                    marginBottom: 'clamp(0.3rem, 1vw, 0.8rem)'
                  }}
                />
                <div className="rsvp-text font-bold text-amber-800"
                     style={{ fontSize: 'clamp(0.5rem, 2vw, 0.9rem)' }}>
                  Scan to RSVP
                </div>
                <div className="text-gray-600 break-all" 
                     style={{ 
                       fontSize: 'clamp(0.4rem, 1.5vw, 0.7rem)',
                       marginTop: 'clamp(0.2rem, 0.5vw, 0.5rem)'
                     }}>
                  or visit: {rsvpUrl.replace('http://localhost:3000', '').replace('http://localhost:3002', '').replace('http://192.168.4.168:3000', '')}
                </div>
              </div>

              <div className="text-center">
                <p className="font-semibold text-pink-600"
                   style={{ fontSize: 'clamp(0.6rem, 2.5vw, 1.2rem)' }}>
                  Can't wait to celebrate with you! 🎉
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 - 响应式布局 */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6 px-4">
        <button
          onClick={downloadPDF}
          className="btn btn-primary flex items-center justify-center space-x-2 px-6 py-3"
          style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)' }}
        >
          <span>📄</span>
          <span>Download PDF</span>
        </button>
        
        <button
          onClick={printInvitation}
          className="btn btn-secondary flex items-center justify-center space-x-2 px-6 py-3"
          style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)' }}
        >
          <span>🖨️</span>
          <span>Print Invitation</span>
        </button>
      </div>

      <div className="text-center text-sm text-neutral-600 mt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="font-medium text-blue-800 mb-2">💡 Print Instructions:</p>
          <ul className="text-blue-700 text-left space-y-1">
            <li>• Use cardstock paper (220-300gsm) for best results</li>
            <li>• Print in color for full visual impact</li>
            <li>• Cut along the border and fold at the center dotted line</li>
            <li>• The left side is the cover, right side contains party details</li>
          </ul>
        </div>
      </div>
    </div>
  )
}