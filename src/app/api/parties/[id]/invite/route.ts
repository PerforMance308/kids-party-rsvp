import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateInvitationEmail } from '@/lib/email'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // Verify party ownership
        const party = await prisma.party.findUnique({
            where: {
                id,
                userId: session.user.id
            },
            include: {
                user: true,
                child: true
            }
        })

        if (!party) {
            return NextResponse.json({ error: 'Party not found or access denied' }, { status: 404 })
        }

        const body = await request.json()
        const { emails } = body

        if (!Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: 'No emails provided' }, { status: 400 })
        }

        // Calculate child age
        const today = new Date()
        const birthDate = new Date(party.child.birthDate)
        const calculatedAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

        const childAge = party.targetAge ?? calculatedAge

        const emailContent = generateInvitationEmail(
            {
                childName: party.child.name,
                childAge,
                eventDatetime: party.eventDatetime,
                location: party.location,
                theme: party.theme || undefined,
                notes: party.notes || undefined,
                publicRsvpToken: party.publicRsvpToken
            },
            party.user.name || 'Your friend'
        )

        // Send emails in parallel
        const sendPromises = emails.map(email =>
            sendEmail({
                to: email,
                subject: emailContent.subject,
                text: emailContent.text,
                html: emailContent.html
            }).catch(err => {
                console.error(`Failed to send invite to ${email}:`, err)
                return null
            })
        )

        await Promise.all(sendPromises)

        return NextResponse.json({
            message: `Invitations sent to ${emails.length} recipients`,
            count: emails.length
        })

    } catch (error) {
        console.error('Send invites error:', error)
        return NextResponse.json(
            { error: 'Failed to send invitations' },
            { status: 500 }
        )
    }
}
