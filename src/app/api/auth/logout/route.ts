import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils'

export async function POST() {
  const response = NextResponse.redirect(new URL('/', getBaseUrl()))
  
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  })

  return response
}