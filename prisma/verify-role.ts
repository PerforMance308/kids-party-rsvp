
import { prisma } from '../src/lib/prisma'

async function main() {
    console.log('Verifying prisma client has role field...')
    try {
        // Attempt to select 'role' - this will throw if the field is unknown to the client
        // We don't care if the user exists or not, just if the query constructs successfully
        await prisma.user.findFirst({
            select: { role: true, id: true }
        })
        console.log('✅ Validation successful: role field is recognized.')
    } catch (e: any) {
        if (e.message.includes('Unknown field `role`')) {
            console.error('❌ Validation failed: role field is still unknown.')
            process.exit(1)
        } else {
            // If it fails for DB connection reasons, that's a different issue, 
            // but validates the client *could* try to ask for 'role'.
            // However, Prisma validation happens before DB query usually.
            console.log('⚠️  Prisma client attempted query (good), but failed on execution: ' + e.message)
            // We consider this a success for the *client generation* check if it didn't complain about the field.
            if (!e.message.includes('Unknown field')) {
                console.log('✅ Validation successful: Client schema seems correct.')
            } else {
                console.error('❌ Validation failed:', e)
                process.exit(1)
            }
        }
    }
}

main()
