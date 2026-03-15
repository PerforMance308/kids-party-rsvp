import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { isUndeliverableGuestEmail } from '@/lib/utils'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.authorized) {
      return adminCheck.response!
    }

    const { id } = await params
    const original = await prisma.emailNotification.findUnique({
      where: { id }
    })

    if (!original) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (isUndeliverableGuestEmail(original.email)) {
      return NextResponse.json(
        { error: 'This notification has no deliverable email address' },
        { status: 400 }
      )
    }

    const retryRecord = await prisma.emailNotification.create({
      data: {
        userId: original.userId,
        email: original.email,
        type: original.type,
        subject: original.subject,
        content: original.content,
        htmlContent: original.htmlContent,
        relatedId: original.relatedId,
        status: 'pending',
        scheduledAt: new Date(),
      }
    })

    try {
      await prisma.emailNotification.update({
        where: { id: retryRecord.id },
        data: {
          attempts: 1,
        }
      })

      await sendEmail({
        to: retryRecord.email,
        subject: retryRecord.subject,
        text: retryRecord.content,
        html: retryRecord.htmlContent || undefined,
      })

      await prisma.emailNotification.update({
        where: { id: retryRecord.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          error: null,
        }
      })
    } catch (error) {
      await prisma.emailNotification.update({
        where: { id: retryRecord.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        }
      })

      throw error
    }

    return NextResponse.json({
      success: true,
      id: retryRecord.id,
      message: `Notification resent to ${retryRecord.email}`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Admin retry notification error:', error)
    return NextResponse.json(
      {
        error: 'Failed to resend notification',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
