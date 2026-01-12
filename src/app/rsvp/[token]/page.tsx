import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function RsvpRedirect({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  // 默认重定向到英文版本
  redirect(`/en/rsvp/${token}`)
}
