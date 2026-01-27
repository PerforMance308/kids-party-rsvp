import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type {
  Theme,
  InvitationTemplate,
  TemplateConfig,
  ThemeMetadata,
  TemplatesApiResponse,
} from '@/types/invitation-template';
import { getEffectivePrice } from '@/types/invitation-template';

// 默认主题名称映射
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
};

export async function GET() {
  try {
    const invitationsDir = path.join(process.cwd(), 'public', 'invitations');

    // 检查目录是否存在
    if (!fs.existsSync(invitationsDir)) {
      return NextResponse.json({ themes: [], totalTemplates: 0 });
    }

    // 读取所有主题文件夹
    const themeFolders = fs.readdirSync(invitationsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const themes: Theme[] = [];
    let totalTemplates = 0;

    for (const themeFolder of themeFolders) {
      const themePath = path.join(invitationsDir, themeFolder);

      // 读取主题元数据（如果存在）
      let themeMetadata: ThemeMetadata | null = null;
      const themeJsonPath = path.join(themePath, 'theme.json');
      if (fs.existsSync(themeJsonPath)) {
        try {
          themeMetadata = JSON.parse(fs.readFileSync(themeJsonPath, 'utf-8'));
        } catch (e) {
          console.warn(`Failed to parse theme.json for ${themeFolder}:`, e);
        }
      }

      // 读取所有模板文件
      const files = fs.readdirSync(themePath);
      const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'theme.json');

      const templates: InvitationTemplate[] = [];

      for (const jsonFile of jsonFiles) {
        const baseName = jsonFile.replace('.json', '');

        // 读取模板配置
        const configPath = path.join(themePath, jsonFile);
        let config: TemplateConfig;
        try {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (e) {
          console.warn(`Failed to parse ${jsonFile}:`, e);
          continue;
        }

        // 查找对应的图片文件（支持png和jpg）
        // 如果配置了纯色背景，则不需要图片文件
        const pngFile = `${baseName}.png`;
        const jpgFile = `${baseName}.jpg`;
        let imageFile: string | null = null;

        if (files.includes(pngFile)) {
          imageFile = pngFile;
        } else if (files.includes(jpgFile)) {
          imageFile = jpgFile;
        }

        // 如果没有图片文件且没有纯色背景配置，则跳过
        if (!imageFile && !config.backgroundColor) {
          console.warn(`Missing image for template: ${jsonFile} in ${themeFolder}`);
          continue;
        }

        // 确保有pricing配置，如果没有则设置默认值
        if (!config.pricing) {
          config.pricing = {
            price: 1.39,
            currency: 'USD',
            isFree: false,
          };
        }

        // 计算有效价格
        const effectivePrice = getEffectivePrice(config.pricing);

        // 生成显示名称
        const displayName = baseName
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        templates.push({
          id: baseName,
          theme: themeFolder,
          name: displayName,
          imageUrl: imageFile ? `/invitations/${themeFolder}/${imageFile}` : '',
          config,
          effectivePrice,
        });
      }

      if (templates.length > 0) {
        const defaultNames = DEFAULT_THEME_NAMES[themeFolder] || {
          zh: themeFolder.charAt(0).toUpperCase() + themeFolder.slice(1),
          en: themeFolder.charAt(0).toUpperCase() + themeFolder.slice(1),
          icon: '🎉',
        };

        themes.push({
          id: themeFolder,
          name: themeMetadata?.name || { zh: defaultNames.zh, en: defaultNames.en },
          description: themeMetadata?.description,
          icon: themeMetadata?.icon || defaultNames.icon,
          templates,
          templateCount: templates.length,
        });

        totalTemplates += templates.length;
      }
    }

    // 按主题名称排序
    themes.sort((a, b) => a.id.localeCompare(b.id));

    const response: TemplatesApiResponse = {
      themes,
      totalTemplates,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error loading templates:', error);
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    );
  }
}
