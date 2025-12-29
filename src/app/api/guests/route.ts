import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { partyId, parentName, childName, email, phone } = body

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
        parentName,
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