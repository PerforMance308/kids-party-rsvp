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

    const partyData = {
      id: party.id,
      childName: party.child.name,
      childAge,
      eventDatetime: party.eventDatetime,
      location: party.location,
      theme: party.theme,
      notes: party.notes
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

    // Verify user authentication using NextAuth session
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = {
      id: session.user.id,
      email: (session.user.email || '').toString()
    }

    const party = await prisma.party.findUnique({
      where: { publicRsvpToken: token },
      include: {
        user: true, // Include party host details for email notifications
        child: true // Include child details
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Check if user is the host
    if (party.userId === user.id) {
      return NextResponse.json(
        { error: '您不需要为您自己的派对提交接受邀请 (Host cannot RSVP to their own party)' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate and sanitize input - no email needed since user is authenticated
    const validatedData = {
      parentName: sanitizeInput(body.parentName || ''),
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
      parentName,
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
    let existingGuest = await prisma.guest.findFirst({
      where: {
        partyId: party.id,
        email: (user.email || '').toString()
      },
      include: {
        rsvp: true
      }
    })

    if (existingGuest) {
      // If user already has an RSVP, block second submission
      if (existingGuest.rsvp) {
        return NextResponse.json(
          { error: '您已经提交过该派对的回复了 (You have already RSVP\'d to this party)' },
          { status: 400 }
        )
      }

      // Update existing guest info if no RSVP yet (unlikely given logic, but for safety)
      await prisma.guest.update({
        where: { id: existingGuest.id },
        data: {
          parentName,
          childName,
          childId: childId || null,
          phone: phone || null,
          userId: user.id,
        }
      })

      // Create RSVP
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
    } else {
      // Create new guest and RSVP linked to authenticated user
      const newGuest = await prisma.guest.create({
        data: {
          partyId: party.id,
          parentName,
          childName,
          childId: childId || null, // Link to child if selected
          email: (user.email || '').toString(),
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
      // Calculate child age for email
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
        text: hostNotificationEmail.text,
        html: hostNotificationEmail.html
      })

      console.log(`📧 Notification sent to host: ${party.user.email}`)
    } catch (emailError) {
      console.error('Failed to send host notification email:', emailError)
      // Don't fail the RSVP if email fails
    }

    // Auto-save guest as a contact for the host
    try {
      const existingContact = await prisma.contact.findFirst({
        where: {
          userId: party.userId,
          email: (user.email || '').toString()
        }
      })

      if (!existingContact) {
        await prisma.contact.create({
          data: {
            userId: party.userId,
            name: parentName,
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
      // Don't fail the RSVP if contact save fails
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