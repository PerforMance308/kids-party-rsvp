import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = { id: session.user.id }

    const body = await request.json()
    const { partyId, childName, email, phone } = body

    // Verify party belongs to user
    const party = await prisma.party.findFirst({
      where: { 
        id: partyId,
        userId: user.id 
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Check if guest already exists for this party
    const existingGuest = await prisma.guest.findFirst({
      where: {
        partyId: partyId,
        email: email
      }
    })

    if (existingGuest) {
      return NextResponse.json({ error: 'Guest already added to this party' }, { status: 400 })
    }

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        partyId,
        childName,
        email,
        phone: phone || null,
      }
    })

    return NextResponse.json(guest, { status: 201 })
  } catch (error) {
    console.error('Guest creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}