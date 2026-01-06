'use client'

import { useEffect, useState } from 'react'
import PhotoUpload from '@/components/PhotoUpload'
import { formatDate } from '@/lib/utils'

interface Photo {
  id: string
  filename: string
  originalName: string
  caption?: string
  uploaderName: string
  uploadedAt: string
}

interface HostPhotoManagerProps {
  partyId: string
  childName: string
}

export default function HostPhotoManager({ partyId, childName }: HostPhotoManagerProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [partyId])

  const loadPhotos = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/parties/${partyId}/photos`)
      if (response.ok) {
        const data = await response.json()
        setPhotos(data.photos || [])
      } else {
        setError('Failed to load photos')
      }
    } catch (error) {
      setError('An error occurred while loading photos')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUploadSuccess = (newPhoto: Photo) => {
    setPhotos(prev => [newPhoto, ...prev])
    setShowUpload(false)
    setUploadError('')
  }

  const handlePhotoUploadError = (error: string) => {
    setUploadError(error)
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/photos/delete/${photoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId))
        setSelectedPhoto(null)
      } else {
        alert('Failed to delete photo')
      }
    } catch (error) {
      alert('An error occurred while deleting the photo')
    }
  }

  if (isLoading) {
    return (
      <div className="card mb-8">
        <div className="text-center py-8">
          <div className="text-neutral-600">Loading photos...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Party Photos
            </h2>
            <p className="text-neutral-600 text-sm">
              Manage and view all photos from {childName}'s party
            </p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="btn btn-primary"
          >
            {showUpload ? 'Cancel' : '📷 Upload Photos'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Upload Section */}
        {showUpload && (
          <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
            <h3 className="font-medium text-neutral-900 mb-3">Upload Photos</h3>
            {uploadError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {uploadError}
              </div>
            )}
            <PhotoUpload
              partyId={partyId}
              onUploadSuccess={handlePhotoUploadSuccess}
              onError={handlePhotoUploadError}
            />
          </div>
        )}

        {/* Photos Grid */}
        {photos.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-neutral-600">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/api/parties/${partyId}/photos/download`, '_blank')}
                  className="btn btn-secondary text-sm"
                >
                  📥 Download All
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-white rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-neutral-100 relative group cursor-pointer"
                       onClick={() => setSelectedPhoto(photo)}>
                    <img
                      src={`/api/photos/${photo.filename}`}
                      alt={photo.caption || photo.originalName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70">
                          👁️
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    {photo.caption && (
                      <p className="text-sm text-neutral-900 mb-1 line-clamp-2">{photo.caption}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>By {photo.uploaderName}</span>
                      <span>{formatDate(new Date(photo.uploadedAt))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No photos yet
            </h3>
            <p className="text-neutral-600 mb-4">
              Upload the first photo from {childName}'s party!
            </p>
            {!showUpload && (
              <button
                onClick={() => setShowUpload(true)}
                className="btn btn-primary"
              >
                📷 Upload First Photo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
             onClick={() => setSelectedPhoto(null)}>
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-neutral-900">
                  {selectedPhoto.caption || selectedPhoto.originalName}
                </h3>
                <p className="text-sm text-neutral-600">
                  By {selectedPhoto.uploaderName} • {formatDate(new Date(selectedPhoto.uploadedAt))}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/photos/${selectedPhoto.filename}`}
                  download={selectedPhoto.originalName}
                  className="btn btn-secondary text-sm"
                >
                  📥 Download
                </a>
                <button
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  className="btn btn-danger text-sm"
                >
                  🗑️ Delete
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-neutral-600 hover:text-neutral-800"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="max-h-[60vh] overflow-auto">
                <img
                  src={`/api/photos/${selectedPhoto.filename}`}
                  alt={selectedPhoto.caption || selectedPhoto.originalName}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}