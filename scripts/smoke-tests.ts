import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BROADCAST_EXTRA_PRICES,
  getBroadcastExtraPrice,
  normalizeSupportedCurrency,
} from '../src/lib/broadcast-pricing'
import {
  getGuestEmailDisplay,
  getRsvpStatusText,
  isUndeliverableGuestEmail,
} from '../src/lib/utils'

const rootDir = join(fileURLToPath(new URL('..', import.meta.url)))

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), 'utf8')
}

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

test('broadcast pricing config stays aligned', () => {
  assert.deepEqual(BROADCAST_EXTRA_PRICES, {
    USD: 0.99,
    CAD: 1.99,
    EUR: 0.99,
  })
  assert.deepEqual(getBroadcastExtraPrice('cad'), { currency: 'CAD', price: 1.99 })
  assert.deepEqual(getBroadcastExtraPrice('eur'), { currency: 'EUR', price: 0.99 })
  assert.equal(normalizeSupportedCurrency('zzz'), 'USD')
})

test('undeliverable guest emails are hidden consistently', () => {
  assert.equal(isUndeliverableGuestEmail('anonymous-123@no-email.com'), true)
  assert.equal(isUndeliverableGuestEmail('real@example.com'), false)
  assert.equal(getGuestEmailDisplay('anonymous-123@no-email.com'), '')
  assert.equal(getGuestEmailDisplay('real@example.com'), 'real@example.com')
})

test('Chinese RSVP labels are not mojibake', () => {
  assert.equal(getRsvpStatusText('YES', 'zh'), '\u53c2\u52a0')
  assert.equal(getRsvpStatusText('NO', 'zh'), '\u4e0d\u53c2\u52a0')
  assert.equal(getRsvpStatusText('MAYBE', 'zh'), '\u53ef\u80fd\u53c2\u52a0')
  assert.equal(getRsvpStatusText(undefined, 'zh'), '\u5f85\u5b9a')
})

test('dashboard broadcast copy uses dynamic pricing and hide fake emails', () => {
  const source = readSource('src/app/[locale]/party/[id]/dashboard/page.tsx')
  assert.match(source, /getGuestEmailDisplay\(guest\.email\)/)
  assert.match(source, /formatPrice\(broadcastPricing\.price, broadcastPricing\.currency, locale\)/)
  assert.doesNotMatch(source, /each additional one is \$0\.99/)
  assert.doesNotMatch(source, /额外每条 \$0\.99/)
})

test('admin-only debug routes stay locked down', () => {
  const paymentDebug = readSource('src/app/api/payment/debug/route.ts')
  const dbTest = readSource('src/app/api/db-test/route.ts')
  assert.match(paymentDebug, /requireAdmin/)
  assert.match(dbTest, /requireAdmin/)
  assert.doesNotMatch(paymentDebug, /secretKeyPrefix/)
  assert.doesNotMatch(paymentDebug, /webhookSecretPrefix/)
  assert.doesNotMatch(dbTest, /DATABASE_URL:/)
})

test('prod scheduling no longer depends on in-process node-cron', () => {
  const instrumentation = readSource('src/instrumentation.ts')
  assert.doesNotMatch(instrumentation, /node-cron/)
  assert.match(instrumentation, /api\/cron\/daily/)
})

console.log('Smoke tests completed successfully.')
