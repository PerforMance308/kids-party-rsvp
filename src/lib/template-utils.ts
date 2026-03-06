import fs from 'fs'
import path from 'path'
import type { TemplateConfig } from '@/types/invitation-template'
export { getEffectivePrice } from '@/types/invitation-template'

function readTemplateConfig(configPath: string): TemplateConfig | null {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch {
    return null
  }
}

function resolveTemplateConfigPath(templateId: string): string | null {
  const invitationsDir = path.join(process.cwd(), 'public', 'invitations')

  if (!templateId || !fs.existsSync(invitationsDir)) {
    return null
  }

  // Backward-compatible format: theme embedded in templateId, e.g. dinosaur_1.
  const parts = templateId.split('_')
  if (parts.length >= 2) {
    const themeName = parts.slice(0, -1).join('_')
    const directPath = path.join(invitationsDir, themeName, `${templateId}.json`)
    if (fs.existsSync(directPath)) {
      return directPath
    }
  }

  // Fallback format: bare template id, e.g. capibara -> search all theme dirs.
  const themeFolders = fs.readdirSync(invitationsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  for (const themeFolder of themeFolders) {
    const configPath = path.join(invitationsDir, themeFolder, `${templateId}.json`)
    if (fs.existsSync(configPath)) {
      return configPath
    }
  }

  return null
}

export function getTemplateConfig(templateId: string): TemplateConfig | null {
  const configPath = resolveTemplateConfigPath(templateId)
  if (!configPath) return null
  return readTemplateConfig(configPath)
}

