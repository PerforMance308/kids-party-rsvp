import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { sendEmail, generateVerificationEmail } from '@/lib/email'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

// GET /api/auth/verify?token=xxx - Verify email
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    try {
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token }
        })

        if (!verificationToken || verificationToken.expires < new Date()) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
        }

        // Update user
        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() }
        })

        // Delete used token
        await prisma.verificationToken.delete({
            where: { token }
        })

        // Redirect to dashboard with success message
        const baseUrl = new URL(request.url).origin
        return NextResponse.redirect(`${baseUrl}/en/dashboard?verified=true`)
    } catch (error) {
        console.error('Email verification error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/auth/verify/send - Send/Resend verification email
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const email = session.user.email
        const user = await prisma.user.findUnique({ where: { email } })

        if (user?.emailVerified) {
            return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
        }

        // Generate token
        const token = uuidv4()
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Clean up old tokens
        await prisma.verificationToken.deleteMany({
            where: { identifier: email }
        })

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires
            }
        })

        // Send email
        const emailContent = generateVerificationEmail(email, token, 'en') // Default to en for now
        await sendEmail({
            to: email,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to send verification email:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
