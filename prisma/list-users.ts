
import { prisma } from '../src/lib/prisma'

async function main() {
    console.log('Fetching users...')
    try {
        // Try to generic fetch first, avoiding 'role' if it's broken
        const users = await prisma.user.findMany({
            take: 20,
            select: { email: true, name: true }
        })
        console.log('Found Users:', JSON.stringify(users, null, 2))

        // If that works, let's try to grab 'role' specifically to see if it works now
        // (Maybe the user fixed it, or maybe it works effectively in some contexts)
        /*
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { email: true }
        })
        console.log('Admins:', admins)
        */
    } catch (e) {
        console.error('Error fetching users:', e)
    }
}

main()
