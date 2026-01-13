'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useLocale } from '@/contexts/LanguageContext'
import { toast } from '@/lib/toast'

interface Template {
  id: string
  theme: string
  name: string
  imageUrl: string
  hasImage: boolean
  config: any
  effectivePrice: {
    price: number
    isFree: boolean
  }
}

export default function AdminTemplatesPage() {
  const locale = useLocale()
  const [templates, setTemplates] = useState<Template[]>([])
  const [themes, setThemes] = useState<string[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Upload form state
  const [uploadTheme, setUploadTheme] = useState('')
  const [uploadTemplateId, setUploadTemplateId] = useState('')
  const [newTheme, setNewTheme] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
        setThemes(data.themes)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm(`Delete template "${templateId}"? This cannot be undone.`)) return

    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Template deleted')
        fetchTemplates()
      } else {
        toast.error('Failed to delete template')
      }
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    const theme = newTheme || uploadTheme
    if (!theme || !uploadTemplateId) {
      toast.error('Theme and Template ID are required')
      return
    }

    const imageFile = imageInputRef.current?.files?.[0]
    const jsonFile = jsonInputRef.current?.files?.[0]

    if (!imageFile) {
      toast.error('Image file is required')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('theme', theme)
      formData.append('templateId', uploadTemplateId)
      formData.append('image', imageFile)
      if (jsonFile) {
        formData.append('json', jsonFile)
      }

      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast.success('Template uploaded successfully')
        setShowUpload(false)
        setUploadTheme('')
        setUploadTemplateId('')
        setNewTheme('')
        if (imageInputRef.current) imageInputRef.current.value = ''
        if (jsonInputRef.current) jsonInputRef.current.value = ''
        fetchTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Upload failed')
      }
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const filteredTemplates = selectedTheme
    ? templates.filter(t => t.theme === selectedTheme)
    : templates

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showUpload ? 'Cancel' : '+ Upload Template'}
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upload New Template</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Theme</label>
                <select
                  value={uploadTheme}
                  onChange={(e) => setUploadTheme(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={!!newTheme}
                >
                  <option value="">Select existing theme...</option>
                  {themes.map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Or Create New Theme</label>
                <input
                  type="text"
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="e.g. unicorn"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Template ID</label>
              <input
                type="text"
                value={uploadTemplateId}
                onChange={(e) => setUploadTemplateId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="e.g. 1 (will become theme_1)"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Final ID: {(newTheme || uploadTheme) && uploadTemplateId ? `${newTheme || uploadTheme}_${uploadTemplateId}` : '...'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Image (PNG/JPG) *</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Will be resized to 1000x1400</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">JSON Config (optional)</label>
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept="application/json"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for default config</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      )}

      {/* Theme Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedTheme(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!selectedTheme ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          All ({templates.length})
        </button>
        {themes.map(theme => (
          <button
            key={theme}
            onClick={() => setSelectedTheme(theme)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTheme === theme ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {theme} ({templates.filter(t => t.theme === theme).length})
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="aspect-[5/7] bg-gray-100 relative">
              {template.hasImage ? (
                <img
                  src={template.imageUrl}
                  alt={template.name}
                  className="w-full h-full object-fill aspect-[5/7]"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Image
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${template.effectivePrice.isFree
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-500 text-white'
                  }`}>
                  {template.effectivePrice.isFree ? 'FREE' : `$${template.effectivePrice.price}`}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-500">{template.theme}</p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/${locale}/admin/templates/${template.id}`}
                  className="flex-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded text-sm font-medium text-center hover:bg-primary-200"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No templates found. Upload one to get started.
        </div>
      )}
    </div>
  )
}
