import { prisma } from '../src/lib/prisma'
import { readFilesystemTemplateCatalog, toPrismaJsonValue } from '../src/lib/template-store'

async function main() {
  const catalog = readFilesystemTemplateCatalog()

  for (const [themeIndex, theme] of catalog.themes.entries()) {
    await prisma.templateTheme.upsert({
      where: { id: theme.id },
      update: {
        name: theme.name,
        description: theme.description,
        icon: theme.icon,
        sortOrder: themeIndex,
        isActive: true,
      },
      create: {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        icon: theme.icon,
        sortOrder: themeIndex,
        isActive: true,
      },
    })

    for (const [templateIndex, template] of theme.templates.entries()) {
      await prisma.template.upsert({
        where: { id: template.id },
        update: {
          themeId: theme.id,
          name: template.name,
          imageUrl: template.imageUrl,
          config: toPrismaJsonValue(template.config),
          sortOrder: templateIndex,
          isActive: true,
        },
        create: {
          id: template.id,
          themeId: theme.id,
          name: template.name,
          imageUrl: template.imageUrl,
          config: toPrismaJsonValue(template.config),
          sortOrder: templateIndex,
          isActive: true,
        },
      })
    }
  }

  console.log(`Imported ${catalog.totalTemplates} templates across ${catalog.themes.length} themes.`)
}

main()
  .catch((error) => {
    console.error('Failed to import templates:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
