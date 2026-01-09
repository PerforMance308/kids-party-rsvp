import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePassword, validateEmail } from '@/lib/auth'
import { sanitizeInput } from '@/lib/security'
import { v4 as uuidv4 } from 'uuid'
import { sendEmail, generateVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate and sanitize input
    const email = sanitizeInput(body.email || '').toLowerCase().trim()
    const password = body.password || ''

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
      }
    })

    console.log(`[AUTH] User created: ${email}, sending verification email...`)

    // Generate Verification Token and Send Email
    try {
      const token = uuidv4()
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires
        }
      })

      const emailContent = generateVerificationEmail(email, token, 'en')
      await sendEmail({
        to: email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      })
      console.log(`✅ Verification email sent to ${email} upon registration`)
    } catch (emailError) {
      console.error('[AUTH] Failed to send verification email on registration:', emailError)
    }

    // Return success without setting tokens - NextAuth will handle authentication
    return NextResponse.json({
      message: 'Registration successful',
      user: { id: user.id, email: user.email }
    })
  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}