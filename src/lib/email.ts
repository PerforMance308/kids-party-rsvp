import nodemailer from 'nodemailer'
import { getEmailProvider } from './email-providers'
import { getBaseUrl } from './utils'

interface EmailData {
  to: string
  subject: string
  text: string
  html?: string
}

const PRIMARY_COLOR = '#f43f5e'
const SECONDARY_COLOR = '#f43f5e'
const NEUTRAL_COLOR = '#4b5563'

function wrapHtmlEmail(title: string, content: string, actionUrl?: string, actionText?: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light only">
        <meta name="supported-color-schemes" content="light">
        <title>${title}</title>
        <style>
          :root {
            color-scheme: light only;
            supported-color-schemes: light;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937 !important;
            margin: 0;
            padding: 0;
            background-color: #f9fafb !important;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff !important;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #ffffff !important;
            padding: 32px 20px;
            text-align: center;
            border-bottom: 1px solid #f3f4f6;
          }
          .header h1 { color: #111827 !important; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
          .logo-wrapper {
            background-color: #ffffff !important;
            padding: 10px;
            display: inline-block;
            border-radius: 8px;
          }
          .content { padding: 32px 24px; background-color: #ffffff !important; }
          .footer {
            background-color: #f3f4f6 !important;
            padding: 24px;
            text-align: center;
            font-size: 14px;
            color: #6b7280 !important;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #f43f5e !important;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 24px;
          }
          .details-card {
            background-color: #f0f9ff !important;
            border-left: 4px solid ${PRIMARY_COLOR};
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .details-item { margin: 8px 0; display: flex; align-items: center; }
          .emoji { margin-right: 10px; font-size: 18px; }
          p { margin: 16px 0; color: #1f2937 !important; }
          .greeting { font-size: 18px; font-weight: 600; color: #111827 !important; }

          /* Dark mode prevention */
          @media (prefers-color-scheme: dark) {
            body, .container, .header, .content, .footer, p, .greeting {
              background-color: #ffffff !important;
              color: #1f2937 !important;
            }
            .footer {
              background-color: #f3f4f6 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-wrapper">
              <img src="${getBaseUrl()}/logo.png" alt="Kid Party RSVP" style="height: 50px; width: auto; max-width: 240px; display: block; margin: 0 auto;">
            </div>
          </div>
          <div class="content">
            ${content}
            ${actionUrl && actionText ? `<div style="text-align: center;"><a href="${actionUrl}" class="button">${actionText}</a></div>` : ''}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Kid Party RSVP. All rights reserved.</p>
            <p>Making party planning easier for parents everywhere!</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Create reusable transporter
export const createTransporter = () => {
  // Check if we have Gmail SMTP configuration
  if (process.env.SMTP_HOST === 'smtp.gmail.com' && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // Check if we have custom SMTP configuration
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
      // For development with mailhog or similar
      ignoreTLS: process.env.SMTP_HOST === 'localhost',
    })
  }

  // Fallback - just log to console
  return null
}

export async function sendEmail(emailData: EmailData) {
  try {
    const provider = await getEmailProvider()
    await provider.send(emailData.to, emailData.subject, emailData.text, emailData.html)
    console.log(`✅ Email sent via ${provider.name} to ${emailData.to}`)
    return Promise.resolve()
  } catch (error) {
    console.error('❌ Failed to send email:', error)

    // Fallback to console logging if email fails
    console.log('\n=== EMAIL NOTIFICATION (Fallback) ===')
    console.log(`To: ${emailData.to}`)
    console.log(`Subject: ${emailData.subject}`)
    console.log('Content (HTML if available):')
    console.log(emailData.html || emailData.text)
    console.log('=====================================\n')

    // Don't throw error - just log and continue
    return Promise.resolve()
  }
}

export function generateRSVPConfirmationEmail(
  partyData: {
    childName: string
    childAge: number
    eventDatetime: Date
    location: string
    theme?: string
    notes?: string
  },
  guestData: {
    childName: string
    status: string
    numChildren: number
    parentStaying: boolean
    allergies?: string
    message?: string
  }
) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const statusEmoji = {
    'YES': '🎉',
    'NO': '😢',
    'MAYBE': '🤔'
  }

  const statusText = {
    'YES': 'Yes, we\'ll be there!',
    'NO': 'Sorry, we can\'t make it',
    'MAYBE': 'Maybe, we\'ll try to make it'
  }

  const subject = `RSVP Confirmed: ${partyData.childName}'s Birthday Party`

  const guestConfirmText = guestData.status === 'YES'
    ? `<p>Great! We're excited to celebrate with <strong>${guestData.childName}</strong> and ${guestData.numChildren} child${guestData.numChildren !== 1 ? 'ren' : ''}.</p>
       <p>${guestData.parentStaying ? '🏠 A parent/guardian will be staying for the party.' : '🚗 This will be a drop-off party for us.'}</p>`
    : guestData.status === 'MAYBE'
      ? `<p>Thank you for letting us know you might be able to make it. We hope to see <strong>${guestData.childName}</strong> there!</p>`
      : `<p>Thank you for letting us know. We'll miss <strong>${guestData.childName}</strong> but hope to celebrate together next time!</p>`

  const plainText = `Hi,

Thank you for your RSVP to ${partyData.childName}'s ${partyData.childAge}th birthday party!

Your Response: ${statusEmoji[guestData.status as keyof typeof statusEmoji]} ${statusText[guestData.status as keyof typeof statusText]}

${guestConfirmText.replace(/<[^>]*>/g, '')}

Party Details:
🎂 ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (${partyData.theme} theme)` : ''}
📅 ${formatDate(partyData.eventDatetime)}
📍 ${partyData.location}

${partyData.notes ? `Special Notes: ${partyData.notes}\n\n` : ''}${guestData.allergies ? `⚠️ Allergies/Dietary Restrictions: ${guestData.allergies}\n\n` : ''}${guestData.message ? `💬 Your Message: "${guestData.message}"\n\n` : ''}Looking forward to celebrating together!

Best regards,
Kid Party RSVP Team`

  const htmlContent = `
    <p class="greeting">Hi,</p>
    <p>Thank you for your RSVP to <strong>${partyData.childName}'s ${partyData.childAge}th birthday party</strong>!</p>
    
    <div style="font-size: 1.2em; padding: 15px; background: #fefce8; border-radius: 8px; text-align: center; margin: 20px 0;">
      ${statusEmoji[guestData.status as keyof typeof statusEmoji]} <strong>${statusText[guestData.status as keyof typeof statusText]}</strong>
    </div>

    ${guestConfirmText}

    <div class="details-card">
      <h3 style="margin-top: 0; color: ${PRIMARY_COLOR};">Party Details</h3>
      <div class="details-item"><span class="emoji">🎂</span> ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (<em>${partyData.theme} theme</em>)` : ''}</div>
      <div class="details-item"><span class="emoji">📅</span> ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item"><span class="emoji">📍</span> ${partyData.location}</div>
    </div>

    ${partyData.notes ? `<p><strong>Special Notes:</strong> ${partyData.notes}</p>` : ''}
    ${guestData.allergies ? `<p style="color: #dc2626;"><strong>⚠️ Allergies/Dietary Restrictions:</strong> ${guestData.allergies}</p>` : ''}
    ${guestData.message ? `<p style="font-style: italic;"><strong>💬 Your Message:</strong> "${guestData.message}"</p>` : ''}
    
    <p>Looking forward to celebrating together!</p>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent)
  }
}

export function generateHostRSVPNotificationEmail(
  partyData: {
    childName: string
    childAge: number
    eventDatetime: Date
    location: string
  },
  guestData: {
    childName: string
    status: string
    numChildren: number
    parentStaying: boolean
    allergies?: string
    message?: string
  },
  locale: 'en' | 'zh' = 'zh'
) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const statusEmoji = {
    'YES': '🎉',
    'NO': '😢',
    'MAYBE': '🤔'
  }

  const content = {
    zh: {
      statusText: { 'YES': '接受邀请', 'NO': '无法参加', 'MAYBE': '可能参加' },
      subject: `新的RSVP回复：${guestData.childName} ${{'YES': '接受邀请', 'NO': '无法参加', 'MAYBE': '可能参加'}[guestData.status as keyof typeof statusEmoji]} - ${partyData.childName}的生日派对`,
      greeting: '您好！',
      received: '您收到了一个新的RSVP回复：',
      guest: '客人：',
      response: '回复：',
      details: '参加详情',
      numChildren: '参加人数：',
      children: '名儿童',
      parent: '家长：',
      willStay: '会留下陪同',
      dropOff: '只是接送，不留下',
      allergies: '过敏/饮食限制：',
      maybeText: '表示可能参加，请后续确认。',
      sorryText: '很遗憾',
      cannotAttend: '无法参加这次派对。',
      guestMessage: '客人留言：',
      partyInfo: '派对信息',
      event: '活动：',
      birthdayOf: '的',
      birthday: '岁生日派对',
      when: '时间：',
      where: '地点：',
      viewDashboard: '查看仪表板',
      footer: 'KidParty RSVP 系统'
    },
    en: {
      statusText: { 'YES': 'Accepted', 'NO': 'Declined', 'MAYBE': 'Maybe' },
      subject: `New RSVP: ${guestData.childName} ${{'YES': 'Accepted', 'NO': 'Declined', 'MAYBE': 'Maybe'}[guestData.status as keyof typeof statusEmoji]} - ${partyData.childName}'s Birthday`,
      greeting: 'Hello!',
      received: 'You received a new RSVP response:',
      guest: 'Guest:',
      response: 'Response:',
      details: 'Attendance Details',
      numChildren: 'Number of children:',
      children: 'children',
      parent: 'Parent:',
      willStay: 'will stay with children',
      dropOff: 'drop-off only',
      allergies: 'Allergies/Dietary Restrictions:',
      maybeText: 'indicated they might attend. Please confirm later.',
      sorryText: 'Unfortunately',
      cannotAttend: 'cannot attend this party.',
      guestMessage: 'Guest Message:',
      partyInfo: 'Party Information',
      event: 'Event:',
      birthdayOf: '',
      birthday: `'s ${partyData.childAge}th Birthday Party`,
      when: 'When:',
      where: 'Where:',
      viewDashboard: 'View Dashboard',
      footer: 'KidParty RSVP System'
    }
  }

  const t = content[locale]
  const subject = t.subject

  const plainText = `${t.greeting}

${t.received}

👥 ${t.guest} ${guestData.childName}
📝 ${t.response} ${statusEmoji[guestData.status as keyof typeof statusEmoji]} ${t.statusText[guestData.status as keyof typeof statusEmoji]}

${guestData.status === 'YES' ? `
✅ ${t.details}：
• ${t.numChildren} ${guestData.numChildren} ${t.children}
• ${t.parent} ${guestData.parentStaying ? t.willStay : t.dropOff}
${guestData.allergies ? `• ⚠️ ${t.allergies} ${guestData.allergies}` : ''}
` : guestData.status === 'MAYBE' ? `
🤔 ${guestData.childName} ${t.maybeText}
` : `
😢 ${t.sorryText} ${guestData.childName} ${t.cannotAttend}
`}${guestData.message ? `
💬 ${t.guestMessage} "${guestData.message}"
` : ''}
🎂 ${t.partyInfo}：
• ${t.event} ${partyData.childName}${t.birthdayOf} ${partyData.childAge} ${t.birthday}
• ${t.when} ${formatDate(partyData.eventDatetime)}
• ${t.where} ${partyData.location}

${t.footer}`

  const htmlContent = `
    <p class="greeting">${t.greeting}</p>
    <p>${t.received}</p>

    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 1.1em;">
        <strong>👥 ${t.guest}</strong> ${guestData.childName}<br>
        <strong>📝 ${t.response}</strong> ${statusEmoji[guestData.status as keyof typeof statusEmoji]} <span style="color: ${guestData.status === 'YES' ? '#059669' : guestData.status === 'NO' ? '#dc2626' : '#d97706'};">${t.statusText[guestData.status as keyof typeof statusEmoji]}</span>
      </p>
    </div>

    ${guestData.status === 'YES' ? `
      <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #059669;">✅ ${t.details}</h4>
        <p style="margin: 5px 0;">• ${t.numChildren} <strong>${guestData.numChildren}</strong> ${t.children}</p>
        <p style="margin: 5px 0;">• ${t.parent} ${guestData.parentStaying ? t.willStay : t.dropOff}</p>
        ${guestData.allergies ? `<p style="margin: 5px 0; color: #dc2626;">• ⚠️ ${t.allergies} ${guestData.allergies}</p>` : ''}
      </div>
    ` : ''}

    ${guestData.message ? `
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; font-style: italic;">
        <strong>💬 ${t.guestMessage}</strong> "${guestData.message}"
      </div>
    ` : ''}

    <div class="details-card" style="border-left-color: ${SECONDARY_COLOR}; background-color: #fff1f2;">
      <h4 style="margin-top: 0; color: ${SECONDARY_COLOR};">🎂 ${t.partyInfo}</h4>
      <div class="details-item">• ${t.event} ${partyData.childName}${t.birthdayOf} ${partyData.childAge} ${t.birthday}</div>
      <div class="details-item">• ${t.when} ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item">• ${t.where} ${partyData.location}</div>
    </div>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, `${getBaseUrl()}/${locale}/dashboard`, t.viewDashboard)
  }
}

export function generateReminderEmail(
  partyData: {
    childName: string
    childAge: number
    eventDatetime: Date
    location: string
    theme?: string
    notes?: string
    rsvpUrl: string
  },
  guestData: {
    childName: string
  },
  reminderType: 'SEVEN_DAYS' | 'TWO_DAYS' | 'SAME_DAY'
) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const timeMap = {
    SEVEN_DAYS: '7 days',
    TWO_DAYS: '2 days',
    SAME_DAY: 'today'
  }

  const subject = reminderType === 'SAME_DAY'
    ? `Today: ${partyData.childName}'s Birthday Party!`
    : `Reminder: ${partyData.childName}'s Party in ${timeMap[reminderType]}`

  const plainText = `Hi,

This is a friendly reminder about ${partyData.childName}'s ${partyData.childAge}th birthday party!

Party Details:
🎂 ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (${partyData.theme} theme)` : ''}
📅 ${formatDate(partyData.eventDatetime)}
📍 ${partyData.location}

${partyData.notes ? `Special Notes: ${partyData.notes}\n\n` : ''}Haven't RSVP'd yet? Please let us know: ${partyData.rsvpUrl}

Looking forward to celebrating with ${guestData.childName}!

Best regards,
Kid Party RSVP Team`

  const htmlContent = `
    <p class="greeting">Hi,</p>
    <p>This is a friendly reminder about <strong>${partyData.childName}'s ${partyData.childAge}th birthday party</strong>!</p>
    
    <div class="details-card">
      <h3 style="margin-top: 0; color: ${PRIMARY_COLOR};">Party reminder</h3>
      <div class="details-item"><span class="emoji">🎂</span> ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (<em>${partyData.theme} theme</em>)` : ''}</div>
      <div class="details-item"><span class="emoji">📅</span> ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item"><span class="emoji">📍</span> ${partyData.location}</div>
    </div>

    ${partyData.notes ? `<p><strong>Special Notes:</strong> ${partyData.notes}</p>` : ''}
    
    <p>We're looking forward to celebrating with <strong>${guestData.childName}</strong>!</p>
    
    <p style="margin-top: 30px; text-align: center;">
      <em>Haven't RSVP'd yet? Please let us know so we can prepare!</em>
    </p>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, partyData.rsvpUrl, 'RSVP Now')
  }
}

export function generatePartyUpdateEmail(
  partyData: {
    id: string
    childName: string
    childAge: number
    eventDatetime: Date
    location: string
    theme?: string
    notes?: string
    publicRsvpToken: string
  },
  guestData: {
    childName: string
  },
  changes: {
    date?: boolean
    location?: boolean
    childName?: boolean
    childAge?: boolean
  }
) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const subject = `Party Update: ${partyData.childName}'s Birthday Party`

  const changesList = []
  if (changes.date) changesList.push('📅 Date and time')
  if (changes.location) changesList.push('📍 Location')
  if (changes.childName) changesList.push('🎂 Child\'s name')
  if (changes.childAge) changesList.push('🎈 Age')

  const plainText = `Hi,

We have some important updates for ${partyData.childName}'s ${partyData.childAge}th birthday party!

What's Changed:
${changesList.map(change => `• ${change}`).join('\n')}

Updated Party Details:
🎂 ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (${partyData.theme} theme)` : ''}
📅 ${formatDate(partyData.eventDatetime)}
📍 ${partyData.location}

${partyData.notes ? `Special Notes: ${partyData.notes}\n\n` : ''}Please note these changes and let us know if they affect your ability to attend.
Your current RSVP is still valid, but you can update it if needed: ${getBaseUrl()}/rsvp/${partyData.publicRsvpToken}

We apologize for any inconvenience and look forward to celebrating with ${guestData.childName}!

Best regards,
Kid Party RSVP Team`

  const htmlContent = `
    <p class="greeting">Hi,</p>
    <p>We have some <strong>important updates</strong> for ${partyData.childName}'s ${partyData.childAge}th birthday party!</p>
    
    <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #ea580c;">What's Changed:</h4>
      <ul style="margin: 0; padding-left: 20px;">
        ${changesList.map(change => `<li style="margin: 5px 0;">${change}</li>`).join('')}
      </ul>
    </div>

    <div class="details-card">
      <h4 style="margin-top: 0; color: ${PRIMARY_COLOR};">Updated Party Details</h4>
      <div class="details-item"><span class="emoji">🎂</span> ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (<em>${partyData.theme} theme</em>)` : ''}</div>
      <div class="details-item"><span class="emoji">📅</span> ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item"><span class="emoji">📍</span> ${partyData.location}</div>
    </div>

    ${partyData.notes ? `<p><strong>Special Notes:</strong> ${partyData.notes}</p>` : ''}
    
    <p>Please note these changes and let us know if they affect your ability to attend. Your current RSVP is still valid, but you can update it if needed.</p>
    
    <p>We apologize for any inconvenience and look forward to celebrating together!</p>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, `${getBaseUrl()}/rsvp/${partyData.publicRsvpToken}`, 'Update RSVP')
  }
}

export async function sendPartyUpdateEmail(
  email: string,
  partyData: any,
  changes: any
) {
  const emailContent = generatePartyUpdateEmail(
    partyData,
    { childName: 'your child' },
    changes
  )

  await sendEmail({
    to: email,
    subject: emailContent.subject,
    text: emailContent.text
  })
}

export function generateInvitationEmail(
  partyData: {
    childName: string
    childAge: number
    eventDatetime: Date
    location: string
    theme?: string
    notes?: string
    publicRsvpToken: string
  },
  hostName: string
) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const rsvpUrl = `${getBaseUrl()}/rsvp/${partyData.publicRsvpToken}`

  const subject = `Invitation: ${partyData.childName}'s ${partyData.childAge}th Birthday Party!`

  const plainText = `Hi!

You are invited to celebrate ${partyData.childName}'s ${partyData.childAge}th birthday!

${hostName} has sent you this invitation.

Party Details:
🎂 ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (${partyData.theme} theme)` : ''}
📅 ${formatDate(partyData.eventDatetime)}
📍 ${partyData.location}

${partyData.notes ? `Special Notes: ${partyData.notes}\n\n` : ''}Please RSVP by clicking the link below:
${rsvpUrl}

We hope you can make it!

Best regards,
Kid Party RSVP Team`

  const htmlContent = `
    <p class="greeting">Hi there!</p>
    <p>You are cordially invited to celebrate <strong>${partyData.childName}'s ${partyData.childAge}th birthday party</strong>!</p>
    
    <p>${hostName} has sent you this special invitation.</p>

    <div class="details-card" style="background-color: #fdf2f8; border-left-color: #db2777;">
      <h3 style="margin-top: 0; color: #db2777;">Party Details</h3>
      <div class="details-item"><span class="emoji">🎂</span> ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (<em>${partyData.theme} theme</em>)` : ''}</div>
      <div class="details-item"><span class="emoji">📅</span> ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item"><span class="emoji">📍</span> ${partyData.location}</div>
    </div>

    ${partyData.notes ? `<p><strong>Special Notes:</strong> ${partyData.notes}</p>` : ''}
    
    <p style="text-align: center; margin-top: 30px;">
      <strong>We hope you can make it!</strong><br>
      Please let us know by clicking the button below:
    </p>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, rsvpUrl, 'RSVP Now')
  }
}

export function generatePhotoSharingAvailableEmail(
  partyData: {
    childName: string
    childAge: number
    eventDatetime: Date
    location: string
    theme?: string
    publicRsvpToken: string
  },
  guestData: {
    childName: string
  }
) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const guestPageUrl = `${getBaseUrl()}/party/guest/${partyData.publicRsvpToken}`

  const subject = `📷 Share Your Photos: ${partyData.childName}'s Birthday Party Memories!`

  const plainText = `Hi,

Hope ${partyData.childName}'s ${partyData.childAge}th birthday party was amazing! 🎉

We know you probably took some wonderful photos during the celebration, and we'd love for everyone to share their memories together.

📸 Photo Sharing is Now Available!

You can now:
• Upload and share your photos from the party
• View photos uploaded by other guests
• Download photos to keep the memories forever

Party Details:
🎂 ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (${partyData.theme} theme)` : ''}
📅 ${formatDate(partyData.eventDatetime)}
📍 ${partyData.location}

Share your photos here:
${guestPageUrl}

Let's create a beautiful photo album together to remember this special day! 📚✨

Best regards,
Kid Party RSVP Team`

  const htmlContent = `
    <p class="greeting">Hi,</p>
    <p>Hope <strong>${partyData.childName}'s ${partyData.childAge}th birthday party</strong> was amazing! 🎉</p>
    
    <p>We know you probably took some wonderful photos during the celebration, and we'd love for everyone to share their memories together.</p>

    <div style="background-color: #f0fdf4; border: 1px dashed #22c55e; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
      <h3 style="margin-top: 0; color: #16a34a;">📸 Photo Sharing is Now Available!</h3>
      <p style="margin-bottom: 0;">Upload, view, and download memories from the party.</p>
    </div>

    <div class="details-card">
      <h4 style="margin-top: 0; color: ${PRIMARY_COLOR};">Party Summary</h4>
      <div class="details-item"><span class="emoji">🎂</span> ${partyData.childName}'s ${partyData.childAge}th Birthday</div>
      <div class="details-item"><span class="emoji">📅</span> ${formatDate(partyData.eventDatetime)}</div>
    </div>

    <p>Let's create a beautiful photo album together to remember this special day! 📚✨</p>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, guestPageUrl, 'View & Upload Photos')
  }
}

export function generateBirthdayPartyReminderEmail(
  childData: {
    name: string
    birthDate: Date
  },
  parentData: {
    name: string
  }
) {
  const today = new Date()
  const thisYearBirthday = new Date(today.getFullYear(), childData.birthDate.getMonth(), childData.birthDate.getDate())

  // If birthday has passed this year, calculate for next year
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1)
  }

  const age = thisYearBirthday.getFullYear() - childData.birthDate.getFullYear()

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const subject = `🎂 ${childData.name}'s ${age}th Birthday is Coming Up - Time to Plan a Party!`

  const plainText = `Hi ${parentData.name},

${childData.name}'s special day is approaching! 🎉

📅 ${childData.name} will turn ${age} on ${formatDate(thisYearBirthday)}

That's just a few weeks away - the perfect time to start planning an unforgettable birthday party!

🎊 Why not create a memorable celebration?

With Kid Party RSVP, you can easily:
• Create beautiful invitation templates
• Manage guest RSVPs effortlessly  
• Share photos from the party
• Keep track of dietary restrictions
• Send automatic reminders to guests

✨ Ready to start planning?

Visit our website to create ${childData.name}'s birthday party:
${getBaseUrl()}

Make this birthday one to remember! 🌟

Best regards,
Kid Party RSVP Team

P.S. Early planning means less stress and more fun for everyone! 🎈`

  const htmlContent = `
    <p class="greeting">Hi ${parentData.name},</p>
    <p><strong>${childData.name}'s</strong> special day is approaching! 🎉</p>
    
    <div style="background-color: #fffbeb; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; border: 2px solid #fcd34d;">
      <h2 style="margin: 0; color: #b45309;">🎂 ${childData.name} will turn ${age}</h2>
      <p style="margin: 10px 0 0 0; font-size: 1.1em;">on <strong>${formatDate(thisYearBirthday)}</strong></p>
    </div>

    <p>That's just a few weeks away &mdash; the perfect time to start planning an unforgettable birthday party!</p>
    
    <div class="details-card" style="background-color: #f0fdfa; border-left-color: #0d9488;">
      <h4 style="margin-top: 0; color: #0d9488;">🎊 With Kid Party RSVP, you can:</h4>
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin: 5px 0;">✨ Create beautiful invitation templates</li>
        <li style="margin: 5px 0;">📊 Manage guest RSVPs effortlessly</li>
        <li style="margin: 5px 0;">📸 Share photos with all guests</li>
        <li style="margin: 5px 0;">📧 Send automatic reminders</li>
      </ul>
    </div>

    <p><strong>Ready to start planning?</strong> Make this birthday one to remember! 🌟</p>
    <p style="font-size: 0.9em; color: #6b7280; margin-top: 20px;">P.S. Early planning means less stress and more fun for everyone! 🎈</p>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, getBaseUrl(), 'Start Planning Now')
  }
}

export function generateVerificationEmail(
  email: string,
  token: string,
  locale: 'en' | 'zh' = 'en'
) {
  const verifyUrl = `${getBaseUrl()}/api/auth/verify?token=${token}`

  const content = {
    en: {
      subject: 'Verify your email for Kid Party RSVP',
      greeting: 'Welcome to Kid Party RSVP!',
      body: 'Please verify your email address to enable automatic reminders and notifications for your parties.',
      button: 'Verify Email',
      footer: 'If you did not create this account, you can safely ignore this email.'
    },
    zh: {
      subject: '验证您的 Kid Party RSVP 邮箱',
      greeting: '欢迎来到 Kid Party RSVP！',
      body: '请验证您的电子邮箱地址，以开启派对自动提醒和通知功能。',
      button: '验证邮箱',
      footer: '如果您没有创建过此账号，请忽略此邮件。'
    }
  }

  const t = content[locale]

  const plainText = `${t.greeting}\n\n${t.body}\n\n${t.button}: ${verifyUrl}\n\n${t.footer}`

  const htmlContent = `
    <p class="greeting">${t.greeting}</p>
    <p>${t.body}</p>
    <p style="margin-top: 20px; font-size: 0.9em; color: #6b7280;">${t.footer}</p>
  `

  return {
    subject: t.subject,
    text: plainText,
    html: wrapHtmlEmail(t.subject, htmlContent, verifyUrl, t.button)
  }
}

export function generatePasswordResetEmail(
  email: string,
  token: string,
  locale: 'en' | 'zh' = 'en'
) {
  const resetUrl = `${getBaseUrl()}/${locale}/login/reset-password?token=${token}`

  const content = {
    en: {
      subject: 'Reset your password for Kid Party RSVP',
      greeting: 'Password Reset Request',
      body: 'You requested to reset your password. Click the button below to set a new password. This link will expire in 1 hour.',
      button: 'Reset Password',
      footer: 'If you did not request this, please ignore this email.'
    },
    zh: {
      subject: '重置您的 Kid Party RSVP 密码',
      greeting: '重置密码请求',
      body: '您申请了重置密码。点击下方按钮设置新密码。此链接将在 1 小时内失效。',
      button: '重置密码',
      footer: '如果您没有提交此请求，请忽略此邮件。'
    }
  }

  const t = content[locale]

  const plainText = `${t.greeting}\n\n${t.body}\n\n${t.button}: ${resetUrl}\n\n${t.footer}`

  const htmlContent = `
    <p class="greeting">${t.greeting}</p>
    <p>${t.body}</p>
    <p style="margin-top: 20px; font-size: 0.9em; color: #6b7280;">${t.footer}</p>
  `

  return {
    subject: t.subject,
    text: plainText,
    html: wrapHtmlEmail(t.subject, htmlContent, resetUrl, t.button)
  }
}