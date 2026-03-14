import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { ensureThemeExists, listTemplates, toPrismaJsonValue } from '@/lib/template-store'
import type { TemplateConfig } from '@/types/invitation-template'
import { getEffectivePrice } from '@/types/invitation-template'

const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'invitations')
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response!

  try {
    const catalog = await listTemplates()
    return NextResponse.json({
      templates: catalog.themes.flatMap((theme) =>
        theme.templates.map((template) => ({
          ...template,
          hasImage: Boolean(template.imageUrl),
        }))
      ),
      themes: catalog.themes.map((theme) => theme.id),
    })
  } catch (error) {
    console.error('Error loading templates:', error)
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 })
  }
}

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

    const originalName = imageFile.name
    const ext = path.extname(originalName)
    const baseName = path.basename(originalName, ext)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

    if (!baseName) {
      return NextResponse.json({ error: 'Invalid image filename' }, { status: 400 })
    }

    const themePath = path.join(TEMPLATES_DIR, theme)
    await fs.mkdir(themePath, { recursive: true })

    const imageFileName = `${baseName}.png`
    const imagePath = path.join(themePath, imageFileName)

    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const metadata = await sharp(buffer).metadata()
    const imgWidth = metadata.width || 1000
    const imgHeight = metadata.height || 1400

    const processedBuffer = await sharp(buffer)
      .png()
      .toBuffer()

    await fs.writeFile(imagePath, processedBuffer)

    let config: TemplateConfig

    if (jsonFile) {
      config = JSON.parse(await jsonFile.text())
    } else if (jsonContent) {
      config = JSON.parse(jsonContent)
    } else {
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

    config.template = imageFileName

    await ensureThemeExists(theme)
    await prisma.template.upsert({
      where: { id: baseName },
      update: {
        themeId: theme,
        name: baseName.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        imageUrl: `/invitations/${theme}/${imageFileName}`,
        config: toPrismaJsonValue(config),
      },
      create: {
        id: baseName,
        themeId: theme,
        name: baseName.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        imageUrl: `/invitations/${theme}/${imageFileName}`,
        config: toPrismaJsonValue(config),
      },
    })

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
