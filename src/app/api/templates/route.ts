import { NextResponse } from 'next/server'
import { listTemplates } from '@/lib/template-store'

export async function GET() {
  try {
    const response = await listTemplates()
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error loading templates:', error)
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    )
  }
}
