import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import type { TemplateConfig } from '@/types/invitation-template'
import { getEffectivePrice } from '@/types/invitation-template'

const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'invitations')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// GET: 获取所有模板
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response!

  try {
    // 确保目录存在
    try {
      await fs.access(TEMPLATES_DIR)
    } catch {
      return NextResponse.json({ templates: [], themes: [] })
    }

    const themeFolders = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true })
    const themes: string[] = []
    const templates: any[] = []

    for (const folder of themeFolders.filter(d => d.isDirectory())) {
      themes.push(folder.name)
      const themePath = path.join(TEMPLATES_DIR, folder.name)
      const files = await fs.readdir(themePath)

      for (const file of files.filter(f => f.endsWith('.json') && f !== 'theme.json')) {
        const baseName = file.replace('.json', '')
        const configPath = path.join(themePath, file)

        try {
          const configContent = await fs.readFile(configPath, 'utf-8')
          const config: TemplateConfig = JSON.parse(configContent)

          // 检查图片是否存在
          const hasImage = files.includes(config.template)

          templates.push({
            id: baseName,
            theme: folder.name,
            name: baseName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            imageUrl: `/invitations/${folder.name}/${config.template}`,
            config,
            effectivePrice: getEffectivePrice(config.pricing),
            hasImage,
          })
        } catch (e) {
          console.warn(`Failed to parse ${file}:`, e)
        }
      }
    }

    return NextResponse.json({ templates, themes })
  } catch (error) {
    console.error('Error loading templates:', error)
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 })
  }
}

// POST: 创建新模板（上传图片+JSON）
// Template ID is derived from the image filename (e.g. unicorn_1.png → unicorn_1)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response!

  try {
    const formData = await request.formData()
    const theme = formData.get('theme') as string
    const imageFile = formData.get('image') as File | null
    const jsonFile = formData.get('json') as File | null
    const jsonContent = formData.get('jsonContent') as string | null

    if (!theme) {
      return NextResponse.json({ error: 'Theme is required' }, { status: 400 })
    }

    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
    }

    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Image file too large (max 10MB)' }, { status: 400 })
    }

    // Derive template ID from image filename (strip extension, sanitize)
    const originalName = imageFile.name
    const ext = path.extname(originalName) // e.g. ".png"
    const baseName = path.basename(originalName, ext)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

    if (!baseName) {
      return NextResponse.json({ error: 'Invalid image filename' }, { status: 400 })
    }

    const themePath = path.join(TEMPLATES_DIR, theme)
    await fs.mkdir(themePath, { recursive: true })

    // Image keeps its sanitized name as PNG
    const imageFileName = `${baseName}.png`
    const jsonFileName = `${baseName}.json`
    const imagePath = path.join(themePath, imageFileName)
    const jsonPath = path.join(themePath, jsonFileName)

    // Process image with sharp (convert to PNG, read dimensions)
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const metadata = await sharp(buffer).metadata()
    const imgWidth = metadata.width || 1000
    const imgHeight = metadata.height || 1400

    const processedBuffer = await sharp(buffer)
      .png()
      .toBuffer()

    await fs.writeFile(imagePath, processedBuffer)

    // Handle JSON config
    let config: TemplateConfig

    if (jsonFile) {
      const jsonString = await jsonFile.text()
      config = JSON.parse(jsonString)
    } else if (jsonContent) {
      config = JSON.parse(jsonContent)
    } else {
      // Default config using actual image dimensions
      config = {
        template: imageFileName,
        canvas_size: [imgWidth, imgHeight],
        pricing: {
          price: 1.39,
          currency: 'USD',
          isFree: false,
        },
        elements: [
          {
            name: 'child_name',
            content: '',
            position: { x: Math.round(imgWidth / 2), y: Math.round(imgHeight * 0.28) },
            font: 'Arial-Bold',
            font_size: 48,
            color: '#FFFFFF',
            align: 'center',
          },
          {
            name: 'child_age',
            content: '',
            position: { x: Math.round(imgWidth / 2), y: Math.round(imgHeight * 0.36) },
            font: 'Arial-Bold',
            font_size: 72,
            color: '#FF6B35',
            align: 'center',
          },
          {
            name: 'date',
            content: '',
            position: { x: Math.round(imgWidth * 0.3), y: Math.round(imgHeight * 0.64) },
            font: 'Arial-Bold',
            font_size: 28,
            color: '#333333',
            align: 'left',
          },
          {
            name: 'time',
            content: '',
            position: { x: Math.round(imgWidth * 0.3), y: Math.round(imgHeight * 0.68) },
            font: 'Arial-Bold',
            font_size: 28,
            color: '#333333',
            align: 'left',
          },
          {
            name: 'location',
            content: '',
            position: { x: Math.round(imgWidth * 0.3), y: Math.round(imgHeight * 0.72) },
            font: 'Arial-Bold',
            font_size: 28,
            color: '#333333',
            align: 'left',
          },
        ],
        qr_code: {
          position: { x: Math.round(imgWidth * 0.8), y: Math.round(imgHeight * 0.82) },
          size: 140,
        },
      }
    }

    // Ensure template field points to actual image file
    config.template = imageFileName

    await fs.writeFile(jsonPath, JSON.stringify(config, null, 2))

    return NextResponse.json({
      success: true,
      templateId: baseName,
      theme,
      imageUrl: `/invitations/${theme}/${imageFileName}`,
    })
  } catch (error) {
    console.error('Error creating template:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
