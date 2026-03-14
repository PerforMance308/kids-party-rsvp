import fs from 'fs'
import path from 'path'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type {
  InvitationTemplate,
  TemplateConfig,
  TemplatesApiResponse,
  Theme,
  ThemeMetadata,
} from '@/types/invitation-template'
import { getEffectivePrice } from '@/types/invitation-template'

const INVITATIONS_DIR = path.join(process.cwd(), 'public', 'invitations')

const DEFAULT_THEME_NAMES: Record<string, { zh: string; en: string; icon: string }> = {
  default: { zh: '默认', en: 'Default', icon: '🎈' },
  dinosaur: { zh: '恐龙', en: 'Dinosaur', icon: '🦖' },
  princess: { zh: '公主', en: 'Princess', icon: '👸' },
  superhero: { zh: '超级英雄', en: 'Superhero', icon: '🦸' },
  unicorn: { zh: '独角兽', en: 'Unicorn', icon: '🦄' },
  pirate: { zh: '海盗', en: 'Pirate', icon: '🏴‍☠️' },
  space: { zh: '太空', en: 'Space', icon: '🚀' },
  safari: { zh: '丛林探险', en: 'Safari', icon: '🦁' },
  mermaid: { zh: '美人鱼', en: 'Mermaid', icon: '🧜‍♀️' },
  cars: { zh: '汽车', en: 'Cars', icon: '🚗' },
  robot: { zh: '机器人', en: 'Robot', icon: '🤖' },
  fairy: { zh: '精灵', en: 'Fairy', icon: '🧚' },
  sports: { zh: '运动', en: 'Sports', icon: '⚽' },
}

function humanizeTemplateName(templateId: string): string {
  return templateId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getDefaultThemeMetadata(themeId: string): ThemeMetadata {
  const fallback = DEFAULT_THEME_NAMES[themeId] || {
    zh: themeId.charAt(0).toUpperCase() + themeId.slice(1),
    en: themeId.charAt(0).toUpperCase() + themeId.slice(1),
    icon: '🎉',
  }

  return {
    name: { zh: fallback.zh, en: fallback.en },
    icon: fallback.icon,
  }
}

function normalizeTemplateConfig(config: TemplateConfig): TemplateConfig {
  if (config.pricing) return config

  return {
    ...config,
    pricing: {
      price: 1.39,
      currency: 'USD',
      isFree: false,
    },
  }
}

function toTemplateConfig(value: unknown): TemplateConfig {
  return normalizeTemplateConfig(value as unknown as TemplateConfig)
}

export function toPrismaJsonValue(value: TemplateConfig): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue
}

function parseThemeMetadata(themeId: string): ThemeMetadata {
  const themeJsonPath = path.join(INVITATIONS_DIR, themeId, 'theme.json')
  if (!fs.existsSync(themeJsonPath)) {
    return getDefaultThemeMetadata(themeId)
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(themeJsonPath, 'utf-8')) as ThemeMetadata
    return {
      ...getDefaultThemeMetadata(themeId),
      ...parsed,
      name: parsed.name || getDefaultThemeMetadata(themeId).name,
    }
  } catch {
    return getDefaultThemeMetadata(themeId)
  }
}

export function readFilesystemTemplateCatalog(): TemplatesApiResponse {
  if (!fs.existsSync(INVITATIONS_DIR)) {
    return { themes: [], totalTemplates: 0 }
  }

  const themeFolders = fs.readdirSync(INVITATIONS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  const themes: Theme[] = []
  let totalTemplates = 0

  for (const themeId of themeFolders) {
    const themePath = path.join(INVITATIONS_DIR, themeId)
    const files = fs.readdirSync(themePath)
    const metadata = parseThemeMetadata(themeId)
    const templates: InvitationTemplate[] = []

    for (const jsonFile of files.filter((file) => file.endsWith('.json') && file !== 'theme.json')) {
      const templateId = jsonFile.replace('.json', '')
      const configPath = path.join(themePath, jsonFile)

      try {
        const parsedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as TemplateConfig
        const config = normalizeTemplateConfig(parsedConfig)
        const imageUrl = config.template ? `/invitations/${themeId}/${config.template}` : ''

        if (!imageUrl && !config.backgroundColor) {
          continue
        }

        templates.push({
          id: templateId,
          theme: themeId,
          name: humanizeTemplateName(templateId),
          imageUrl,
          config,
          effectivePrice: getEffectivePrice(config.pricing),
        })
      } catch {
        // Skip malformed files.
      }
    }

    if (templates.length === 0) continue

    themes.push({
      id: themeId,
      name: metadata.name,
      description: metadata.description,
      icon: metadata.icon || getDefaultThemeMetadata(themeId).icon || '🎉',
      templates,
      templateCount: templates.length,
    })
    totalTemplates += templates.length
  }

  themes.sort((a, b) => a.id.localeCompare(b.id))
  return { themes, totalTemplates }
}

function mapDbTheme(theme: {
  id: string
  name: unknown
  description: unknown
  icon: string | null
  templates: Array<{
    id: string
    name: string
    imageUrl: string
    config: unknown
  }>
}): Theme {
  const metadata = getDefaultThemeMetadata(theme.id)

  const templates = theme.templates.map((template) => {
    const config = toTemplateConfig(template.config)

    return {
      id: template.id,
      theme: theme.id,
      name: template.name,
      imageUrl: template.imageUrl,
      config,
      effectivePrice: getEffectivePrice(config.pricing),
    }
  })

  return {
    id: theme.id,
    name: (theme.name as ThemeMetadata['name']) || metadata.name,
    description: (theme.description as ThemeMetadata['description']) || undefined,
    icon: theme.icon || metadata.icon || '🎉',
    templates,
    templateCount: templates.length,
  }
}

export async function listTemplates(): Promise<TemplatesApiResponse> {
  const fileCatalog = readFilesystemTemplateCatalog()
  const dbThemes = await prisma.templateTheme.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: {
      templates: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      },
    },
  })

  if (dbThemes.length === 0) return fileCatalog

  const mergedThemes = new Map<string, Theme>()

  for (const theme of fileCatalog.themes) {
    mergedThemes.set(theme.id, theme)
  }

  for (const dbTheme of dbThemes) {
    const mappedDbTheme = mapDbTheme(dbTheme)
    const existingTheme = mergedThemes.get(mappedDbTheme.id)

    if (!existingTheme) {
      mergedThemes.set(mappedDbTheme.id, mappedDbTheme)
      continue
    }

    const templateMap = new Map(existingTheme.templates.map((template) => [template.id, template]))
    for (const template of mappedDbTheme.templates) {
      templateMap.set(template.id, template)
    }

    mergedThemes.set(mappedDbTheme.id, {
      ...existingTheme,
      name: mappedDbTheme.name,
      description: mappedDbTheme.description,
      icon: mappedDbTheme.icon,
      templates: Array.from(templateMap.values()),
      templateCount: templateMap.size,
    })
  }

  const themes = Array.from(mergedThemes.values())
    .filter((theme) => theme.templates.length > 0)
    .sort((a, b) => a.id.localeCompare(b.id))

  return {
    totalTemplates: themes.reduce((sum, theme) => sum + theme.templates.length, 0),
    themes,
  }
}

export async function getTemplate(templateId: string): Promise<InvitationTemplate | null> {
  const dbTemplate = await prisma.template.findUnique({
    where: { id: templateId },
    include: {
      theme: true,
    },
  })

  if (dbTemplate && dbTemplate.isActive && dbTemplate.theme.isActive) {
    const config = toTemplateConfig(dbTemplate.config)
    return {
      id: dbTemplate.id,
      theme: dbTemplate.themeId,
      name: dbTemplate.name,
      imageUrl: dbTemplate.imageUrl,
      config,
      effectivePrice: getEffectivePrice(config.pricing),
    }
  }

  const fileCatalog = readFilesystemTemplateCatalog()
  for (const theme of fileCatalog.themes) {
    const fileTemplate = theme.templates.find((template) => template.id === templateId)
    if (fileTemplate) return fileTemplate
  }

  return null
}

export async function getTemplateConfig(templateId: string): Promise<TemplateConfig | null> {
  const template = await getTemplate(templateId)
  return template?.config || null
}

export async function findFirstFreeTemplateId(): Promise<string | null> {
  const catalog = await listTemplates()
  for (const theme of catalog.themes) {
    const freeTemplate = theme.templates.find((template) => template.effectivePrice.isFree)
    if (freeTemplate) return freeTemplate.id
  }

  return null
}

export async function ensureThemeExists(themeId: string): Promise<void> {
  const metadata = parseThemeMetadata(themeId)

  await prisma.templateTheme.upsert({
    where: { id: themeId },
    update: {},
    create: {
      id: themeId,
      name: metadata.name,
      description: metadata.description,
      icon: metadata.icon || null,
    },
  })
}
