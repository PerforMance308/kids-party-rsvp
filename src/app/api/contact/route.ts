import { NextRequest, NextResponse, after } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getClientIP, isValidEmail, rateLimit, sanitizeInput } from '@/lib/security'

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@kidspartyrsvp.com'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    if (!rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many contact requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const name = sanitizeInput(body?.name || '').slice(0, 100)
    const email = sanitizeInput(body?.email || '').toLowerCase().slice(0, 254)
    const subject = sanitizeInput(body?.subject || '').slice(0, 120)
    const message = sanitizeInput(body?.message || '').slice(0, 2000)

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required.' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    after(async () => {
      try {
        await sendEmail({
          to: SUPPORT_EMAIL,
          subject: `[Contact] ${subject}`,
          text: `New contact form submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nIP: ${ip}\n\nMessage:\n${message}`,
          html: `
            <p><strong>New contact form submission</strong></p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>IP:</strong> ${ip}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
        })
      } catch (error) {
        console.error('Async contact form send error:', error)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Your message has been queued successfully.',
    })
  } catch (error) {
    console.error('Contact form send error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send message.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
