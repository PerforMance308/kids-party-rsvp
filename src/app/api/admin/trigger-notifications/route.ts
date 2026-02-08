import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import {
  processPendingEmails,
  scheduleBirthdayReminders
} from '@/lib/notification-scheduler'

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.authorized) {
      return adminCheck.response!
    }

    console.log('🚀 Manual notification trigger started...')

    // Process pending emails
    const emailsProcessed = await processPendingEmails()
    console.log(`📧 Processed ${emailsProcessed} pending emails`)
    
    // Schedule birthday reminders for children with upcoming birthdays
    await scheduleBirthdayReminders()
    console.log('🎂 Birthday reminders scheduled')

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      emailsProcessed,
      message: 'Notifications processed successfully'
    }

    console.log('✅ Manual notification trigger completed:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error in manual notification trigger:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process notifications',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) {
    return adminCheck.response!
  }

  return NextResponse.json({
    message: 'Manual notification trigger endpoint',
    usage: 'POST to this endpoint to manually trigger notification processing',
    note: 'In production, this would be replaced by a cron job'
  })
}