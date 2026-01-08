import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { getBaseUrl } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { template } = body

    // Verify the party belongs to the current user
    const party = await prisma.party.findUnique({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Check if template is premium
    const premiumTemplates = ['premium1', 'premium2', 'premium3', 'premium4']
    if (!premiumTemplates.includes(template)) {
      return NextResponse.json({ error: 'Template is not premium' }, { status: 400 })
    }

    // TODO: 这里应该集成真实的支付系统（微信支付、支付宝等）
    // 现在暂时模拟支付成功
    
    // Update party to mark template as paid and set the template
    const updatedParty = await prisma.party.update({
      where: { id },
      data: {
        template,
        templatePaid: true
      },
      include: {
        child: true,
        guests: {
          include: {
            rsvp: true
          }
        }
      }
    })

    // Calculate stats
    const rsvps = updatedParty.guests.map(g => g.rsvp).filter(Boolean)
    const stats = {
      total: updatedParty.guests.length,
      attending: rsvps.filter(r => r?.status === 'YES').length,
      notAttending: rsvps.filter(r => r?.status === 'NO').length,
      maybe: rsvps.filter(r => r?.status === 'MAYBE').length,
    }

    // Calculate child age
    const today = new Date()
    const birthDate = new Date(updatedParty.child.birthDate)
    const childAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

    const responseData = {
      id: updatedParty.id,
      childName: updatedParty.child.name,
      childAge,
      eventDatetime: updatedParty.eventDatetime,
      location: updatedParty.location,
      theme: updatedParty.theme,
      notes: updatedParty.notes,
      template: updatedParty.template,
      templatePaid: updatedParty.templatePaid,
      publicRsvpToken: updatedParty.publicRsvpToken,
      rsvpUrl: `${getBaseUrl()}/rsvp/${updatedParty.publicRsvpToken}`,
      guests: updatedParty.guests,
      stats
    }

    return NextResponse.json({
      success: true,
      message: 'Template upgrade successful!',
      party: responseData
    })
  } catch (error) {
    console.error('Template upgrade error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}