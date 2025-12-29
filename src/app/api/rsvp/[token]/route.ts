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
      select: {
        id: true,
        childName: true,
        childAge: true,
        eventDatetime: true,
        location: true,
        theme: true,
        notes: true,
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    return NextResponse.json(party)
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

    // Verify user authentication using NextAuth session
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = {
      id: session.user.id,
      email: session.user.email
    }

    const party = await prisma.party.findUnique({
      where: { publicRsvpToken: token },
      include: {
        user: true // Include party host details for email notifications
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    const body = await request.json()
    
    // Validate and sanitize input - no email needed since user is authenticated
    const validatedData = {
      parentName: sanitizeInput(body.parentName || ''),
      childName: sanitizeInput(body.childName || ''),
      phone: body.phone ? sanitizeInput(body.phone) : undefined,
      status: body.status,
      numChildren: parseInt(body.numChildren) || 0,
      parentStaying: Boolean(body.parentStaying),
      allergies: body.allergies ? sanitizeInput(body.allergies) : undefined,
      message: body.message ? sanitizeInput(body.message) : undefined,
    }

    const {
      parentName,
      childName,
      phone,
      status,
      numChildren,
      parentStaying,
      allergies,
      message,
    } = validatedData

    // Find or create guest by user and party
    let existingGuest = await prisma.guest.findFirst({
      where: {
        partyId: party.id,
        email: user.email
      },
      include: {
        rsvp: true
      }
    })

    if (existingGuest) {
      // Update existing guest
      await prisma.guest.update({
        where: { id: existingGuest.id },
        data: {
          parentName,
          childName,
          phone: phone || null,
          userId: user.id, // Link to authenticated user
        }
      })

      // Update or create RSVP
      if (existingGuest.rsvp) {
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
    } else {
      // Create new guest and RSVP linked to authenticated user
      const newGuest = await prisma.guest.create({
        data: {
          partyId: party.id,
          parentName,
          childName,
          email: user.email,
          phone: phone || null,
          userId: user.id, // Link to authenticated user
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

    // Send email notification to party host only
    try {
      const hostNotificationEmail = generateHostRSVPNotificationEmail(
        {
          childName: party.childName,
          childAge: party.childAge,
          eventDatetime: party.eventDatetime,
          location: party.location
        },
        {
          parentName,
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
        text: hostNotificationEmail.text
      })
      
      console.log(`📧 Notification sent to host: ${party.user.email}`)
    } catch (emailError) {
      console.error('Failed to send host notification email:', emailError)
      // Don't fail the RSVP if email fails
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