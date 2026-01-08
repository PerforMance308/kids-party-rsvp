import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import PhotoSharingPayment from './PhotoSharingPayment'

interface PageProps {
  params: Promise<{ partyId: string; locale: string }>
}

export default async function PhotoSharingPaymentPage({ params }: PageProps) {
  const { partyId, locale } = await params
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.id) {
    redirect(`/${locale}/login`)
  }

  // Get party details
  const party = await prisma.party.findUnique({
    where: { 
      id: partyId,
      userId: session.user.id // Ensure user owns the party
    },
    include: {
      child: true
    }
  })

  if (!party) {
    notFound()
  }

  // Check if photo sharing is already enabled
  if (party.photoSharingPaid) {
    redirect(`/${locale}/party/${partyId}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-neutral-900 mb-4">
              Enable Photo Sharing
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Allow guests to share and view photos from{' '}
              <span className="font-medium text-purple-600">
                {party.child.name}'s
              </span>{' '}
              party. Create lasting memories together!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Features */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
                  What's Included
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">Unlimited Photo Upload</h3>
                      <p className="text-sm text-neutral-600">All guests can upload photos from the party</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">Shared Photo Gallery</h3>
                      <p className="text-sm text-neutral-600">Everyone can view all photos in one place</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">Download All Photos</h3>
                      <p className="text-sm text-neutral-600">Bulk download feature for easy sharing</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">Email Notifications</h3>
                      <p className="text-sm text-neutral-600">Automatic reminders to guests about photo sharing</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">High-Quality Storage</h3>
                      <p className="text-sm text-neutral-600">Photos stored safely in original quality</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  💡 Why Enable Photo Sharing?
                </h3>
                <p className="text-sm text-blue-800">
                  Studies show that shared photo experiences increase event satisfaction by 85% 
                  and help create lasting connections between families. Don't let those precious 
                  moments stay locked in individual phones!
                </p>
              </div>
            </div>

            {/* Payment Form */}
            <div>
              <PhotoSharingPayment 
                partyId={party.id}
                childName={party.child.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}