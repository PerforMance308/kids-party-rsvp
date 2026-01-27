'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from '@/contexts/LanguageContext'
import { toast } from '@/lib/toast'
import CanvasInvitation from '@/components/CanvasInvitation'
import type { InvitationTemplate, TemplateConfig, TemplateElement, QRCodeConfig } from '@/types/invitation-template'
import QRCode from 'qrcode'
import { TrashIcon, PlusIcon, ArrowPathIcon, ArrowDownTrayIcon, CodeBracketSquareIcon } from '@heroicons/react/24/outline'

// Available element types
const ELEMENT_TYPES = [
  { value: 'child_name', label: 'Child Name' },
  { value: 'child_age', label: 'Child Age' },
  { value: 'date', label: 'Date Only' },
  { value: 'time', label: 'Time Only' },
  { value: 'date_time', label: 'Date & Time (Combined)' },
  { value: 'location', label: 'Location' },
  { value: 'theme', label: 'Theme' },
  { value: 'notes', label: 'Notes' },
  { value: 'text', label: 'Custom Text' },
]

// Available fonts
const FONT_OPTIONS = [
  { value: 'Arial-Bold', label: 'Arial Bold' },
  { value: 'Arial-Black', label: 'Arial Black' },
  { value: 'LuckiestGuy-Regular', label: 'Luckiest Guy' },
  { value: 'ComicSansMS', label: 'Comic Sans MS' },
]

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

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewQrCode, setPreviewQrCode] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'elements' | 'qrcode' | 'pricing' | 'preview_data'>('elements')

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Preview data
  const defaultStartTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const defaultEndTime = new Date(defaultStartTime.getTime() + 2 * 60 * 60 * 1000)
  const [previewData, setPreviewData] = useState({
    childName: 'Emma',
    childAge: 5,
    eventDatetime: defaultStartTime.toISOString(),
    eventEndDatetime: defaultEndTime.toISOString(),
    location: '123 Party Street, City',
    theme: 'Birthday',
    notes: 'Please RSVP by June 1st',
  })

  useEffect(() => {
    fetchTemplate()
  }, [templateId])

  // Generate Preview QR Code
  useEffect(() => {
    const generatePreviewQR = async () => {
      if (!template?.config?.qr_code) {
        setPreviewQrCode('')
        return
      }
      try {
        const qrCodeDataUrl = await QRCode.toDataURL('https://example.com/rsvp/preview', {
          errorCorrectionLevel: 'M',
          margin: 1,
          color: {
            dark: template.config.qr_code.darkColor || '#000000',
            light: template.config.qr_code.lightColor || '#FFFFFF',
          },
          width: 512,
        })
        setPreviewQrCode(qrCodeDataUrl)
      } catch (err) {
        console.error('Failed to generate preview QR code:', err)
      }
    }
    generatePreviewQR()
  }, [template?.config?.qr_code])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
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

  // Pre-process template config to split date_time if present
  useEffect(() => {
    if (!template) return

    const hasDateTime = template.config.elements.some(e => e.name === 'date_time')
    if (hasDateTime) {
      const newElements = template.config.elements.flatMap(element => {
        if (element.name === 'date_time') {
          const dateElement = { ...element, name: 'date' }
          const timeElement = {
            ...element,
            name: 'time',
            // Place time element below date
            position: { x: element.position.x, y: element.position.y + element.font_size * 1.5 }
          }
          return [dateElement, timeElement]
        }
        return [element]
      })

      setTemplate(prev => prev ? ({
        ...prev,
        config: { ...prev.config, elements: newElements }
      }) : null)

      toast.success('Automatically split Date & Time fields')
    }
  }, [template?.id])

  const handleSave = async () => {
    if (!template) return
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: template.config }),
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

  const handleDownload = async () => {
    if (!template?.imageUrl) return

    try {
      const response = await fetch(template.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.download = `${template.name.replace(/\s+/g, '_')}_original.jpg`
      link.href = url
      link.click()

      window.URL.revokeObjectURL(url)
    } catch (e) {
      toast.error('Failed to download image')
    }
  }

  const handleExportJSON = () => {
    if (!template) return
    const dataStr = JSON.stringify(template.config, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}_config.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }


  const updateElement = (index: number, updates: Partial<TemplateElement>) => {
    if (!template) return
    const newElements = [...template.config.elements]
    // If updating position, ensure it's nested correctly
    if (updates.position) {
      newElements[index] = {
        ...newElements[index],
        ...updates,
        position: { ...newElements[index].position, ...updates.position }
      }
    } else {
      newElements[index] = { ...newElements[index], ...updates }
    }

    setTemplate({
      ...template,
      config: { ...template.config, elements: newElements }
    })
  }

  const removeElement = (index: number) => {
    if (!template) return
    if (!confirm('Are you sure you want to delete this element?')) return

    const newElements = template.config.elements.filter((_, i) => i !== index)
    setTemplate({
      ...template,
      config: { ...template.config, elements: newElements }
    })
  }

  const addElement = () => {
    if (!template) return
    const newElement: TemplateElement = {
      name: 'text',
      content: 'New Text',
      position: { x: 500, y: 700 }, // Center-ish
      font: 'Arial-Bold',
      font_size: 40,
      color: '#000000',
      align: 'center'
    }
    setTemplate({
      ...template,
      config: { ...template.config, elements: [...template.config.elements, newElement] }
    })
  }

  const splitDateTime = (index: number) => {
    if (!template) return
    const element = template.config.elements[index]

    // Create 'date' element from current
    const dateElement = { ...element, name: 'date' }

    // Create 'time' element below it
    const timeElement = {
      ...element,
      name: 'time',
      position: { x: element.position.x, y: element.position.y + element.font_size * 1.5 }
    }

    // Insert into array
    const newElements = [...template.config.elements]
    newElements.splice(index, 1, dateElement, timeElement) // replace 1 with 2

    setTemplate({ ...template, config: { ...template.config, elements: newElements } })
  }

  const updateQrCode = (updates: Partial<QRCodeConfig> | undefined) => {
    if (!template) return

    // If updates is undefined, it means remove the QR code
    if (updates === undefined) {
      if (!confirm('Remove QR Code configuration?')) return
      const { qr_code, ...restConfig } = template.config
      setTemplate({
        ...template,
        config: restConfig
      })
      return
    }

    // Otherwise update or create
    const currentQr = template.config.qr_code || {
      position: { x: 500, y: 1000 },
      size: 200,
      darkColor: '#000000',
      lightColor: '#FFFFFF'
    }

    const newQr = { ...currentQr, ...updates }
    if (updates.position) {
      newQr.position = { ...currentQr.position, ...updates.position }
    }

    setTemplate({
      ...template,
      config: { ...template.config, qr_code: newQr }
    })
  }

  const updatePricing = (updates: any) => {
    if (!template) return
    setTemplate({
      ...template,
      config: {
        ...template.config,
        pricing: { ...template.config.pricing, ...updates }
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!template) return null

  const previewTemplate: InvitationTemplate = {
    id: template.id,
    theme: template.theme,
    name: template.name,
    imageUrl: template.imageUrl,
    config: template.config,
    effectivePrice: { price: 0, isFree: true, hasDiscount: false },
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/admin/templates`} className="text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit: {template.name}</h1>
            <span className="text-sm text-gray-500">{template.theme}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchTemplate()}
            title="Reload"
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            title="Download Preview"
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleExportJSON}
            title="Export JSON Config"
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <CodeBracketSquareIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Controls */}
        <div className="w-96 bg-gray-50 border-r flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b bg-white">
            <button
              onClick={() => setActiveTab('elements')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'elements' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
            >
              Elements
            </button>
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'qrcode' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
            >
              QR Code
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'pricing' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
            >
              Pricing
            </button>
            <button
              onClick={() => setActiveTab('preview_data')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'preview_data' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
            >
              Preview Data
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeTab === 'elements' && (
              <div className="space-y-4">
                <button
                  onClick={addElement}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-500 flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Element
                </button>

                {template.config.elements.map((element, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <select
                          value={element.name}
                          onChange={(e) => updateElement(index, { name: e.target.value })}
                          className="block w-full text-sm font-medium border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                          {ELEMENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeElement(index)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>

                    {element.name === 'date_time' && (
                      <button
                        onClick={() => splitDateTime(index)}
                        className="mb-3 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 w-full text-left"
                      >
                        ⚡ Split into Date & Time (2 lines)
                      </button>
                    )}

                    {element.name === 'text' && (
                      <div className="mb-3">
                        <label className="text-xs text-gray-500">Content</label>
                        <input
                          type="text"
                          value={element.content}
                          onChange={(e) => updateElement(index, { content: e.target.value })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-gray-500">X Position</label>
                        <input
                          type="number"
                          value={element.position.x}
                          onChange={(e) => updateElement(index, { position: { x: parseInt(e.target.value) || 0, y: element.position.y } })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Y Position</label>
                        <input
                          type="number"
                          value={element.position.y}
                          onChange={(e) => updateElement(index, { position: { x: element.position.x, y: parseInt(e.target.value) || 0 } })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-gray-500">Font Size</label>
                        <input
                          type="number"
                          value={element.font_size}
                          onChange={(e) => updateElement(index, { font_size: parseInt(e.target.value) || 12 })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Color</label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={element.color}
                            onChange={(e) => updateElement(index, { color: e.target.value })}
                            className="h-9 w-9 p-0 border border-gray-300 rounded overflow-hidden cursor-pointer"
                          />
                          <input
                            type="text"
                            value={element.color}
                            onChange={(e) => updateElement(index, { color: e.target.value })}
                            className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Font</label>
                        <select
                          value={element.font}
                          onChange={(e) => updateElement(index, { font: e.target.value })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        >
                          {FONT_OPTIONS.map(font => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                          ))}
                          {/* Fallback for custom fonts not in list */}
                          {!FONT_OPTIONS.find(f => f.value === element.font) && (
                            <option value={element.font}>{element.font}</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Align</label>
                        <select
                          value={element.align}
                          onChange={(e) => updateElement(index, { align: e.target.value as any })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'qrcode' && (
              <div className="space-y-4">
                {!template.config.qr_code ? (
                  <button
                    onClick={() => updateQrCode({})}
                    className="w-full py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100"
                  >
                    Add QR Code
                  </button>
                ) : (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">QR Code Settings</h3>
                      <button
                        onClick={() => updateQrCode(undefined)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">X Position</label>
                        <input
                          type="number"
                          value={template.config.qr_code.position.x}
                          onChange={(e) => updateQrCode({ position: { x: parseInt(e.target.value) || 0, y: template.config.qr_code!.position.y } })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Y Position</label>
                        <input
                          type="number"
                          value={template.config.qr_code.position.y}
                          onChange={(e) => updateQrCode({ position: { x: template.config.qr_code!.position.x, y: parseInt(e.target.value) || 0 } })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Size</label>
                        <input
                          type="number"
                          value={template.config.qr_code.size}
                          onChange={(e) => updateQrCode({ size: parseInt(e.target.value) || 100 })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">Dark Color (Code)</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={template.config.qr_code.darkColor || '#000000'}
                          onChange={(e) => updateQrCode({ darkColor: e.target.value })}
                          className="h-9 w-9 p-0 border border-gray-300 rounded overflow-hidden cursor-pointer"
                        />
                        <input
                          type="text"
                          value={template.config.qr_code.darkColor || '#000000'}
                          onChange={(e) => updateQrCode({ darkColor: e.target.value })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">Light Color (Background)</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={template.config.qr_code.lightColor || '#FFFFFF'}
                          onChange={(e) => updateQrCode({ lightColor: e.target.value })}
                          className="h-9 w-9 p-0 border border-gray-300 rounded overflow-hidden cursor-pointer"
                        />
                        <input
                          type="text"
                          value={template.config.qr_code.lightColor || '#FFFFFF'}
                          onChange={(e) => updateQrCode({ lightColor: e.target.value })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isFree"
                      checked={template.config.pricing?.isFree ?? true}
                      onChange={(e) => updatePricing({ isFree: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                    />
                    <label htmlFor="isFree" className="text-sm font-medium text-gray-900">Always Free</label>
                  </div>

                  {!(template.config.pricing?.isFree) && (
                    <>
                      <div>
                        <label className="text-xs text-gray-500">Price</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={template.config.pricing?.price ?? 0}
                          onChange={(e) => updatePricing({ price: parseFloat(e.target.value) || 0 })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Currency</label>
                        <select
                          value={template.config.pricing?.currency ?? 'USD'}
                          onChange={(e) => updatePricing({ currency: e.target.value })}
                          className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="CNY">CNY (¥)</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="pt-4 border-t">
                    <label className="text-xs text-gray-500 block mb-1">Free Until (Optional)</label>
                    <input
                      type="datetime-local"
                      value={template.config.pricing?.freeUntil ? new Date(template.config.pricing.freeUntil).toISOString().slice(0, 16) : ''}
                      onChange={(e) => updatePricing({ freeUntil: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">If set, template is free until this date.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preview_data' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                  <div>
                    <label className="text-xs text-gray-500">Child Name</label>
                    <input
                      type="text"
                      value={previewData.childName}
                      onChange={(e) => setPreviewData({ ...previewData, childName: e.target.value })}
                      className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Age</label>
                    <input
                      type="number"
                      value={previewData.childAge}
                      onChange={(e) => setPreviewData({ ...previewData, childAge: parseInt(e.target.value) || 0 })}
                      className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Location</label>
                    <input
                      type="text"
                      value={previewData.location}
                      onChange={(e) => setPreviewData({ ...previewData, location: e.target.value })}
                      className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Theme</label>
                    <input
                      type="text"
                      value={previewData.theme}
                      onChange={(e) => setPreviewData({ ...previewData, theme: e.target.value })}
                      className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Start Time</label>
                    <input
                      type="datetime-local"
                      value={previewData.eventDatetime.slice(0, 16)}
                      onChange={(e) => {
                        const startTime = new Date(e.target.value)
                        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000)
                        setPreviewData({
                          ...previewData,
                          eventDatetime: startTime.toISOString(),
                          eventEndDatetime: endTime.toISOString()
                        })
                      }}
                      className="w-full text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right - Preview Canvas */}
        <div className="flex-1 bg-gray-100 p-4 h-full overflow-hidden flex items-center justify-center">
          {/* 
                We use a container with the same aspect ratio as the canvas (1000/1400 = 5/7).
                max-h-full and max-w-full ensure it fits within the parent.
                The w-auto and h-auto allow the aspect-ratio to drive the actual size.
            */}
          <div
            className="bg-white shadow-lg rounded-lg overflow-hidden relative"
            style={{
              aspectRatio: '1000/1400',
              maxHeight: '100%',
              maxWidth: '100%',
              height: 'auto',
              width: 'auto'
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <CanvasInvitation
                template={previewTemplate}
                party={previewData}
                qrCodeUrl={previewQrCode}
                showControls={false}
                onRenderComplete={(canvas) => {
                  previewCanvasRef.current = canvas
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
