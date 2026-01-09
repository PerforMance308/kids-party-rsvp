'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale } from '@/contexts/LanguageContext'

interface Party {
  id: string
  childName: string
  photoSharingPaid: boolean
  allowPhotoSharing: boolean
  guestCanSeeOthers: boolean
}

interface PhotoSharingSectionProps {
  party: Party
  onUpdate: () => void
}

export default function PhotoSharingSection({ party, onUpdate }: PhotoSharingSectionProps) {
  const locale = useLocale()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTogglePhotoSharing = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/parties/${party.id}/photo-sharing`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        onUpdate()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to toggle photo sharing')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Photo Sharing</h2>
            <p className="text-neutral-600 text-sm">
              Allow guests to upload and view party photos together
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {party.photoSharingPaid ? (
              <>
                <span className="text-sm text-green-600 font-medium">✓ Enabled</span>
                <button
                  onClick={handleTogglePhotoSharing}
                  disabled={isLoading}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  {party.allowPhotoSharing ? 'Disable' : 'Enable'}
                </button>
              </>
            ) : (
              <Link
                href={`/${locale}/payment/photo-sharing/${party.id}`}
                className="btn btn-primary text-sm"
              >
                Enable Photo Sharing - $2.99
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-neutral-50 rounded-lg p-4">
          <h3 className="font-medium text-neutral-900 mb-2">Features included:</h3>
          <ul className="text-sm text-neutral-600 space-y-1">
            <li>• Unlimited photo uploads for all guests</li>
            <li>• Shared photo gallery viewable by everyone</li>
            <li>• Photo captions and uploader attribution</li>
            <li>• High-quality image storage and display</li>
            <li>• Download photos individually or as a collection</li>
          </ul>
        </div>

        {party.photoSharingPaid && (
          <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-green-800 font-medium text-sm">
                  📷 Photo sharing is {party.allowPhotoSharing ? 'active' : 'disabled'}
                </span>
                <p className="text-green-700 text-xs mt-1">
                  Guests can access photos at: /party/guest/[invitation-link]
                </p>
              </div>
              {party.allowPhotoSharing && (
                <div className="text-right">
                  <p className="text-green-800 text-sm">Guest Privacy Settings:</p>
                  <p className="text-green-700 text-xs">
                    Can see other guests: {party.guestCanSeeOthers ? 'Yes' : 'No'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </>
  )
}