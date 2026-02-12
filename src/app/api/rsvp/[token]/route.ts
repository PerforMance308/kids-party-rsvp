import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { sanitizeInput, isValidEmail, isValidUUID } from '@/lib/security'
import { rsvpSchema } from '@/lib/validations'
import { sendEmail, generateRSVPConfirmationEmail, generateHostRSVPNotificationEmail } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Validate token format
    if (!isValidUUID(token)) {
      return NextResponse.json({ error: 'Invalid invitation link' }, { status: 400 })
    }

    const party = await prisma.party.findUnique({
      where: { publicRsvpToken: token },
      include: {
        child: true
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Calculate child age
    const today = new Date()
    const birthDate = new Date(party.child.birthDate)
    const calculatedAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

    const childAge = (party as any).targetAge ?? calculatedAge

    // Check if user has existing RSVP
    let existingRsvp = null
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      const guest = await prisma.guest.findFirst({
        where: {
          partyId: party.id,
          email: session.user.email
        },
        include: {
          rsvp: true
        }
      })
      if (guest?.rsvp) {
        existingRsvp = {
          childName: guest.childName,
          childId: guest.childId,
          phone: guest.phone,
          status: guest.rsvp.status,
          numChildren: guest.rsvp.numChildren,
          parentStaying: guest.rsvp.parentStaying,
          allergies: guest.rsvp.allergies,
          message: guest.rsvp.message,
        }
      }
    }

    const partyData = {
      id: party.id,
      childName: party.child.name,
      childAge,
      eventDatetime: party.eventDatetime,
      location: party.location,
      theme: party.theme,
      notes: party.notes,
      existingRsvp,
    }

    return NextResponse.json(partyData)
  } catch (error) {
    console.error('Fetch party by token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Validate token format
    if (!isValidUUID(token)) {
      return NextResponse.json({ error: 'Invalid invitation link' }, { status: 400 })
    }

    const body = await request.json()
    const requestStatus = body.status

    // Get session (might be null for "not attending" responses)
    const session = await getServerSession(authOptions)

    // For "attending" or "maybe" responses, require authentication
    if ((requestStatus === 'YES' || requestStatus === 'MAYBE') && (!session || !session.user?.id)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = session?.user?.id ? {
      id: session.user.id,
      email: (session.user.email || '').toString()
    } : null

    const party = await prisma.party.findUnique({
      where: { publicRsvpToken: token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            language: true
          }
        }, // Include party host details for email notifications
        child: true // Include child details
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Check if user is the host (only if authenticated)
    if (user && party.userId === user.id) {
      return NextResponse.json(
        { error: '您不需要为您自己的派对提交接受邀请 (Host cannot RSVP to their own party)' },
        { status: 400 }
      )
    }

    // Validate and sanitize input - no email needed since user is authenticated
    const validatedData = {
      childName: sanitizeInput(body.childName || ''),
      childId: body.childId ? sanitizeInput(body.childId) : undefined,
      phone: body.phone ? sanitizeInput(body.phone) : undefined,
      status: body.status,
      numChildren: parseInt(body.numChildren) || 0,
      parentStaying: Boolean(body.parentStaying),
      allergies: body.allergies ? sanitizeInput(body.allergies) : undefined,
      message: body.message ? sanitizeInput(body.message) : undefined,
    }

    const {
      childName,
      childId,
      phone,
      status,
      numChildren,
      parentStaying,
      allergies,
      message,
    } = validatedData

    // Find or create guest by user and party
    let existingGuest = null

    if (user?.email) {
      existingGuest = await prisma.guest.findFirst({
        where: {
          partyId: party.id,
          email: user.email
        },
        include: {
          rsvp: true
        }
      })

      if (existingGuest) {
        // Update existing guest info
        await prisma.guest.update({
          where: { id: existingGuest.id },
          data: {
            childName,
            childId: childId || null,
            phone: phone || null,
            userId: user.id,
          }
        })

        if (existingGuest.rsvp) {
          // Update existing RSVP
          await prisma.rSVP.update({
            where: { id: existingGuest.rsvp.id },
            data: {
              status,
              numChildren,
              parentStaying,
              allergies: allergies || null,
              message: message || null,
            }
          })
        } else {
          // Create new RSVP
          await prisma.rSVP.create({
            data: {
              guestId: existingGuest.id,
              status,
              numChildren,
              parentStaying,
              allergies: allergies || null,
              message: message || null,
            }
          })
        }
      }
    }

    if (!existingGuest) {
      // Create new guest (with or without user link)
      const newGuest = await prisma.guest.create({
        data: {
          partyId: party.id,
          childName: childName || 'Anonymous',
          childId: childId || null,
          email: user?.email || `anonymous-${Date.now()}@no-email.com`, // Generate a unique email for anonymous guests
          phone: phone || null,
          userId: user?.id || null, // Null for anonymous "not attending" responses
        }
      })

      await prisma.rSVP.create({
        data: {
          guestId: newGuest.id,
          status,
          numChildren,
          parentStaying,
          allergies: allergies || null,
          message: message || null,
        }
      })
    }

    // Send email notification to party host (async, don't wait)
    const sendHostNotification = async () => {
      try {
        const today = new Date()
        const birthDate = new Date(party.child.birthDate)
        const childAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        const hostNotificationEmail = generateHostRSVPNotificationEmail(
          {
            childName: party.child.name,
            childAge,
            eventDatetime: party.eventDatetime,
            location: party.location
          },
          {
            childName,
            status,
            numChildren,
            parentStaying,
            allergies: allergies || undefined,
            message: message || undefined
          }
        )

        await sendEmail({
          to: party.user.email,
          subject: hostNotificationEmail.subject,
          text: hostNotificationEmail.text,
          html: hostNotificationEmail.html
        })
        console.log(`📧 Notification sent to host: ${party.user.email}`)
      } catch (emailError) {
        console.error('Failed to send host notification email:', emailError)
      }
    }
    // Fire and forget - don't await
    sendHostNotification()

    // Auto-save guest as a contact for the host (async, don't wait)
    if (user?.email) {
      const saveContact = async () => {
        try {
          const existingContact = await prisma.contact.findFirst({
            where: {
              userId: party.userId,
              email: user.email
            }
          })

          if (!existingContact) {
            await prisma.contact.create({
              data: {
                userId: party.userId,
                name: childName,
                childName: childName,
                email: user.email,
                phone: phone || null,
                source: 'RSVP'
              }
            })
            console.log(`✅ Auto-saved contact for host: ${user.email}`)
          }
        } catch (contactError) {
          console.error('Failed to auto-save contact:', contactError)
        }
      }
      // Fire and forget
      saveContact()
    }

    return NextResponse.json({ message: 'RSVP submitted successfully' })
  } catch (error) {
    console.error('RSVP submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit RSVP' },
      { status: 500 }
    )
  }
}