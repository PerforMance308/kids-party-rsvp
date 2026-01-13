import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@kidspartyrsvp.com'
    const password = 'Woaishiqi308!'

    try {
        const hashedPassword = await bcrypt.hash(password, 12)

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            console.log(`User ${email} found. Updating password and role...`)
            const updatedUser = await prisma.user.update({
                where: { email },
                data: {
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                },
            })
            console.log('User updated successfully:', updatedUser.email)
        } else {
            console.log(`User ${email} not found. Creating new admin user...`)
            const newUser = await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                    name: 'Admin',
                },
            })
            console.log('Admin user created successfully:', newUser.email)
        }
    } catch (error) {
        console.error('Error creating/updating admin user:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
