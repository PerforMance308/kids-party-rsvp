import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
    try {
        const { email, locale = 'en' } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        // For security, always return success even if user doesn't exist
        if (!user) {
            console.log(`Password reset requested for non-existent email: ${email}`)
            return NextResponse.json({ success: true })
        }

        // Generate token
        const token = uuidv4()
        const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        // Save token
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires
            }
        })

        // Send email
        const emailContent = generatePasswordResetEmail(email, token, locale as 'en' | 'zh')
        await sendEmail({
            to: email,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
