import nodemailer from 'nodemailer'
import { getEmailProvider } from './email-providers'
import { getBaseUrl } from './utils'

interface EmailData {
  to: string
  subject: string
  text: string
  html?: string
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
    await provider.send(emailData.to, emailData.subject, emailData.text)
    console.log(`✅ Email sent via ${provider.name} to ${emailData.to}`)
    return Promise.resolve()
  } catch (error) {
    console.error('❌ Failed to send email:', error)

    // Fallback to console logging if email fails
    console.log('\n=== EMAIL NOTIFICATION (Fallback) ===')
    console.log(`To: ${emailData.to}`)
    console.log(`Subject: ${emailData.subject}`)
    console.log('Content:')
    console.log(emailData.text)
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
    ? `Great! We're excited to celebrate with ${guestData.childName} and ${guestData.numChildren} child${guestData.numChildren !== 1 ? 'ren' : ''}.
${guestData.parentStaying ? 'A parent/guardian will be staying for the party.' : 'This will be a drop-off party for us.'}`
    : guestData.status === 'MAYBE'
      ? `Thank you for letting us know you might be able to make it. We hope to see ${guestData.childName} there!`
      : `Thank you for letting us know. We'll miss ${guestData.childName} but hope to celebrate together next time!`

  const text = `Hi ${guestData.parentName},

Thank you for your RSVP to ${partyData.childName}'s ${partyData.childAge}th birthday party!

Your Response: ${statusEmoji[guestData.status as keyof typeof statusEmoji]} ${statusText[guestData.status as keyof typeof statusText]}

${guestConfirmText}

Party Details:
🎂 ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (${partyData.theme} theme)` : ''}
📅 ${formatDate(partyData.eventDatetime)}
📍 ${partyData.location}

${partyData.notes ? `Special Notes: ${partyData.notes}\n\n` : ''}${guestData.allergies ? `⚠️ Allergies/Dietary Restrictions: ${guestData.allergies}\n\n` : ''}${guestData.message ? `💬 Your Message: "${guestData.message}"\n\n` : ''}Looking forward to celebrating together!

Best regards,
Kid Party RSVP Team`

  return {
    subject,
    text
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

  const text = `您好！

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

  return {
    subject,
    text
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

  const text = `Hi ${guestData.parentName},

This is a friendly reminder about ${partyData.childName}'s ${partyData.childAge}th birthday party!

Party Details:
🎂 ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (${partyData.theme} theme)` : ''}
📅 ${formatDate(partyData.eventDatetime)}
📍 ${partyData.location}

${partyData.notes ? `Special Notes: ${partyData.notes}\n\n` : ''}Haven't RSVP'd yet? Please let us know: ${partyData.rsvpUrl}

Looking forward to celebrating with ${guestData.childName}!

Best regards,
Kid Party RSVP Team`

  return {
    subject,
    text
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

  const text = `Hi ${guestData.parentName},

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

  return {
    subject,
    text
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

  const text = `Hi!

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

  return {
    subject,
    text
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

  const text = `Hi ${guestData.parentName},

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

  return {
    subject,
    text
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

  const text = `Hi ${parentData.name},

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

  return {
    subject,
    text
  }
}