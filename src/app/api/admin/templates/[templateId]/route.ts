import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { ensureThemeExists, getTemplate, toPrismaJsonValue } from '@/lib/template-store'
import type { TemplateConfig } from '@/types/invitation-template'
import { getEffectivePrice } from '@/types/invitation-template'

async function resolveTemplate(templateId: string) {
  const dbTemplate = await prisma.template.findUnique({
    where: { id: templateId },
  })

  if (dbTemplate) {
    return {
      id: dbTemplate.id,
      theme: dbTemplate.themeId,
      name: dbTemplate.name,
      imageUrl: dbTemplate.imageUrl,
      config: dbTemplate.config as unknown as TemplateConfig,
      effectivePrice: getEffectivePrice((dbTemplate.config as unknown as TemplateConfig).pricing),
    }
  }

  return getTemplate(templateId)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response!

  const { templateId } = await params

  try {
    const template = await resolveTemplate(templateId)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error loading template:', error)
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response!

  const { templateId } = await params

  try {
    const body = await request.json()
    const { config } = body as { config: TemplateConfig }

    if (!config) {
      return NextResponse.json({ error: 'Config is required' }, { status: 400 })
    }

    const existing = await prisma.template.findUnique({ where: { id: templateId } })
    const fallbackTemplate = !existing ? await getTemplate(templateId) : null

    if (!existing && !fallbackTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const themeId = existing?.themeId || fallbackTemplate!.theme
    const name = existing?.name || fallbackTemplate!.name
    const imageUrl = existing?.imageUrl || fallbackTemplate!.imageUrl

    await ensureThemeExists(themeId)
    await prisma.template.upsert({
      where: { id: templateId },
      update: {
        config: toPrismaJsonValue(config),
      },
      create: {
        id: templateId,
        themeId,
        name,
        imageUrl,
        config: toPrismaJsonValue(config),
      },
    })

    return NextResponse.json({
      success: true,
      id: templateId,
      config,
      effectivePrice: getEffectivePrice(config.pricing),
    })
  } catch (error) {
    console.error('Error updating template:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response!

  const { templateId } = await params

  try {
    const template = await resolveTemplate(templateId)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await prisma.template.deleteMany({
      where: { id: templateId },
    })

    const imagePath = template.imageUrl
      ? path.join(process.cwd(), 'public', template.imageUrl.replace(/^\//, '').replace(/\//g, path.sep))
      : null
    const legacyConfigPath = path.join(process.cwd(), 'public', 'invitations', template.theme, `${templateId}.json`)

    if (imagePath) {
      try {
        await fs.unlink(imagePath)
      } catch {
        // Ignore missing image.
      }
    }

    try {
      await fs.unlink(legacyConfigPath)
    } catch {
      // Ignore missing legacy JSON.
    }

    return NextResponse.json({ success: true, deleted: templateId })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
