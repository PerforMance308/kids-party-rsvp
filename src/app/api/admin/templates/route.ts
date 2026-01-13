import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import type { TemplateConfig } from '@/types/invitation-template'
import { getEffectivePrice } from '@/types/invitation-template'

const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'invitations')
const TARGET_SIZE = { width: 1000, height: 1400 }
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
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response!

  try {
    const formData = await request.formData()
    const theme = formData.get('theme') as string
    const templateId = formData.get('templateId') as string
    const imageFile = formData.get('image') as File | null
    const jsonFile = formData.get('json') as File | null
    const jsonContent = formData.get('jsonContent') as string | null

    if (!theme || !templateId) {
      return NextResponse.json({ error: 'Theme and templateId are required' }, { status: 400 })
    }

    // 验证templateId格式
    if (!/^[a-z0-9_]+$/.test(templateId)) {
      return NextResponse.json({ error: 'Template ID must contain only lowercase letters, numbers, and underscores' }, { status: 400 })
    }

    const themePath = path.join(TEMPLATES_DIR, theme)

    // 确保主题目录存在
    await fs.mkdir(themePath, { recursive: true })

    const imageFileName = `${templateId}.png`
    const jsonFileName = `${templateId}.json`
    const imagePath = path.join(themePath, imageFileName)
    const jsonPath = path.join(themePath, jsonFileName)

    // 处理图片上传
    if (imageFile) {
      if (imageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Image file too large (max 10MB)' }, { status: 400 })
      }

      const buffer = Buffer.from(await imageFile.arrayBuffer())

      // 使用sharp处理图片，调整尺寸
      const processedBuffer = await sharp(buffer)
        .resize(TARGET_SIZE.width, TARGET_SIZE.height, { fit: 'cover' })
        .png()
        .toBuffer()

      await fs.writeFile(imagePath, processedBuffer)
    }

    // 处理JSON配置
    let config: TemplateConfig

    if (jsonFile) {
      const jsonString = await jsonFile.text()
      config = JSON.parse(jsonString)
    } else if (jsonContent) {
      config = JSON.parse(jsonContent)
    } else {
      // 创建默认配置
      config = {
        template: imageFileName,
        canvas_size: [TARGET_SIZE.width, TARGET_SIZE.height],
        pricing: {
          price: 1.39,
          currency: 'USD',
          isFree: false,
        },
        elements: [
          {
            name: 'child_name',
            content: '',
            position: { x: 500, y: 400 },
            font: 'Arial-Bold',
            font_size: 48,
            color: '#FFFFFF',
            align: 'center',
          },
          {
            name: 'child_age',
            content: '',
            position: { x: 500, y: 500 },
            font: 'Arial-Bold',
            font_size: 72,
            color: '#FF6B35',
            align: 'center',
          },
          {
            name: 'date_time',
            content: '',
            position: { x: 300, y: 900 },
            font: 'Arial-Bold',
            font_size: 28,
            color: '#333333',
            align: 'left',
          },
          {
            name: 'location',
            content: '',
            position: { x: 300, y: 950 },
            font: 'Arial-Bold',
            font_size: 28,
            color: '#333333',
            align: 'left',
          },
        ],
        qr_code: {
          position: { x: 800, y: 1150 },
          size: 140,
        },
      }
    }

    // 确保template字段正确
    config.template = imageFileName

    // 保存JSON配置
    await fs.writeFile(jsonPath, JSON.stringify(config, null, 2))

    return NextResponse.json({
      success: true,
      templateId,
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
