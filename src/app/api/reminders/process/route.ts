import { NextRequest, NextResponse } from 'next/server'
import { processReminders } from '@/lib/scheduler'

export async function POST(request: NextRequest) {
  try {
    // In production, this endpoint should be secured
    // You could add API key authentication or restrict to specific IPs
    
    console.log('Processing reminders...')
    await processReminders()
    
    return NextResponse.json({ message: 'Reminders processed successfully' })
  } catch (error) {
    console.error('Error processing reminders:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Allow GET requests for easier testing
  return POST({} as NextRequest)
}