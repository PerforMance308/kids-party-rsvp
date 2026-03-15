import { PrismaClient } from '@prisma/client'
import type { Page } from '@playwright/test'

const prisma = new PrismaClient()

export const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin-smoke@kidspartyrsvp.test'
export const hostEmail = process.env.SEED_HOST_EMAIL || 'host-smoke@kidspartyrsvp.test'
export const seedPassword = process.env.SEED_PASSWORD || 'SmokeTest123!'

export async function login(page: Page, locale: 'en' | 'zh', email: string, password = seedPassword) {
  await page.goto(`/${locale}/login`)
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 })
}

export async function getSeededParty() {
  const party = await prisma.party.findFirst({
    where: {
      notes: {
        contains: '[SMOKE]',
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      publicRsvpToken: true,
      child: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!party) {
    throw new Error('Seeded party not found. Run db:seed:smoke first.')
  }

  return party
}

export async function closeTestPrisma() {
  await prisma.$disconnect()
}
