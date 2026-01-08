import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json()

        if (!token || !password) {
            return NextResponse.json({ error: 'Missing token or password' }, { status: 400 })
        }

        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token }
        })

        if (!verificationToken || verificationToken.expires < new Date()) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
        }

        const passwordHash = await hashPassword(password)

        // Update user
        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { passwordHash }
        })

        // Delete token
        await prisma.verificationToken.delete({
            where: { token }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
