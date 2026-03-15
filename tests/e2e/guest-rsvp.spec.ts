import { test, expect } from '@playwright/test'
import { closeTestPrisma, getSeededParty } from './helpers'

test.afterAll(async () => {
  await closeTestPrisma()
})

test.describe('guest RSVP flow', () => {
  test('public RSVP page loads for seeded party', async ({ page }) => {
    const party = await getSeededParty()
    await page.goto(`/zh/rsvp/${party.publicRsvpToken}`)
    await expect(page.getByText(new RegExp(party.child.name, 'i'))).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('guest-facing party page loads for seeded token', async ({ page }) => {
    const party = await getSeededParty()
    await page.goto(`/zh/party/guest/${party.publicRsvpToken}`)
    await expect(page.locator('main')).toBeVisible()
  })
})
