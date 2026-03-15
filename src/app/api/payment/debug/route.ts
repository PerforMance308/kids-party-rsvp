import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) {
    return adminCheck.response!
  }

  const config = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    publishableKeyExists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    publishableKeyLength: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.length || 0,
    publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 10),

    secretKeyExists: !!process.env.STRIPE_SECRET_KEY,
    webhookSecretExists: !!process.env.STRIPE_WEBHOOK_SECRET,

    environment: process.env.NODE_ENV,
  }

  return NextResponse.json(config, { status: 200 })
}
