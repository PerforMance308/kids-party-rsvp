import { PrismaClient, UserRole } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin-smoke@kidspartyrsvp.test'
const HOST_EMAIL = process.env.SEED_HOST_EMAIL || 'host-smoke@kidspartyrsvp.test'
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'SmokeTest123!'

async function main() {
  const passwordHash = await hashPassword(DEFAULT_PASSWORD)
  const now = new Date()
  const eventDatetime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  eventDatetime.setHours(15, 0, 0, 0)
  const rsvpClosesAt = new Date(eventDatetime.getTime() - 24 * 60 * 60 * 1000)

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      role: UserRole.ADMIN,
      passwordHash,
      name: 'Smoke Admin',
      language: 'en',
    },
    create: {
      email: ADMIN_EMAIL,
      role: UserRole.ADMIN,
      passwordHash,
      name: 'Smoke Admin',
      language: 'en',
      emailVerified: now,
    },
  })

  const host = await prisma.user.upsert({
    where: { email: HOST_EMAIL },
    update: {
      passwordHash,
      name: 'Smoke Host',
      language: 'zh',
    },
    create: {
      email: HOST_EMAIL,
      passwordHash,
      name: 'Smoke Host',
      language: 'zh',
      emailVerified: now,
    },
  })

  await prisma.emailNotification.deleteMany({
    where: {
      userId: host.id,
      subject: { startsWith: '[SMOKE]' },
    },
  })

  await prisma.party.deleteMany({
    where: {
      userId: host.id,
      notes: { contains: '[SMOKE]' },
    },
  })

  const child = await prisma.child.create({
    data: {
      userId: host.id,
      name: 'Codex QA Kid',
      birthDate: new Date('2020-06-15T00:00:00.000Z'),
      gender: 'girl',
      notes: '[SMOKE] Seed child for automated test flows',
    },
  })

  const party = await prisma.party.create({
    data: {
      userId: host.id,
      childId: child.id,
      eventDatetime,
      rsvpClosesAt,
      location: 'Smoke Test Playroom',
      locationFull: '123 Test Street, Toronto, ON',
      theme: 'Automation Party',
      notes: '[SMOKE] Safe test party created by prisma/seed-smoke.ts',
      targetAge: 6,
      guestCanSeeOthers: true,
    },
  })

  const yesGuest = await prisma.guest.create({
    data: {
      partyId: party.id,
      childName: 'Alice QA',
      email: 'alice-smoke@example.com',
      phone: '4165550101',
      rsvp: {
        create: {
          status: 'YES',
          numChildren: 1,
          parentStaying: true,
          allergies: 'No peanuts',
          message: 'See you there!',
        },
      },
    },
  })

  await prisma.guest.create({
    data: {
      partyId: party.id,
      childName: 'Bob QA',
      email: 'bob-smoke@example.com',
      phone: '4165550102',
      rsvp: {
        create: {
          status: 'MAYBE',
          numChildren: 1,
          parentStaying: false,
          message: 'Will confirm soon.',
        },
      },
    },
  })

  await prisma.guest.create({
    data: {
      partyId: party.id,
      childName: 'Declined Anonymous',
      email: `anonymous-smoke-${Date.now()}@no-email.com`,
      rsvp: {
        create: {
          status: 'NO',
          numChildren: 0,
          parentStaying: false,
        },
      },
    },
  })

  await prisma.emailNotification.create({
    data: {
      userId: host.id,
      email: yesGuest.email,
      type: 'HOST_BROADCAST',
      subject: '[SMOKE] Failed broadcast sample',
      content: 'This is a seeded failed notification for admin retry testing.',
      htmlContent: '<p>This is a seeded failed notification for admin retry testing.</p>',
      relatedId: party.id,
      status: 'failed',
      error: 'Seeded failure for admin retry testing',
      attempts: 1,
      scheduledAt: now,
    } as any,
  })

  console.log('')
  console.log('Smoke seed ready')
  console.log(`Admin login: ${ADMIN_EMAIL} / ${DEFAULT_PASSWORD}`)
  console.log(`Host login: ${HOST_EMAIL} / ${DEFAULT_PASSWORD}`)
  console.log(`Party ID: ${party.id}`)
  console.log(`RSVP path: /zh/rsvp/${party.publicRsvpToken}`)
  console.log(`Dashboard path: /zh/party/${party.id}/dashboard`)
  console.log(`Admin notifications: /en/admin/notifications`)
}

main()
  .catch((error) => {
    console.error('Smoke seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
