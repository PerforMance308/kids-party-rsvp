import { prisma } from '@/lib/prisma'
import { 
  sendEmail,
  generatePhotoSharingAvailableEmail,
  generateBirthdayPartyReminderEmail
} from '@/lib/email'

export async function schedulePhotoSharingNotifications(partyId: string) {
  try {
    const party = await prisma.party.findUnique({
      where: { id: partyId },
      include: {
        child: true,
        guests: {
          include: {
            rsvp: true,
            user: true
          }
        }
      }
    })

    if (!party || !party.allowPhotoSharing || !party.photoSharingPaid) {
      console.log(`Party ${partyId}: Photo sharing not enabled, skipping notification scheduling`)
      return
    }

    // Schedule notifications for day after party
    const partyDate = new Date(party.eventDatetime)
    const notificationDate = new Date(partyDate)
    notificationDate.setDate(notificationDate.getDate() + 1)
    notificationDate.setHours(10, 0, 0, 0) // 10 AM next day

    const today = new Date()
    const childAge = Math.floor((today.getTime() - new Date(party.child.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))

    // Create notifications for all guests who RSVPed YES
    const attendingGuests = party.guests.filter(guest => guest.rsvp?.status === 'YES')
    
    for (const guest of attendingGuests) {
      if (!guest.user) continue // Skip guests without user accounts

      // Check if notification already exists
      const existingNotification = await prisma.emailNotification.findFirst({
        where: {
          userId: guest.user.id,
          type: 'PHOTO_SHARING_AVAILABLE',
          relatedId: partyId
        }
      })

      if (existingNotification) {
        console.log(`Photo sharing notification already exists for user ${guest.user.id}, party ${partyId}`)
        continue
      }

      const emailContent = generatePhotoSharingAvailableEmail(
        {
          childName: party.child.name,
          childAge: childAge,
          eventDatetime: party.eventDatetime,
          location: party.location,
          theme: party.theme || undefined,
          publicRsvpToken: party.publicRsvpToken
        },
        {
          parentName: guest.parentName,
          childName: guest.childName
        }
      )

      // Create scheduled notification
      await prisma.emailNotification.create({
        data: {
          userId: guest.user.id,
          email: guest.email,
          type: 'PHOTO_SHARING_AVAILABLE',
          subject: emailContent.subject,
          content: emailContent.text,
          relatedId: partyId,
          scheduledAt: notificationDate
        }
      })

      console.log(`📷 Scheduled photo sharing notification for ${guest.email} on ${notificationDate.toISOString()}`)
    }

    console.log(`✅ Photo sharing notifications scheduled for ${attendingGuests.length} guests`)
  } catch (error) {
    console.error('Error scheduling photo sharing notifications:', error)
  }
}

export async function scheduleBirthdayReminders() {
  try {
    const today = new Date()
    const threeWeeksFromNow = new Date(today)
    threeWeeksFromNow.setDate(today.getDate() + 21)

    // Get all children with birthdays in the next 3 weeks
    const children = await prisma.child.findMany({
      include: {
        user: true
      }
    })

    for (const child of children) {
      const childBirthday = new Date(child.birthDate)
      const thisYearBirthday = new Date(today.getFullYear(), childBirthday.getMonth(), childBirthday.getDate())
      
      // If birthday has passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1)
      }

      // Check if birthday is in 3 weeks (±2 days for flexibility)
      const timeDiff = thisYearBirthday.getTime() - today.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

      if (daysDiff >= 19 && daysDiff <= 23) { // 3 weeks ± 2 days
        // Check if reminder already sent this year
        const existingReminder = await prisma.emailNotification.findFirst({
          where: {
            userId: child.userId,
            type: 'BIRTHDAY_PARTY_REMINDER',
            relatedId: child.id,
            createdAt: {
              gte: new Date(today.getFullYear(), 0, 1) // Since start of year
            }
          }
        })

        if (existingReminder) {
          console.log(`Birthday reminder already sent for ${child.name} this year`)
          continue
        }

        const emailContent = generateBirthdayPartyReminderEmail(
          {
            name: child.name,
            birthDate: child.birthDate
          },
          {
            name: child.user.name || 'Parent'
          }
        )

        // Create immediate notification
        await prisma.emailNotification.create({
          data: {
            userId: child.userId,
            email: child.user.email,
            type: 'BIRTHDAY_PARTY_REMINDER',
            subject: emailContent.subject,
            content: emailContent.text,
            relatedId: child.id,
            scheduledAt: new Date() // Send immediately
          }
        })

        console.log(`🎂 Scheduled birthday reminder for ${child.name} (${child.user.email})`)
      }
    }
  } catch (error) {
    console.error('Error scheduling birthday reminders:', error)
  }
}

export async function processPendingEmails() {
  try {
    const now = new Date()
    
    // Get all pending notifications that are due to be sent
    const pendingEmails = await prisma.emailNotification.findMany({
      where: {
        status: 'pending',
        scheduledAt: {
          lte: now
        },
        attempts: {
          lt: 3 // Maximum 3 attempts
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      },
      take: 50 // Process max 50 at a time
    })

    console.log(`📧 Processing ${pendingEmails.length} pending emails...`)

    for (const notification of pendingEmails) {
      try {
        // Update attempts before sending
        await prisma.emailNotification.update({
          where: { id: notification.id },
          data: {
            attempts: notification.attempts + 1
          }
        })

        // Send email
        await sendEmail({
          to: notification.email,
          subject: notification.subject,
          text: notification.content
        })

        // Mark as sent
        await prisma.emailNotification.update({
          where: { id: notification.id },
          data: {
            status: 'sent',
            sentAt: new Date()
          }
        })

        console.log(`✅ Email sent to ${notification.email}: ${notification.subject}`)
      } catch (error) {
        console.error(`❌ Failed to send email to ${notification.email}:`, error)

        // Mark as failed if max attempts reached
        const newStatus = notification.attempts + 1 >= 3 ? 'failed' : 'pending'
        
        await prisma.emailNotification.update({
          where: { id: notification.id },
          data: {
            status: newStatus,
            error: error instanceof Error ? error.message : String(error)
          }
        })
      }
    }

    return pendingEmails.length
  } catch (error) {
    console.error('Error processing pending emails:', error)
    throw error
  }
}