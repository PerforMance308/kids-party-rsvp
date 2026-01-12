import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo'

export const runtime = 'edge'
export const alt = `${SITE_NAME} - Kids Birthday Party Invitations`
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const title = locale === 'zh'
    ? '儿童生日派对邀请与回复管理'
    : 'Easy Kids Birthday Party Invitations'

  const subtitle = locale === 'zh'
    ? '二维码回复 • 自动提醒 • 宾客追踪 • 照片分享'
    : 'QR Code RSVPs • Auto Reminders • Guest Tracking • Photo Sharing'

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '60px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            width: '100%',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 42,
              color: '#1f2937',
              marginBottom: '30px',
              textAlign: 'center',
              fontWeight: 600,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
