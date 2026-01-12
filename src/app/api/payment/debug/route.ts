import { NextResponse } from 'next/server'

export async function GET() {
  const config = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    publishableKeyExists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    publishableKeyLength: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.length || 0,
    publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 10),

    secretKeyExists: !!process.env.STRIPE_SECRET_KEY,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10),

    webhookSecretExists: !!process.env.STRIPE_WEBHOOK_SECRET,
    webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10),

    environment: process.env.NODE_ENV,
  }

  return NextResponse.json(config, { status: 200 })
}
