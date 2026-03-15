import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
  })
}

// Enhanced Prisma client with connection resilience for production
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

export async function withBackgroundPrisma<T>(work: (client: PrismaClient) => Promise<T>): Promise<T> {
  const backgroundPrisma = createPrismaClient()
  try {
    await backgroundPrisma.$connect()
    return await work(backgroundPrisma)
  } finally {
    await backgroundPrisma.$disconnect().catch((error) => {
      console.error('Failed to disconnect background Prisma client:', error)
    })
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Ensure connection on startup in production
if (process.env.NODE_ENV === 'production') {
  prisma.$connect().catch(console.error)
}
