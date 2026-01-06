import { NextRequest, NextResponse } from 'next/server'
import { 
  processPendingEmails,
  scheduleBirthdayReminders 
} from '@/lib/notification-scheduler'

// This endpoint would be called by a cron job in production
// For development/demo, it can be called manually
export async function POST(request: NextRequest) {
  try {
    // In production, you'd want to add authentication here
    // For demo purposes, we'll allow it without auth
    
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
  return NextResponse.json({
    message: 'Manual notification trigger endpoint',
    usage: 'POST to this endpoint to manually trigger notification processing',
    note: 'In production, this would be replaced by a cron job'
  })
}