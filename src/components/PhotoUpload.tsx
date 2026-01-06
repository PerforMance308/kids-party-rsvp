'use client'

import { useState, useRef } from 'react'

interface PhotoUploadProps {
  partyId: string
  onUploadSuccess: (photo: any) => void
  onError: (error: string) => void
}

export default function PhotoUpload({ partyId, onUploadSuccess, onError }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onError('Please upload a JPEG, PNG, or WebP image')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError('File size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('partyId', partyId)
      if (caption.trim()) {
        formData.append('caption', caption.trim())
      }

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const photo = await response.json()
        onUploadSuccess(photo)
        setCaption('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        const data = await response.json()
        onError(data.error || 'Failed to upload photo')
      }
    } catch (error) {
      onError('An error occurred while uploading the photo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-neutral-300 hover:border-neutral-400'
        } ${isUploading ? 'opacity-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-3">
          <div className="text-4xl">📷</div>
          <div>
            <p className="text-sm font-medium text-neutral-700">
              {isUploading ? 'Uploading photo...' : 'Drag and drop a photo, or click to select'}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              JPEG, PNG, or WebP • Max 5MB
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Choose Photo'}
          </button>
        </div>
      </div>

      {/* Caption Input */}
      <div>
        <label htmlFor="caption" className="block text-sm font-medium text-neutral-700 mb-1">
          Caption (Optional)
        </label>
        <input
          type="text"
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="input"
          placeholder="Add a caption for your photo..."
          maxLength={200}
          disabled={isUploading}
        />
        <div className="text-xs text-neutral-500 mt-1">
          {caption.length}/200 characters
        </div>
      </div>
    </div>
  )
}