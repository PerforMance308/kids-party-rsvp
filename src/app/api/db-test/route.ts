import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) {
    return adminCheck.response!
  }

  try {
    console.log('Testing database connection...')

    // Test basic connection
    await prisma.$connect()
    console.log('Database connected successfully')

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Query result:', result)

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result
    })
  } catch (error) {
    console.error('Database connection error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
