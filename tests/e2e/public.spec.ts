import { test, expect } from '@playwright/test'

test.describe('public pages', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/en')
    await expect(page).toHaveTitle(/Kids Party RSVP/i)
  })

  test('contact form submits in test mode', async ({ page }) => {
    await page.goto('/en/contact')
    await page.getByLabel('Name').fill('Smoke Tester')
    await page.getByLabel('Email').fill('smoke@example.com')
    await page.getByLabel('Subject').selectOption('bug')
    await page.getByLabel('Message').fill('Smoke test contact submission')
    await page.getByRole('button', { name: 'Send Message' }).click()
    await expect(page.getByText('Message Sent!')).toBeVisible()
  })

  test('legal and marketing pages load', async ({ page }) => {
    for (const path of [
      '/en/privacy',
      '/en/terms',
      '/en/templates/dinosaur-birthday-party',
      '/en/features/qr-code-rsvp',
    ]) {
      await page.goto(path)
      await expect(page.getByRole('main').first()).toBeVisible()
    }
  })
})
