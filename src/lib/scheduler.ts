import { prisma } from '@/lib/prisma'
import { sendEmail, generateReminderEmail } from '@/lib/email'

export async function createReminderSchedule(partyId: string) {
  const party = await prisma.party.findUnique({
    where: { id: partyId }
  })

  if (!party) {
    throw new Error('Party not found')
  }

  const eventDate = new Date(party.eventDatetime)
  const now = new Date()

  // Calculate reminder dates
  const sevenDaysBefore = new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoDaysBefore = new Date(eventDate.getTime() - 2 * 24 * 60 * 60 * 1000)
  const sameDayMorning = new Date(eventDate)
  sameDayMorning.setHours(9, 0, 0, 0) // 9 AM on the same day

  const reminderTypes = [
    { type: 'SEVEN_DAYS' as const, date: sevenDaysBefore },
    { type: 'TWO_DAYS' as const, date: twoDaysBefore },
    { type: 'SAME_DAY' as const, date: sameDayMorning },
  ]

  // Create reminder records for future dates
  for (const reminder of reminderTypes) {
    if (reminder.date > now) {
      await prisma.reminder.create({
        data: {
          partyId,
          type: reminder.type,
        }
      })
    }
  }
}

export async function processReminders() {
  const now = new Date()
  
  // Find parties with events in the next 24 hours that need reminders
  const upcomingParties = await prisma.party.findMany({
    where: {
      eventDatetime: {
        gte: now,
        lte: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000) // Next 8 days
      }
    },
    include: {
      child: true,
      guests: true,
      reminders: true,
    }
  })

  for (const party of upcomingParties) {
    const eventDate = new Date(party.eventDatetime)
    const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    let reminderType: 'SEVEN_DAYS' | 'TWO_DAYS' | 'SAME_DAY' | null = null
    
    if (daysUntilEvent === 7) {
      reminderType = 'SEVEN_DAYS'
    } else if (daysUntilEvent === 2) {
      reminderType = 'TWO_DAYS'
    } else if (daysUntilEvent === 0) {
      reminderType = 'SAME_DAY'
    }

    if (!reminderType) continue

    // Check if reminder was already sent
    const existingReminder = party.reminders.find(
      r => r.type === reminderType && r.sentAt
    )
    
    if (existingReminder) continue

    // Send reminders to all guests
    const rsvpUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/rsvp/${party.publicRsvpToken}`
    
    for (const guest of party.guests) {
      try {
        // Calculate child age
        const today = new Date()
        const birthDate = new Date(party.child.birthDate)
        const childAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        
        const emailContent = generateReminderEmail(
          {
            childName: party.child.name,
            childAge: childAge,
            eventDatetime: party.eventDatetime,
            location: party.location,
            theme: party.theme || undefined,
            notes: party.notes || undefined,
            rsvpUrl,
          },
          {
            parentName: guest.parentName,
            childName: guest.childName,
          },
          reminderType
        )

        await sendEmail({
          to: guest.email,
          ...emailContent,
        })
      } catch (error) {
        console.error(`Failed to send reminder to ${guest.email}:`, error)
      }
    }

    // Mark reminder as sent
    const reminder = party.reminders.find(r => r.type === reminderType)
    if (reminder) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sentAt: new Date() }
      })
    } else {
      await prisma.reminder.create({
        data: {
          partyId: party.id,
          type: reminderType,
          sentAt: new Date(),
        }
      })
    }

    console.log(`Sent ${reminderType} reminders for ${party.child.name}'s party`)
  }
}