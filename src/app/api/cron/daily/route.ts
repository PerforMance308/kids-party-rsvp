import { NextRequest, NextResponse } from 'next/server'
import {
  scheduleBirthdayReminders,
  processPendingEmails,
  processPartyReminders24h,
} from '@/lib/notification-scheduler'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🕐 Daily cron job started')

    await scheduleBirthdayReminders()
    await processPartyReminders24h()
    const emailsProcessed = await processPendingEmails()

    console.log(`✅ Daily cron job completed. Emails processed: ${emailsProcessed}`)

    return NextResponse.json({
      success: true,
      emailsProcessed,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Daily cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
