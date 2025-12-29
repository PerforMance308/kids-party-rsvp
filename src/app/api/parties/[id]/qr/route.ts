import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { generateQRCode } from '@/lib/qr'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('QR API called for party:', id)

    const session = await getServerSession(authOptions)
    console.log('QR API session:', { hasSession: !!session, userId: session?.user?.id })
    
    if (!session || !session.user?.id) {
      console.log('QR API unauthorized - no valid session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const party = await prisma.party.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    const rsvpUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/rsvp/${party.publicRsvpToken}`
    const qrCodeDataUrl = await generateQRCode(rsvpUrl)

    return NextResponse.json({ qrCode: qrCodeDataUrl, rsvpUrl })
  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}