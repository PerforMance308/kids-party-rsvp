import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const contacts = await prisma.contact.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Fetch contacts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}