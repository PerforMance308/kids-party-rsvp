import { createTransporter } from './email'
import { Resend } from 'resend'

export interface EmailAttachment {
  filename: string
  /** Plain text content (e.g. ICS file) */
  content: string
  contentType: string
  /**
   * When true, the part is added as an inline MIME alternative
   * (Content-Disposition: inline) rather than a downloadable attachment.
   * Required for Gmail to show the "Add to Calendar" button.
   * Nodemailer: placed in `alternatives[]`.
   * Resend: sent as a regular attachment (inline not supported by SDK).
   */
  inline?: boolean
}

export interface EmailProvider {
  name: string
  test: () => Promise<boolean>
  send: (to: string, subject: string, text: string, html?: string, attachments?: EmailAttachment[]) => Promise<void>
}

// Resend Provider (preferred)
export const resendProvider: EmailProvider = {
  name: 'Resend',
  async test() {
    if (!process.env.RESEND_API_KEY) {
      return false
    }
    try {
      // Simple validation - check if API key exists and has correct format
      return process.env.RESEND_API_KEY.startsWith('re_')
    } catch (error) {
      console.error('❌ Resend test failed:', error)
      return false
    }
  },

  async send(to: string, subject: string, text: string, html?: string, attachments?: EmailAttachment[]) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@kidspartyrsvp.com'

    await resend.emails.send({
      from: `Kid Party RSVP <${fromEmail}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: Buffer.from(a.content).toString('base64'),
      })),
    })
  }
}

// Gmail Provider
export const gmailProvider: EmailProvider = {
  name: 'Gmail',
  async test() {
    if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'localhost') {
      return false
    }

    try {
      const transporter = createTransporter()
      if (!transporter) {
        console.warn('⚠️ Gmail provider: createTransporter returned null. Check SMTP_HOST/USER/PASS env vars.')
        return false
      }
      await transporter.verify()
      return true
    } catch (error) {
      console.error('❌ Gmail SMTP test failed:', error)
      return false
    }
  },

  async send(to: string, subject: string, text: string, html?: string, attachments?: EmailAttachment[]) {
    const transporter = createTransporter()
    if (!transporter) {
      throw new Error('Email transporter not available')
    }

    // Inline parts (e.g. text/calendar) go into `alternatives` so Gmail
    // can detect them and show the "Add to Calendar" button.
    const alternatives = attachments
      ?.filter(a => a.inline)
      .map(a => ({ contentType: a.contentType, content: Buffer.from(a.content) }))

    // Non-inline parts become regular downloadable attachments.
    const regularAttachments = attachments
      ?.filter(a => !a.inline)
      .map(a => ({ filename: a.filename, content: a.content, contentType: a.contentType }))

    await transporter.sendMail({
      from: process.env.SMTP_FROM?.includes('@')
        ? process.env.SMTP_FROM
        : `Kid Party RSVP <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
      alternatives: alternatives?.length ? alternatives : undefined,
      attachments: regularAttachments?.length ? regularAttachments : undefined,
    })
  }
}

// Console Provider (fallback)
export const consoleProvider: EmailProvider = {
  name: 'Console',
  async test() {
    return true // Console always works
  },

  async send(to: string, subject: string, text: string, html?: string, attachments?: EmailAttachment[]) {
    console.log('\n=== EMAIL NOTIFICATION (Console Provider) ===')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('Text content:')
    console.log(text)
    if (html) {
      console.log('HTML content available (rich format)')
    }
    if (attachments?.length) {
      console.log(`Attachments: ${attachments.map(a => a.filename).join(', ')}`)
    }
    console.log('===========================================\n')
  }
}

// Auto-select the best available provider
export async function getEmailProvider(): Promise<EmailProvider> {
  const providers = [resendProvider, gmailProvider, consoleProvider]

  for (const provider of providers) {
    if (await provider.test()) {
      console.log(`📧 Using email provider: ${provider.name}`)
      return provider
    }
  }

  // Fallback to console
  return consoleProvider
}

// Test all providers
export async function testEmailProviders() {
  const providers = [resendProvider, gmailProvider, consoleProvider]
  const results = []

  for (const provider of providers) {
    try {
      const isWorking = await provider.test()
      results.push({
        name: provider.name,
        status: isWorking ? 'working' : 'failed',
        error: null
      })
    } catch (error) {
      results.push({
        name: provider.name,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return results
}