'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useLocale } from '@/contexts/LanguageContext'
import PhotoUpload from '@/components/PhotoUpload'

interface Party {
  id: string
  childName: string
  childAge: number
  eventDatetime: string
  location: string
  theme?: string
  notes?: string
  allowPhotoSharing: boolean
  photoSharingPaid: boolean
  guestCanSeeOthers: boolean
}

interface RSVP {
  id: string
  status: string
  numChildren: number
  parentStaying: boolean
  allergies?: string
  message?: string
  updatedAt: string
}

interface Guest {
  id: string
  parentName: string
  childName: string
  email: string
  phone?: string
  rsvp?: RSVP
}

interface Photo {
  id: string
  filename: string
  originalName: string
  caption?: string
  uploaderName: string
  uploadedAt: string
}

export default function GuestPartyPage() {
  const { token } = useParams()
  const router = useRouter()
  const locale = useLocale()
  const { data: session, status: sessionStatus } = useSession()
  const [party, setParty] = useState<Party | null>(null)
  const [myRSVP, setMyRSVP] = useState<RSVP | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'guests'>('details')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const isAuthenticated = sessionStatus === 'authenticated' && session?.user?.id

  useEffect(() => {
    const loadPartyData = async () => {
      if (!token || !isAuthenticated) return

      try {
        // Load party details and guest info
        const response = await fetch(`/api/party/guest/${token}`)
        if (response.ok) {
          const data = await response.json()
          setParty(data.party)
          setMyRSVP(data.myRSVP)
          setGuests(data.guests || [])
          setPhotos(data.photos || [])
        } else if (response.status === 404) {
          setError('Party not found or you don\'t have access')
        } else if (response.status === 401) {
          // Redirect to RSVP page if not RSVPed yet
          router.push(`/${locale}/rsvp/${token}`)
          return
        } else {
          setError('Failed to load party information')
        }
      } catch (error) {
        setError('An error occurred while loading the party')
      } finally {
        setIsLoading(false)
      }
    }

    loadPartyData()
  }, [token, isAuthenticated, router])

  const handleEditRSVP = () => {
    router.push(`/${locale}/rsvp/${token}`)
  }

  const handlePhotoUploadSuccess = (newPhoto: Photo) => {
    setPhotos(prev => [newPhoto, ...prev])
    setShowUpload(false)
    setUploadError('')
  }

  const handlePhotoUploadError = (error: string) => {
    setUploadError(error)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">
            Please sign in
          </h1>
          <p className="text-neutral-600 mb-4">
            You need to be signed in to access this party page.
          </p>
          <a href={`/${locale}/rsvp/${token}`} className="btn btn-primary">
            Go to RSVP
          </a>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">Loading party details...</div>
      </div>
    )
  }

  if (error || !party) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">
            {error || 'Party not found'}
          </h1>
          <p className="text-neutral-600 mb-4">
            This party may not exist or you don't have access to it.
          </p>
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const isPastEvent = new Date(party.eventDatetime) < new Date()

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Party Header */}
        <div className="card mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              {party.childName}'s {party.childAge}th Birthday Party 🎉
            </h1>
            {party.theme && (
              <p className="text-lg text-primary-700 mb-4">{party.theme} Theme</p>
            )}
            <div className="bg-primary-50 rounded-lg p-4 inline-block">
              <div className="space-y-2 text-sm text-primary-800">
                <p><strong>When:</strong> {formatDate(new Date(party.eventDatetime))}</p>
                <p><strong>Where:</strong> {party.location}</p>
                {isPastEvent && (
                  <p className="text-neutral-600">✅ This event has passed</p>
                )}
              </div>
            </div>
            {party.notes && (
              <div className="mt-4 p-3 bg-white rounded text-sm text-neutral-700">
                <strong>Special Notes:</strong> {party.notes}
              </div>
            )}
          </div>

          {/* Your RSVP Status */}
          {myRSVP && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900">Your RSVP</h3>
                  <p className="text-sm text-neutral-600">
                    Status: <span className={`font-medium ${
                      myRSVP.status === 'YES' ? 'text-green-600' :
                      myRSVP.status === 'NO' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {myRSVP.status === 'YES' ? 'Attending 🎉' :
                       myRSVP.status === 'NO' ? 'Can\'t make it 😢' : 'Maybe 🤔'}
                    </span>
                  </p>
                  {myRSVP.status !== 'NO' && (
                    <p className="text-sm text-neutral-600">
                      Children attending: {myRSVP.numChildren} • 
                      Parent staying: {myRSVP.parentStaying ? 'Yes' : 'No (drop-off)'}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleEditRSVP}
                  className="btn btn-secondary text-sm"
                >
                  Edit RSVP
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Party Details
              </button>
              
              {party.allowPhotoSharing && (
                <button
                  onClick={() => setActiveTab('photos')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'photos'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  Photos ({photos.length})
                  {!party.photoSharingPaid && (
                    <span className="ml-1 text-xs text-orange-600">Pro</span>
                  )}
                </button>
              )}

              {party.guestCanSeeOthers && (
                <button
                  onClick={() => setActiveTab('guests')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'guests'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  Guest List ({guests.filter(g => g.rsvp?.status === 'YES').length})
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="card">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              Party Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-neutral-700">Date & Time:</span>
                  <p className="text-neutral-900">{formatDate(new Date(party.eventDatetime))}</p>
                </div>
                <div>
                  <span className="font-medium text-neutral-700">Location:</span>
                  <p className="text-neutral-900">{party.location}</p>
                </div>
                {party.theme && (
                  <div>
                    <span className="font-medium text-neutral-700">Theme:</span>
                    <p className="text-neutral-900">{party.theme}</p>
                  </div>
                )}
              </div>
              
              {party.notes && (
                <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                  <span className="font-medium text-neutral-700">Special Notes:</span>
                  <p className="text-neutral-900 mt-1">{party.notes}</p>
                </div>
              )}

              {myRSVP && myRSVP.allergies && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <span className="font-medium text-neutral-700">Your Dietary Restrictions:</span>
                  <p className="text-neutral-900 mt-1">{myRSVP.allergies}</p>
                </div>
              )}

              {myRSVP && myRSVP.message && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <span className="font-medium text-neutral-700">Your Message:</span>
                  <p className="text-neutral-900 mt-1">{myRSVP.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'photos' && party.allowPhotoSharing && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-neutral-900">
                Party Photos
              </h3>
              {party.photoSharingPaid && (
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="btn btn-primary text-sm"
                >
                  {showUpload ? 'Cancel' : '📷 Upload Photo'}
                </button>
              )}
            </div>

            {/* Upload Component */}
            {party.photoSharingPaid && showUpload && (
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                <h4 className="font-medium text-neutral-900 mb-3">Upload a Photo</h4>
                {uploadError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {uploadError}
                  </div>
                )}
                <PhotoUpload
                  partyId={party.id}
                  onUploadSuccess={handlePhotoUploadSuccess}
                  onError={handlePhotoUploadError}
                />
              </div>
            )}

            {!party.photoSharingPaid ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📷</div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-2">
                  Photo Sharing Available
                </h4>
                <p className="text-neutral-600 mb-4">
                  The host needs to enable photo sharing for this party.
                </p>
                <p className="text-sm text-neutral-500">
                  Photo sharing allows everyone to upload and view party photos together.
                </p>
              </div>
            ) : photos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-white rounded-lg overflow-hidden shadow">
                    <div className="aspect-square bg-neutral-100 relative">
                      <img
                        src={`/api/photos/${photo.filename}`}
                        alt={photo.caption || photo.originalName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                    <div className="p-3">
                      {photo.caption && (
                        <p className="text-sm text-neutral-900 mb-1">{photo.caption}</p>
                      )}
                      <p className="text-xs text-neutral-500">
                        By {photo.uploaderName} • {formatDate(new Date(photo.uploadedAt))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📸</div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-2">
                  No photos yet
                </h4>
                <p className="text-neutral-600 mb-4">
                  Be the first to share a photo from this party!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'guests' && party.guestCanSeeOthers && (
          <div className="card">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              Guest List
            </h3>

            {guests.length > 0 ? (
              <div className="space-y-3">
                {guests.map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <div className="font-medium text-neutral-900">
                        {guest.parentName}
                      </div>
                      <div className="text-sm text-neutral-600">
                        with {guest.childName}
                      </div>
                    </div>
                    {guest.rsvp && (
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          guest.rsvp.status === 'YES' 
                            ? 'bg-green-100 text-green-800'
                            : guest.rsvp.status === 'NO'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {guest.rsvp.status === 'YES' ? 'Attending' :
                           guest.rsvp.status === 'NO' ? 'Not attending' : 'Maybe'}
                        </span>
                        {guest.rsvp.status === 'YES' && (
                          <div className="text-xs text-neutral-500 mt-1">
                            {guest.rsvp.numChildren} children
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <p>No guests have RSVPed yet.</p>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-8 text-sm text-neutral-500">
          Powered by Kid Party RSVP
        </div>
      </div>
    </div>
  )
}