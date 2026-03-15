import { test, expect } from '@playwright/test'

test.describe('API security and health', () => {
  test('health is public', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBeTruthy()
  })

  test('debug and cron endpoints are protected', async ({ request }) => {
    const paymentDebug = await request.get('/api/payment/debug')
    expect(paymentDebug.status()).not.toBe(200)

    const dbTest = await request.get('/api/db-test')
    expect(dbTest.status()).not.toBe(200)

    const cron = await request.get('/api/cron/daily')
    expect(cron.status()).toBe(401)
  })
})
