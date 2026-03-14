import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { generateQRCode } from '@/lib/qr'
import { getBaseUrl } from '@/lib/utils'
import { findFirstFreeTemplateId, getTemplateConfig } from '@/lib/template-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { searchParams } = new URL(request.url)
    let darkColor = searchParams.get('darkColor') || undefined
    let lightColor = searchParams.get('lightColor') || undefined

    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const party = await prisma.party.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    if (!darkColor || !lightColor) {
      let templateId = party.template

      if (!templateId || templateId === 'free') {
        templateId = (await findFirstFreeTemplateId()) || 'dinosaur_1'
      }

      const config = await getTemplateConfig(templateId)
      if (config?.qr_code) {
        darkColor = darkColor || config.qr_code.darkColor
        lightColor = lightColor || config.qr_code.lightColor
      }
    }

    const rsvpUrl = `${getBaseUrl()}/rsvp/${party.publicRsvpToken}`
    const qrCodeDataUrl = await generateQRCode(rsvpUrl, { darkColor, lightColor })

    return NextResponse.json({ qrCode: qrCodeDataUrl, rsvpUrl })
  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
