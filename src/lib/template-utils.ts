import fs from 'fs'
import path from 'path'
import type { TemplateConfig } from '@/types/invitation-template'
export { getEffectivePrice } from '@/types/invitation-template'

// 获取模板配置
export function getTemplateConfig(templateId: string): TemplateConfig | null {
  // 从模板ID解析主题名（格式为 theme_number，如 dinosaur_1）
  const parts = templateId.split('_')
  if (parts.length < 2) return null

  const themeName = parts.slice(0, -1).join('_')
  const configPath = path.join(
    process.cwd(),
    'public',
    'invitations',
    themeName,
    `${templateId}.json`
  )

  if (!fs.existsSync(configPath)) {
    return null
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch {
    return null
  }
}
