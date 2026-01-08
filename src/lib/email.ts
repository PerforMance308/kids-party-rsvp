import nodemailer from 'nodemailer'
import { getEmailProvider } from './email-providers'
import { getBaseUrl } from './utils'

interface EmailData {
  to: string
  subject: string
  text: string
  html?: string
}

const PRIMARY_COLOR = '#0ea5e9'
const SECONDARY_COLOR = '#f43f5e'
const NEUTRAL_COLOR = '#4b5563'

function wrapHtmlEmail(title: string, content: string, actionUrl?: string, actionText?: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background-color: ${PRIMARY_COLOR}; padding: 32px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
          .content { padding: 32px 24px; }
          .footer { background-color: #f3f4f6; padding: 24px; text-align: center; font-size: 14px; color: #6b7280; }
          .button { display: inline-block; padding: 12px 24px; background-color: ${PRIMARY_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }
          .details-card { background-color: #f0f9ff; border-left: 4px solid ${PRIMARY_COLOR}; padding: 16px; margin: 20px 0; border-radius: 4px; }
          .details-item { margin: 8px 0; display: flex; align-items: center; }
          .emoji { margin-right: 10px; font-size: 18px; }
          p { margin: 16px 0; }
          .greeting { font-size: 18px; font-weight: 600; color: #111827; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Kid Party RSVP</h1>
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
    await provider.send(emailData.to, emailData.subject, emailData.html || emailData.text)
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
    parentName: string
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

  const plainText = `Hi ${guestData.parentName},

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
    <p class="greeting">Hi ${guestData.parentName},</p>
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
    parentName: string
    childName: string
    status: string
    numChildren: number
    parentStaying: boolean
    allergies?: string
    message?: string
  }
) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
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
    'YES': '接受邀请',
    'NO': '无法参加',
    'MAYBE': '可能参加'
  }

  const subject = `新的RSVP回复：${guestData.parentName} ${statusText[guestData.status as keyof typeof statusText]} - ${partyData.childName}的生日派对`

  const plainText = `您好！

您收到了一个新的RSVP回复：

👥 客人：${guestData.parentName} 和 ${guestData.childName}
📝 回复：${statusEmoji[guestData.status as keyof typeof statusEmoji]} ${statusText[guestData.status as keyof typeof statusText]}

${guestData.status === 'YES' ? `
✅ 参加详情：
• 参加人数：${guestData.numChildren} 名儿童
• 家长：${guestData.parentStaying ? '会留下陪同' : '只是接送，不留下'}
${guestData.allergies ? `• ⚠️ 过敏/饮食限制：${guestData.allergies}` : ''}
` : guestData.status === 'MAYBE' ? `
🤔 ${guestData.parentName} 表示可能参加，请后续确认。
` : `
😢 很遗憾 ${guestData.childName} 无法参加这次派对。
`}${guestData.message ? `
💬 留言："${guestData.message}"
` : ''}
🎂 派对信息：
• 活动：${partyData.childName} 的 ${partyData.childAge} 岁生日派对
• 时间：${formatDate(partyData.eventDatetime)}
• 地点：${partyData.location}

您可以在仪表板中查看所有RSVP回复。

KidParty RSVP 系统`

  const htmlContent = `
    <p class="greeting">您好！</p>
    <p>您收到了一个新的RSVP回复：</p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 1.1em;">
        <strong>👥 客人：</strong> ${guestData.parentName} 和 ${guestData.childName}<br>
        <strong>📝 回复：</strong> ${statusEmoji[guestData.status as keyof typeof statusEmoji]} <span style="color: ${guestData.status === 'YES' ? '#059669' : guestData.status === 'NO' ? '#dc2626' : '#d97706'};">${statusText[guestData.status as keyof typeof statusText]}</span>
      </p>
    </div>

    ${guestData.status === 'YES' ? `
      <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #059669;">✅ 参加详情</h4>
        <p style="margin: 5px 0;">• 参加人数：<strong>${guestData.numChildren}</strong> 名儿童</p>
        <p style="margin: 5px 0;">• 家长：${guestData.parentStaying ? '会留下陪同' : '只是接送，不留下'}</p>
        ${guestData.allergies ? `<p style="margin: 5px 0; color: #dc2626;">• ⚠️ 过敏/饮食限制：${guestData.allergies}</p>` : ''}
      </div>
    ` : ''}

    ${guestData.message ? `
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; font-style: italic;">
        <strong>💬 客人留言：</strong> "${guestData.message}"
      </div>
    ` : ''}

    <div class="details-card" style="border-left-color: ${SECONDARY_COLOR}; background-color: #fff1f2;">
      <h4 style="margin-top: 0; color: ${SECONDARY_COLOR};">🎂 派对信息</h4>
      <div class="details-item">• 活动：${partyData.childName} 的 ${partyData.childAge} 岁生日派对</div>
      <div class="details-item">• 时间：${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item">• 地点：${partyData.location}</div>
    </div>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, `${getBaseUrl()}/dashboard`, '查看仪表板')
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
    parentName: string
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

  const plainText = `Hi ${guestData.parentName},

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
    <p class="greeting">Hi ${guestData.parentName},</p>
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
    parentName: string
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

  const plainText = `Hi ${guestData.parentName},

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
    <p class="greeting">Hi ${guestData.parentName},</p>
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
  parentName: string,
  partyData: any,
  changes: any
) {
  const emailContent = generatePartyUpdateEmail(
    partyData,
    { parentName, childName: 'your child' },
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
    parentName: string
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

  const plainText = `Hi ${guestData.parentName},

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
    <p class="greeting">Hi ${guestData.parentName},</p>
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