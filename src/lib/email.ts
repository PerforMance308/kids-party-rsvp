import nodemailer from 'nodemailer'
import { getEmailProvider, EmailAttachment } from './email-providers'
import { getBaseUrl } from './utils'

interface EmailData {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: EmailAttachment[]
}

// ── ICS (iCalendar) generator ─────────────────────────────────────────────────

function formatICSDate(date: Date): string {
  // UTC format: YYYYMMDDTHHMMSSZ
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

export function generateICS(params: {
  uid: string
  title: string
  description: string
  location: string
  startDatetime: Date
  endDatetime: Date
  /** Organizer email — should match the From address so Gmail trusts the invite */
  organizerEmail?: string
  /** Attendee email — required for Gmail to show the "Add to Calendar" button */
  attendeeEmail?: string
}): string {
  const fromEmail =
    params.organizerEmail ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.SMTP_FROM ||
    'noreply@kidspartyrsvp.com'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kids Party RSVP//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${params.uid}@kidspartyrsvp.com`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(params.startDatetime)}`,
    `DTEND:${formatICSDate(params.endDatetime)}`,
    `SUMMARY:${escapeICSText(params.title)}`,
    `DESCRIPTION:${escapeICSText(params.description)}`,
    `LOCATION:${escapeICSText(params.location)}`,
    `ORGANIZER;CN="Kids Party RSVP":mailto:${fromEmail}`,
    ...(params.attendeeEmail
      ? [
          `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE;CN=${params.attendeeEmail}:mailto:${params.attendeeEmail}`,
        ]
      : []),
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

/** Escape user-supplied strings before inserting into HTML email templates */
function esc(str: string | undefined | null): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
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
    await provider.send(emailData.to, emailData.subject, emailData.text, emailData.html, emailData.attachments)
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
    if (emailData.attachments?.length) {
      console.log(`Attachments: ${emailData.attachments.map(a => a.filename).join(', ')}`)
    }
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

  const safePartyChildName = esc(partyData.childName)
  const safeGuestChildName = esc(guestData.childName)
  const safeLocation = esc(partyData.location)
  const safeTheme = esc(partyData.theme)
  const safeNotes = esc(partyData.notes)
  const safeAllergies = esc(guestData.allergies)
  const safeMessage = esc(guestData.message)

  const guestConfirmText = guestData.status === 'YES'
    ? `<p>Great! We're excited to celebrate with <strong>${safeGuestChildName}</strong> and ${guestData.numChildren} child${guestData.numChildren !== 1 ? 'ren' : ''}.</p>
       <p>${guestData.parentStaying ? '🏠 A parent/guardian will be staying for the party.' : '🚗 This will be a drop-off party for us.'}</p>`
    : guestData.status === 'MAYBE'
      ? `<p>Thank you for letting us know you might be able to make it. We hope to see <strong>${safeGuestChildName}</strong> there!</p>`
      : `<p>Thank you for letting us know. We'll miss <strong>${safeGuestChildName}</strong> but hope to celebrate together next time!</p>`

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
    <p>Thank you for your RSVP to <strong>${safePartyChildName}'s ${partyData.childAge}th birthday party</strong>!</p>

    <div style="font-size: 1.2em; padding: 15px; background: #fefce8; border-radius: 8px; text-align: center; margin: 20px 0;">
      ${statusEmoji[guestData.status as keyof typeof statusEmoji]} <strong>${statusText[guestData.status as keyof typeof statusText]}</strong>
    </div>

    ${guestConfirmText}

    <div class="details-card">
      <h3 style="margin-top: 0; color: ${PRIMARY_COLOR};">Party Details</h3>
      <div class="details-item"><span class="emoji">🎂</span> ${safePartyChildName}'s ${partyData.childAge}th Birthday${safeTheme ? ` (<em>${safeTheme} theme</em>)` : ''}</div>
      <div class="details-item"><span class="emoji">📅</span> ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item"><span class="emoji">📍</span> ${safeLocation}</div>
    </div>

    ${safeNotes ? `<p><strong>Special Notes:</strong> ${safeNotes}</p>` : ''}
    ${safeAllergies ? `<p style="color: #dc2626;"><strong>⚠️ Allergies/Dietary Restrictions:</strong> ${safeAllergies}</p>` : ''}
    ${safeMessage ? `<p style="font-style: italic;"><strong>💬 Your Message:</strong> &quot;${safeMessage}&quot;</p>` : ''}

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

  const statusText: Record<string, string> = { 'YES': 'Accepted', 'NO': 'Declined', 'MAYBE': 'Maybe' }

  const safePartyChildName = esc(partyData.childName)
  const safeGuestChildName = esc(guestData.childName)
  const safeLocation = esc(partyData.location)
  const safeAllergies = esc(guestData.allergies)
  const safeMessage = esc(guestData.message)

  const subject = `New RSVP: ${guestData.childName} ${statusText[guestData.status] || guestData.status} - ${partyData.childName}'s Birthday`

  const plainText = `Hello!

You received a new RSVP response:

👥 Guest: ${guestData.childName}
📝 Response: ${statusEmoji[guestData.status as keyof typeof statusEmoji]} ${statusText[guestData.status] || guestData.status}

${guestData.status === 'YES' ? `
✅ Attendance Details:
• Number of children: ${guestData.numChildren} children
• Parent: ${guestData.parentStaying ? 'will stay with children' : 'drop-off only'}
${guestData.allergies ? `• ⚠️ Allergies/Dietary Restrictions: ${guestData.allergies}` : ''}
` : guestData.status === 'MAYBE' ? `
🤔 ${guestData.childName} indicated they might attend. Please confirm later.
` : `
😢 Unfortunately ${guestData.childName} cannot attend this party.
`}${guestData.message ? `
💬 Guest Message: "${guestData.message}"
` : ''}
🎂 Party Information:
• Event: ${partyData.childName}'s ${partyData.childAge}th Birthday Party
• When: ${formatDate(partyData.eventDatetime)}
• Where: ${partyData.location}

KidParty RSVP System`

  const htmlContent = `
    <p class="greeting">Hello!</p>
    <p>You received a new RSVP response:</p>

    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 1.1em;">
        <strong>👥 Guest:</strong> ${safeGuestChildName}<br>
        <strong>📝 Response:</strong> ${statusEmoji[guestData.status as keyof typeof statusEmoji]} <span style="color: ${guestData.status === 'YES' ? '#059669' : guestData.status === 'NO' ? '#dc2626' : '#d97706'};">${statusText[guestData.status] || esc(guestData.status)}</span>
      </p>
    </div>

    ${guestData.status === 'YES' ? `
      <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #059669;">✅ Attendance Details</h4>
        <p style="margin: 5px 0;">• Number of children: <strong>${guestData.numChildren}</strong> children</p>
        <p style="margin: 5px 0;">• Parent: ${guestData.parentStaying ? 'will stay with children' : 'drop-off only'}</p>
        ${safeAllergies ? `<p style="margin: 5px 0; color: #dc2626;">• ⚠️ Allergies/Dietary Restrictions: ${safeAllergies}</p>` : ''}
      </div>
    ` : ''}

    ${safeMessage ? `
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; font-style: italic;">
        <strong>💬 Guest Message:</strong> &quot;${safeMessage}&quot;
      </div>
    ` : ''}

    <div class="details-card" style="border-left-color: ${SECONDARY_COLOR}; background-color: #fff1f2;">
      <h4 style="margin-top: 0; color: ${SECONDARY_COLOR};">🎂 Party Information</h4>
      <div class="details-item">• Event: ${safePartyChildName}'s ${partyData.childAge}th Birthday Party</div>
      <div class="details-item">• When: ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item">• Where: ${safeLocation}</div>
    </div>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, `${getBaseUrl()}/en/dashboard`, 'View Dashboard')
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

  const safePartyChildName = esc(partyData.childName)
  const safeGuestChildName = esc(guestData.childName)
  const safeLocation = esc(partyData.location)
  const safeTheme = esc(partyData.theme)
  const safeNotes = esc(partyData.notes)

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
    <p>This is a friendly reminder about <strong>${safePartyChildName}'s ${partyData.childAge}th birthday party</strong>!</p>

    <div class="details-card">
      <h3 style="margin-top: 0; color: ${PRIMARY_COLOR};">Party reminder</h3>
      <div class="details-item"><span class="emoji">🎂</span> ${safePartyChildName}'s ${partyData.childAge}th Birthday${safeTheme ? ` (<em>${safeTheme} theme</em>)` : ''}</div>
      <div class="details-item"><span class="emoji">📅</span> ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item"><span class="emoji">📍</span> ${safeLocation}</div>
    </div>

    ${safeNotes ? `<p><strong>Special Notes:</strong> ${safeNotes}</p>` : ''}

    <p>We're looking forward to celebrating with <strong>${safeGuestChildName}</strong>!</p>

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

function formatEmailDateTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function generatePartyCreatedConfirmationEmail(partyData: {
  childName: string
  childAge: number
  eventDatetime: Date
  location: string
  theme?: string
  notes?: string
  rsvpClosesAt?: Date | null
  dashboardUrl: string
}) {
  const safeChildName = esc(partyData.childName)
  const safeTheme = esc(partyData.theme)
  const safeNotes = esc(partyData.notes)
  const safeLocation = esc(partyData.location)
  const closeLine = partyData.rsvpClosesAt
    ? `RSVP closes: ${formatEmailDateTime(partyData.rsvpClosesAt)}`
    : null

  const subject = `Party created: ${partyData.childName}'s birthday is ready`
  const text = `Your party is ready.

Party details:
${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (${partyData.theme})` : ''}
When: ${formatEmailDateTime(partyData.eventDatetime)}
Where: ${partyData.location}
${closeLine ? `${closeLine}\n` : ''}${partyData.notes ? `Notes: ${partyData.notes}\n` : ''}
You can manage guests, invitations, and reminders here:
${partyData.dashboardUrl}`

  const html = `
    <p class="greeting">Your party is ready.</p>
    <p>We created <strong>${safeChildName}'s ${partyData.childAge}th birthday party</strong> and saved your invitation settings.</p>

    <div class="details-card">
      <h3 style="margin-top: 0; color: ${PRIMARY_COLOR};">Party Details</h3>
      <div class="details-item"><span class="emoji">🎂</span> ${safeChildName}'s ${partyData.childAge}th Birthday${safeTheme ? ` (<em>${safeTheme}</em>)` : ''}</div>
      <div class="details-item"><span class="emoji">📅</span> ${formatEmailDateTime(partyData.eventDatetime)}</div>
      <div class="details-item"><span class="emoji">📍</span> ${safeLocation}</div>
      ${closeLine ? `<div class="details-item"><span class="emoji">⏳</span> ${esc(closeLine)}</div>` : ''}
    </div>

    ${safeNotes ? `<p><strong>Notes:</strong> ${safeNotes}</p>` : ''}
    <p>You can review the QR code, invite guests, and track RSVPs from your dashboard.</p>
  `

  return {
    subject,
    text,
    html: wrapHtmlEmail(subject, html, partyData.dashboardUrl, 'Open Dashboard')
  }
}

export function generateHostPartyReminder24hEmail(partyData: {
  childName: string
  childAge: number
  eventDatetime: Date
  location: string
  guestCount: number
  attendingCount: number
  maybeCount: number
  notAttendingCount: number
  dashboardUrl: string
}) {
  const subject = `Tomorrow: ${partyData.childName}'s party`
  const text = `Quick reminder: ${partyData.childName}'s ${partyData.childAge}th birthday party is tomorrow.

When: ${formatEmailDateTime(partyData.eventDatetime)}
Where: ${partyData.location}

RSVP summary:
- Invited: ${partyData.guestCount}
- Attending: ${partyData.attendingCount}
- Maybe: ${partyData.maybeCount}
- Not attending: ${partyData.notAttendingCount}

Review the latest guest list:
${partyData.dashboardUrl}`

  const html = `
    <p class="greeting">Your party is tomorrow.</p>
    <p>Here is a quick planning snapshot for <strong>${esc(partyData.childName)}'s ${partyData.childAge}th birthday party</strong>.</p>

    <div class="details-card">
      <div class="details-item"><span class="emoji">📅</span> ${formatEmailDateTime(partyData.eventDatetime)}</div>
      <div class="details-item"><span class="emoji">📍</span> ${esc(partyData.location)}</div>
    </div>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #111827;">RSVP summary</p>
      <p style="margin: 4px 0;">Invited: <strong>${partyData.guestCount}</strong></p>
      <p style="margin: 4px 0;">Attending: <strong>${partyData.attendingCount}</strong></p>
      <p style="margin: 4px 0;">Maybe: <strong>${partyData.maybeCount}</strong></p>
      <p style="margin: 4px 0;">Not attending: <strong>${partyData.notAttendingCount}</strong></p>
    </div>
  `

  return {
    subject,
    text,
    html: wrapHtmlEmail(subject, html, partyData.dashboardUrl, 'Review Guest List')
  }
}

export function generateGuestPartyReminder24hEmail(partyData: {
  childName: string
  childAge: number
  eventDatetime: Date
  location: string
  theme?: string
  notes?: string
  guestPageUrl: string
}, guestData: {
  childName: string
}) {
  const safeChildName = esc(partyData.childName)
  const safeGuestChildName = esc(guestData.childName)
  const safeTheme = esc(partyData.theme)
  const safeNotes = esc(partyData.notes)

  const subject = `Tomorrow: ${partyData.childName}'s birthday party`
  const text = `${guestData.childName} is on the list for ${partyData.childName}'s ${partyData.childAge}th birthday party tomorrow.

When: ${formatEmailDateTime(partyData.eventDatetime)}
Where: ${partyData.location}
${partyData.theme ? `Theme: ${partyData.theme}\n` : ''}${partyData.notes ? `Notes: ${partyData.notes}\n` : ''}
View party details:
${partyData.guestPageUrl}`

  const html = `
    <p class="greeting">Friendly reminder for tomorrow.</p>
    <p>We&apos;re looking forward to celebrating with <strong>${safeGuestChildName}</strong> at <strong>${safeChildName}'s ${partyData.childAge}th birthday party</strong>.</p>

    <div class="details-card">
      <div class="details-item"><span class="emoji">🎂</span> ${safeChildName}'s ${partyData.childAge}th Birthday${safeTheme ? ` (<em>${safeTheme}</em>)` : ''}</div>
      <div class="details-item"><span class="emoji">📅</span> ${formatEmailDateTime(partyData.eventDatetime)}</div>
      <div class="details-item"><span class="emoji">📍</span> ${esc(partyData.location)}</div>
    </div>

    ${safeNotes ? `<p><strong>Notes:</strong> ${safeNotes}</p>` : ''}
    <p>You can reopen the party page anytime for directions and the latest details.</p>
  `

  return {
    subject,
    text,
    html: wrapHtmlEmail(subject, html, partyData.guestPageUrl, 'Open Party Details')
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

  const safePartyChildName = esc(partyData.childName)
  const safeGuestChildName = esc(guestData.childName)
  const safeLocation = esc(partyData.location)
  const safeTheme = esc(partyData.theme)
  const safeNotes = esc(partyData.notes)

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
    <p>We have some <strong>important updates</strong> for ${safePartyChildName}'s ${partyData.childAge}th birthday party!</p>

    <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #ea580c;">What's Changed:</h4>
      <ul style="margin: 0; padding-left: 20px;">
        ${changesList.map(change => `<li style="margin: 5px 0;">${change}</li>`).join('')}
      </ul>
    </div>

    <div class="details-card">
      <h4 style="margin-top: 0; color: ${PRIMARY_COLOR};">Updated Party Details</h4>
      <div class="details-item"><span class="emoji">🎂</span> ${safePartyChildName}'s ${partyData.childAge}th Birthday${safeTheme ? ` (<em>${safeTheme} theme</em>)` : ''}</div>
      <div class="details-item"><span class="emoji">📅</span> ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item"><span class="emoji">📍</span> ${safeLocation}</div>
    </div>

    ${safeNotes ? `<p><strong>Special Notes:</strong> ${safeNotes}</p>` : ''}

    <p>Please note these changes and let us know if they affect your ability to attend. Your current RSVP is still valid, but you can update it if needed.</p>

    <p>We apologize for any inconvenience and look forward to celebrating with ${safeGuestChildName}!</p>
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
  token: string
) {
  const verifyUrl = `${getBaseUrl()}/api/auth/verify?token=${token}`

  const subject = 'Verify your email for Kid Party RSVP'
  const plainText = `Welcome to Kid Party RSVP!\n\nPlease verify your email address to enable automatic reminders and notifications for your parties.\n\nVerify Email: ${verifyUrl}\n\nIf you did not create this account, you can safely ignore this email.`

  const htmlContent = `
    <p class="greeting">Welcome to Kid Party RSVP!</p>
    <p>Please verify your email address to enable automatic reminders and notifications for your parties.</p>
    <p style="margin-top: 20px; font-size: 0.9em; color: #6b7280;">If you did not create this account, you can safely ignore this email.</p>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, verifyUrl, 'Verify Email')
  }
}

export function generatePasswordResetEmail(
  email: string,
  token: string
) {
  const resetUrl = `${getBaseUrl()}/en/login/reset-password?token=${token}`

  const subject = 'Reset your password for Kid Party RSVP'
  const plainText = `Password Reset Request\n\nYou requested to reset your password. Click the button below to set a new password. This link will expire in 1 hour.\n\nReset Password: ${resetUrl}\n\nIf you did not request this, please ignore this email.`

  const htmlContent = `
    <p class="greeting">Password Reset Request</p>
    <p>You requested to reset your password. Click the button below to set a new password. This link will expire in 1 hour.</p>
    <p style="margin-top: 20px; font-size: 0.9em; color: #6b7280;">If you did not request this, please ignore this email.</p>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, resetUrl, 'Reset Password')
  }
}

export function generateGuestMessageEmail(
  partyData: {
    childName: string
    childAge: number
    eventDatetime: Date
    location: string
    dashboardUrl: string
  },
  guestData: {
    childName: string
    email: string
    message: string
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

  const subject = `New message from ${guestData.childName}'s parent - ${partyData.childName}'s Party`

  const plainText = `You received a new message from a guest!

From: ${guestData.childName}'s parent (${guestData.email})

Message:
"${guestData.message}"

Party: ${partyData.childName}'s ${partyData.childAge}th Birthday Party
When: ${formatDate(partyData.eventDatetime)}
Where: ${partyData.location}

KidParty RSVP System`

  const safeMessage = guestData.message.replace(/\n/g, '<br>')

  const htmlContent = `
    <p class="greeting">New Guest Message</p>
    <p>You received a new message from a guest for <strong>${partyData.childName}'s</strong> party:</p>

    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 12px 0; font-size: 0.85em; color: #92400e;">
        <strong>💬 ${guestData.childName}'s parent</strong> &middot; ${guestData.email}
      </p>
      <p style="margin: 0; font-size: 1.05em; line-height: 1.7; color: #1f2937;">${safeMessage}</p>
    </div>

    <div class="details-card" style="border-left-color: ${SECONDARY_COLOR}; background-color: #fff1f2;">
      <h4 style="margin-top: 0; color: ${SECONDARY_COLOR};">🎂 Party Information</h4>
      <div class="details-item">• Event: ${partyData.childName}'s ${partyData.childAge}th Birthday Party</div>
      <div class="details-item">• When: ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item">• Where: ${partyData.location}</div>
    </div>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, partyData.dashboardUrl, 'View Party Dashboard')
  }
}

export function generateBroadcastEmail(
  partyData: {
    childName: string
    childAge: number
    eventDatetime: Date
    location: string
    rsvpUrl: string
  },
  broadcastSubject: string,
  broadcastMessage: string,
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

  const subject = broadcastSubject

  const plainText = `Message from ${hostName} about ${partyData.childName}'s ${partyData.childAge}th Birthday Party

${broadcastMessage}

Party Details:
When: ${formatDate(partyData.eventDatetime)}
Where: ${partyData.location}

KidParty RSVP System`

  const safeMessage = broadcastMessage.replace(/\n/g, '<br>')

  const htmlContent = `
    <p class="greeting">📢 Message from the Host</p>
    <p><strong>${hostName}</strong> sent you an update about <strong>${partyData.childName}'s ${partyData.childAge}th Birthday Party</strong>:</p>

    <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 1.05em; line-height: 1.7; color: #1f2937;">${safeMessage}</p>
    </div>

    <div class="details-card" style="border-left-color: ${SECONDARY_COLOR}; background-color: #fff1f2;">
      <h4 style="margin-top: 0; color: ${SECONDARY_COLOR};">🎂 Party Details</h4>
      <div class="details-item">• Event: ${partyData.childName}'s ${partyData.childAge}th Birthday Party</div>
      <div class="details-item">• When: ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item">• Where: ${partyData.location}</div>
    </div>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent, partyData.rsvpUrl, 'View Party Details')
  }
}

// ── Guest RSVP Confirmation Email (with ICS attachment) ───────────────────────

export function generateGuestRSVPConfirmationEmail(
  partyData: {
    partyId: string
    childName: string
    childAge: number
    eventDatetime: Date
    eventEndDatetime?: Date | null
    location: string
    theme?: string | null
    notes?: string | null
  },
  guestData: {
    guestName: string
    guestEmail: string
    status: 'YES' | 'MAYBE'
    numChildren: number
    parentStaying: boolean
    allergies?: string | null
    message?: string | null
  }
): { subject: string; text: string; html: string; icsAttachment: EmailAttachment } {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)

  const safePartyChildName = esc(partyData.childName)
  const safeGuestName = esc(guestData.guestName)
  const safeLocation = esc(partyData.location)
  const safeTheme = esc(partyData.theme)
  const safeNotes = esc(partyData.notes)
  const safeAllergies = esc(guestData.allergies)

  const isMaybe = guestData.status === 'MAYBE'
  const statusLabel = isMaybe ? 'Maybe' : 'Attending'
  const statusEmoji = isMaybe ? '🤔' : '🎉'

  const subject = `${statusEmoji} You're ${isMaybe ? 'maybe attending' : 'going to'} ${partyData.childName}'s Birthday Party!`

  // End time: use explicit end if available, otherwise +2 hours
  const endDatetime =
    partyData.eventEndDatetime
      ? new Date(partyData.eventEndDatetime)
      : new Date(partyData.eventDatetime.getTime() + 2 * 60 * 60 * 1000)

  // ICS description
  const icsDescLines = [
    `${partyData.childName}'s ${partyData.childAge}th Birthday Party`,
    partyData.theme ? `Theme: ${partyData.theme}` : '',
    partyData.notes ? `Notes: ${partyData.notes}` : '',
    '',
    `RSVP Status: ${statusLabel}`,
    guestData.status === 'YES'
      ? `Attending children: ${guestData.numChildren} | Parent staying: ${guestData.parentStaying ? 'Yes' : 'No'}`
      : '',
    guestData.allergies ? `Allergies: ${guestData.allergies}` : '',
  ].filter(Boolean).join('\n')

  const icsContent = generateICS({
    uid: partyData.partyId,
    title: `${partyData.childName}'s ${partyData.childAge}th Birthday Party`,
    description: icsDescLines,
    location: partyData.location,
    startDatetime: new Date(partyData.eventDatetime),
    endDatetime,
    attendeeEmail: guestData.guestEmail,
  })

  const plainText = `Hi ${guestData.guestName},

${isMaybe ? "You've indicated you might be able to attend" : "Great news! You're confirmed as attending"} ${partyData.childName}'s ${partyData.childAge}th birthday party.

Party Details:
🎂 ${partyData.childName}'s ${partyData.childAge}th Birthday${partyData.theme ? ` (${partyData.theme} theme)` : ''}
📅 ${formatDate(partyData.eventDatetime)}
📍 ${partyData.location}
${partyData.notes ? `\nSpecial Notes: ${partyData.notes}` : ''}
${guestData.status === 'YES' ? `\nYour details:
• Attending children: ${guestData.numChildren}
• Parent staying: ${guestData.parentStaying ? 'Yes' : 'No'}` : ''}
${guestData.allergies ? `• Allergies/Dietary Restrictions: ${guestData.allergies}` : ''}

A calendar invite (.ics) is attached — add it to your calendar so you don't forget!

See you there!
Kid Party RSVP Team`

  const htmlContent = `
    <p class="greeting">Hi ${safeGuestName}!</p>
    <p>${isMaybe ? "You've indicated you <strong>might be able to attend</strong>" : "You're <strong>confirmed as attending</strong>"} ${safePartyChildName}'s ${partyData.childAge}th birthday party.</p>

    <div style="font-size: 1.15em; padding: 16px; background: ${isMaybe ? '#fffbeb' : '#f0fdf4'}; border-radius: 10px; text-align: center; margin: 20px 0; border: 1px solid ${isMaybe ? '#fde68a' : '#bbf7d0'};">
      ${statusEmoji} <strong style="color: ${isMaybe ? '#92400e' : '#166534'};">RSVP: ${statusLabel}</strong>
    </div>

    <div class="details-card">
      <h3 style="margin-top: 0; color: ${PRIMARY_COLOR};">Party Details</h3>
      <div class="details-item"><span class="emoji">🎂</span> ${safePartyChildName}'s ${partyData.childAge}th Birthday${safeTheme ? ` (<em>${safeTheme} theme</em>)` : ''}</div>
      <div class="details-item"><span class="emoji">📅</span> ${formatDate(partyData.eventDatetime)}</div>
      <div class="details-item"><span class="emoji">📍</span> ${safeLocation}</div>
    </div>

    ${safeNotes ? `<p><strong>Special Notes:</strong> ${safeNotes}</p>` : ''}

    ${guestData.status === 'YES' ? `
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
      <p style="margin: 0 0 6px; font-weight: 600; color: #374151;">Your Details</p>
      <p style="margin: 4px 0; color: #4b5563;">👧 Attending children: <strong>${guestData.numChildren}</strong></p>
      <p style="margin: 4px 0; color: #4b5563;">🏠 Parent staying: <strong>${guestData.parentStaying ? 'Yes' : 'No'}</strong></p>
      ${safeAllergies ? `<p style="margin: 4px 0; color: #dc2626;">⚠️ Allergies/Dietary Restrictions: <strong>${safeAllergies}</strong></p>` : ''}
    </div>` : ''}

    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
      <p style="margin: 0; color: #1e40af; font-size: 0.95em;">
        📅 <strong>Calendar invite attached!</strong> Open the <code>.ics</code> file to add this event to Google Calendar, Apple Calendar, Outlook, or any other calendar app.
      </p>
    </div>
  `

  return {
    subject,
    text: plainText,
    html: wrapHtmlEmail(subject, htmlContent),
    icsAttachment: {
      filename: `${partyData.childName.replace(/\s+/g, '_')}_birthday_party.ics`,
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8; method=REQUEST',
      // inline=true → nodemailer adds this as a text/calendar MIME alternative
      // so Gmail detects it and shows the "Add to Calendar" button at the top.
      inline: true,
    },
  }
}
