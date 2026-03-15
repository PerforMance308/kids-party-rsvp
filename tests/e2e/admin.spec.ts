import { test, expect } from '@playwright/test'
import { adminEmail, closeTestPrisma, login } from './helpers'

test.afterAll(async () => {
  await closeTestPrisma()
})

test.describe('admin flows', () => {
  test('admin can open notifications management', async ({ page }) => {
    await login(page, 'en', adminEmail)
    await page.waitForURL('**/en')
    await page.goto('/en/admin/notifications')
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
    await expect(page.getByText(/\[SMOKE\] Failed broadcast sample/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Process Queue/i })).toBeVisible()
    await page.getByRole('button', { name: 'Resend' }).first().click()
    await expect(page.getByText(/Notification resent to/i)).toBeVisible()
  })
})
