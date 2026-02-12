import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import fs from 'fs/promises'
import path from 'path'
import type { TemplateConfig } from '@/types/invitation-template'
import { getEffectivePrice } from '@/types/invitation-template'

const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'invitations')

// Resolve template ID to theme + baseName.
// Supports both "dinosaur_1" (theme embedded) and "1" (search all theme dirs).
async function resolveTemplateId(templateId: string): Promise<{ theme: string; baseName: string } | null> {
  // Try theme_number format first (e.g. "dinosaur_1" → theme "dinosaur")
  const parts = templateId.split('_')
  if (parts.length >= 2) {
    const theme = parts.slice(0, -1).join('_')
    const configPath = path.join(TEMPLATES_DIR, theme, `${templateId}.json`)
    try {
      await fs.access(configPath)
      return { theme, baseName: templateId }
    } catch {
      // File not found at expected path, fall through to search
    }
  }

  // Fallback: search all theme directories for this filename
  try {
    const folders = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true })
    for (const folder of folders.filter(d => d.isDirectory())) {
      const configPath = path.join(TEMPLATES_DIR, folder.name, `${templateId}.json`)
      try {
        await fs.access(configPath)
        return { theme: folder.name, baseName: templateId }
      } catch {
        // Not in this folder, continue
      }
    }
  } catch {
    // TEMPLATES_DIR doesn't exist
  }

  return null
}

// GET: 获取单个模板详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response!

  const { templateId } = await params
  const resolved = await resolveTemplateId(templateId)

  if (!resolved) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  try {
    const configPath = path.join(TEMPLATES_DIR, resolved.theme, `${resolved.baseName}.json`)
    const configContent = await fs.readFile(configPath, 'utf-8')
    const config: TemplateConfig = JSON.parse(configContent)

    return NextResponse.json({
      id: templateId,
      theme: resolved.theme,
      name: resolved.baseName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      imageUrl: `/invitations/${resolved.theme}/${config.template}`,
      config,
      effectivePrice: getEffectivePrice(config.pricing),
    })
  } catch (error) {
    console.error('Error loading template:', error)
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }
}

// PUT: 更新模板JSON配置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response!

  const { templateId } = await params
  const resolved = await resolveTemplateId(templateId)

  if (!resolved) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { config } = body as { config: TemplateConfig }

    if (!config) {
      return NextResponse.json({ error: 'Config is required' }, { status: 400 })
    }

    const configPath = path.join(TEMPLATES_DIR, resolved.theme, `${resolved.baseName}.json`)

    // 验证文件存在
    await fs.access(configPath)

    // 保存更新后的配置
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))

    return NextResponse.json({
      success: true,
      id: templateId,
      config,
      effectivePrice: getEffectivePrice(config.pricing),
    })
  } catch (error) {
    console.error('Error updating template:', error)
    if ((error as any).code === 'ENOENT') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

// DELETE: 删除模板
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response!

  const { templateId } = await params
  const resolved = await resolveTemplateId(templateId)

  if (!resolved) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  try {
    const themePath = path.join(TEMPLATES_DIR, resolved.theme)
    const configPath = path.join(themePath, `${resolved.baseName}.json`)

    // 读取配置获取图片文件名
    let config: TemplateConfig
    try {
      const configContent = await fs.readFile(configPath, 'utf-8')
      config = JSON.parse(configContent)
    } catch {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const imagePath = path.join(themePath, config.template)

    // 删除JSON文件
    await fs.unlink(configPath)

    // 尝试删除图片文件
    try {
      await fs.unlink(imagePath)
    } catch {
      // 图片可能不存在，忽略
    }

    return NextResponse.json({ success: true, deleted: templateId })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
