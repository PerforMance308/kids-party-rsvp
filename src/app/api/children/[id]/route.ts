import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

// Update child
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, birthDate, allergies, notes } = body

    if (!name || !birthDate) {
      return NextResponse.json(
        { error: 'Name and birth date are required' },
        { status: 400 }
      )
    }

    // Verify the child belongs to the current user
    const existingChild = await prisma.child.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingChild) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const child = await prisma.child.update({
      where: { id },
      data: {
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
    })
  } catch (error) {
    console.error('Update child error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete child
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify the child belongs to the current user
    const existingChild = await prisma.child.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        parties: true
      }
    })

    if (!existingChild) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Check if child has any parties
    if (existingChild.parties.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete child with existing parties. Please delete the parties first.' },
        { status: 400 }
      )
    }

    await prisma.child.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete child error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}