import { NextRequest, NextResponse } from 'next/server'
import { 
  processPendingEmails,
  scheduleBirthdayReminders 
} from '@/lib/notification-scheduler'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting notification processing...')

    // Process pending emails
    const emailsProcessed = await processPendingEmails()
    
    // Schedule birthday reminders
    await scheduleBirthdayReminders()

    console.log('✅ Notification processing completed')

    return NextResponse.json({
      success: true,
      emailsProcessed,
      message: 'Notification processing completed successfully'
    })
  } catch (error) {
    console.error('Error in notification processing:', error)
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    )
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Notification processor is running',
    timestamp: new Date().toISOString()
  })
}