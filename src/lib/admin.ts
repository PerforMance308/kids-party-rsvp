import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { UserRole } from '@prisma/client'

export type { UserRole }

interface AdminCheckResult {
  authorized: boolean
  userId?: string
  role?: UserRole
  response?: NextResponse
}

/**
 * 检查当前用户是否为管理员
 * 用于API路由中的权限验证
 */
export async function requireAdmin(): Promise<AdminCheckResult> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== 'ADMIN') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
    }
  }

  return {
    authorized: true,
    userId: session.user.id,
    role: user.role,
  }
}

/**
 * 检查用户ID是否为管理员
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return user?.role === 'ADMIN'
}
