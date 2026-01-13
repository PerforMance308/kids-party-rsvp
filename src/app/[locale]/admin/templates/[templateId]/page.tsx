'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from '@/contexts/LanguageContext'
import { toast } from '@/lib/toast'
import CanvasInvitation from '@/components/CanvasInvitation'
import type { InvitationTemplate, TemplateConfig } from '@/types/invitation-template'

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const templateId = params.templateId as string

  const [template, setTemplate] = useState<{
    id: string
    theme: string
    name: string
    imageUrl: string
    config: TemplateConfig
  } | null>(null)
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Preview data
  const [previewData, setPreviewData] = useState({
    childName: 'Emma',
    childAge: 5,
    eventDatetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: '123 Party Street, City',
    theme: 'Birthday',
    notes: '',
  })

  useEffect(() => {
    fetchTemplate()
  }, [templateId])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
        setJsonText(JSON.stringify(data.config, null, 2))
      } else {
        toast.error('Template not found')
        router.push(`/${locale}/admin/templates`)
      }
    } catch (error) {
      toast.error('Failed to load template')
    } finally {
      setLoading(false)
    }
  }

  const handleJsonChange = (value: string) => {
    setJsonText(value)
    setJsonError(null)

    try {
      const parsed = JSON.parse(value)
      setTemplate(prev => prev ? { ...prev, config: parsed } : null)
    } catch (e) {
      setJsonError((e as Error).message)
    }
  }

  const handleSave = async () => {
    if (jsonError) {
      toast.error('Please fix JSON errors before saving')
      return
    }

    setSaving(true)

    try {
      const config = JSON.parse(jsonText)
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })

      if (response.ok) {
        toast.success('Template saved successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText)
      setJsonText(JSON.stringify(parsed, null, 2))
      setJsonError(null)
    } catch (e) {
      setJsonError((e as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  // 创建用于预览的模板对象
  const previewTemplate: InvitationTemplate = {
    id: template.id,
    theme: template.theme,
    name: template.name,
    imageUrl: template.imageUrl,
    config: template.config,
    effectivePrice: { price: 0, isFree: true, hasDiscount: false },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/admin/templates`}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit: {template.name}
          </h1>
          <span className="px-2 py-1 bg-gray-200 rounded text-sm">{template.theme}</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !!jsonError}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JSON Editor */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">JSON Configuration</h2>
            <button
              onClick={formatJson}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Format JSON
            </button>
          </div>
          <div className="p-4">
            {jsonError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                JSON Error: {jsonError}
              </div>
            )}
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              className={`w-full h-[600px] font-mono text-sm p-4 border rounded-lg resize-none ${
                jsonError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          {/* Preview Data Controls */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Preview Data</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Child Name</label>
                <input
                  type="text"
                  value={previewData.childName}
                  onChange={(e) => setPreviewData(prev => ({ ...prev, childName: e.target.value }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Age</label>
                <input
                  type="number"
                  value={previewData.childAge}
                  onChange={(e) => setPreviewData(prev => ({ ...prev, childAge: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date/Time</label>
                <input
                  type="datetime-local"
                  value={previewData.eventDatetime.slice(0, 16)}
                  onChange={(e) => setPreviewData(prev => ({ ...prev, eventDatetime: new Date(e.target.value).toISOString() }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Location</label>
                <input
                  type="text"
                  value={previewData.location}
                  onChange={(e) => setPreviewData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          </div>

          {/* Canvas Preview */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Live Preview</h2>
            {!jsonError && template.config ? (
              <CanvasInvitation
                template={previewTemplate}
                party={previewData}
                showControls={false}
              />
            ) : (
              <div className="aspect-[5/7] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                Fix JSON errors to see preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
