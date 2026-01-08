import { createTransporter } from './email'

export interface EmailProvider {
  name: string
  test: () => Promise<boolean>
  send: (to: string, subject: string, content: string) => Promise<void>
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

  async send(to: string, subject: string, content: string) {
    const transporter = createTransporter()
    if (!transporter) {
      throw new Error('Email transporter not available')
    }
    await transporter.sendMail({
      from: process.env.SMTP_FROM?.includes('@')
        ? process.env.SMTP_FROM
        : `Kid Party RSVP <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: content,
      html: content.replace(/\n/g, '<br>')
    })
  }
}

// Console Provider (fallback)
export const consoleProvider: EmailProvider = {
  name: 'Console',
  async test() {
    return true // Console always works
  },

  async send(to: string, subject: string, content: string) {
    console.log('\n=== EMAIL NOTIFICATION (Console Provider) ===')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('Content:')
    console.log(content)
    console.log('===========================================\n')
  }
}

// Auto-select the best available provider
export async function getEmailProvider(): Promise<EmailProvider> {
  const providers = [gmailProvider, consoleProvider]

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
  const providers = [gmailProvider, consoleProvider]
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