import { test, expect } from '@playwright/test'
import { closeTestPrisma, getSeededParty, hostEmail, login } from './helpers'

test.afterAll(async () => {
  await closeTestPrisma()
})

test.describe('host flows', () => {
  test('host can sign in and see dashboard', async ({ page }) => {
    await login(page, 'en', hostEmail)
    await page.waitForURL('**/en')
    await page.goto('/en/dashboard')
    await expect(page.getByText(/dashboard/i)).toBeVisible()
    await expect(page.getByText(/Codex QA Kid/i)).toBeVisible()
  })

  test('host can open party management surfaces', async ({ page }) => {
    const party = await getSeededParty()
    await login(page, 'en', hostEmail)

    await page.goto(`/en/party/${party.id}/dashboard`)
    await expect(page.getByText(/Broadcast Notification/)).toBeVisible()

    await page.getByPlaceholder('Email subject (3-120 chars)').fill('Smoke broadcast')
    await page.getByPlaceholder('Message content (3-1000 chars)').fill('Smoke test broadcast from Playwright')
    await page.getByRole('button', { name: /Send Broadcast/i }).click()
    await expect(page.getByText(/Broadcast queued|Broadcast sent|queued/i)).toBeVisible()

    await page.goto(`/en/party/${party.id}/edit`)
    await expect(page.getByRole('heading', { name: 'Edit Party' })).toBeVisible()

    await page.goto('/en/children')
    await expect(page.getByRole('heading', { name: /Codex QA Kid/i }).first()).toBeVisible()

    await page.goto('/en/party/new')
    await expect(page.locator('main')).toBeVisible()
  })
})
