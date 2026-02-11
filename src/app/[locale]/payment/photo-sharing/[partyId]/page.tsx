import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ partyId: string; locale: string }>
}

// Photo sharing is disabled
export default async function PhotoSharingPaymentPage({ params }: PageProps) {
  const { locale } = await params
  redirect(`/${locale}/dashboard`)
}
