import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { calculateAge } from '@/lib/utils'

// Get user's children
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const children = await prisma.child.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        birthDate: true,
        gender: true,
        allergies: true,
        notes: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const childrenWithAge = children.map(child => ({
      ...child,
      age: calculateAge(child.birthDate),
      birthDate: child.birthDate.toISOString().split('T')[0]
    }))

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
    const { name, birthDate, gender, allergies, notes } = body

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
        gender: gender || null,
        allergies: allergies || null,
        notes: notes || null
      }
    })

    return NextResponse.json({
      ...child,
      age: calculateAge(child.birthDate),
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