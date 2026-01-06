import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

// Get user's children
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const children = await prisma.child.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate age for each child
    const childrenWithAge = children.map(child => {
      const today = new Date()
      const birthDate = new Date(child.birthDate)
      const age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      
      return {
        ...child,
        age,
        birthDate: child.birthDate.toISOString().split('T')[0] // Format for input
      }
    })

    return NextResponse.json(childrenWithAge)
  } catch (error) {
    console.error('Fetch children error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add new child
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, birthDate, allergies, notes } = body

    if (!name || !birthDate) {
      return NextResponse.json(
        { error: 'Name and birth date are required' },
        { status: 400 }
      )
    }

    const child = await prisma.child.create({
      data: {
        userId: session.user.id,
        name,
        birthDate: new Date(birthDate),
        allergies: allergies || null,
        notes: notes || null
      }
    })

    // Calculate age for response
    const today = new Date()
    const age = Math.floor((today.getTime() - child.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

    return NextResponse.json({
      ...child,
      age,
      birthDate: child.birthDate.toISOString().split('T')[0]
    }, { status: 201 })
  } catch (error) {
    console.error('Create child error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}