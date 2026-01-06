import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { sendEmail } from '@/lib/email'
import { testEmailProviders } from '@/lib/email-providers'

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { testEmail } = await request.json()
    const emailToTest = testEmail || session.user.email

    console.log(`🧪 Testing email send to: ${emailToTest}`)

    // Send test email
    await sendEmail({
      to: emailToTest,
      subject: '📧 Kid Party RSVP - Email Test',
      text: `Hello!

This is a test email from Kid Party RSVP system.

If you received this email, your email configuration is working correctly! 🎉

Test details:
• Sent to: ${emailToTest}
• Time: ${new Date().toISOString()}
• From: ${session.user.name || session.user.email}

You can now use all email features:
• RSVP confirmations
• Photo sharing notifications
• Birthday party reminders
• Party updates

Best regards,
Kid Party RSVP System`
    })

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${emailToTest}`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test email failed:', error)
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test all email providers
    const results = await testEmailProviders()

    return NextResponse.json({
      providers: results,
      environment: {
        smtpHost: process.env.SMTP_HOST || 'Not configured',
        smtpPort: process.env.SMTP_PORT || 'Not configured',
        smtpUser: process.env.SMTP_USER ? '✓ Configured' : '❌ Missing',
        smtpPass: process.env.SMTP_PASS ? '✓ Configured' : '❌ Missing',
        smtpFrom: process.env.SMTP_FROM || 'Not configured'
      },
      recommendations: getRecommendations()
    })
  } catch (error) {
    console.error('Error testing email providers:', error)
    return NextResponse.json({
      error: 'Failed to test email providers',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

function getRecommendations() {
  const recommendations = []

  if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'localhost') {
    recommendations.push({
      type: 'warning',
      message: 'No real email provider configured. Emails will only show in console.',
      action: 'Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env file'
    })
  }

  if (!process.env.SMTP_FROM) {
    recommendations.push({
      type: 'info',
      message: 'Consider setting SMTP_FROM for better email delivery',
      action: 'Add SMTP_FROM="Your App Name <noreply@yourdomain.com>" to .env'
    })
  }

  if (process.env.SMTP_HOST === 'smtp.gmail.com') {
    recommendations.push({
      type: 'success',
      message: 'Gmail SMTP detected. Make sure to use App Password, not regular password.',
      action: 'Generate App Password at https://myaccount.google.com/apppasswords'
    })
  }

  return recommendations
}