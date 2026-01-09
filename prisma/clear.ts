import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Database Clear ---');

    try {
        // Correct order of deletion to respect foreign key constraints

        console.log('Clearing RSVPs...');
        await prisma.rSVP.deleteMany();

        console.log('Clearing Reminders...');
        await prisma.reminder.deleteMany();

        console.log('Clearing Photos...');
        await prisma.photo.deleteMany();

        console.log('Clearing Email Notifications...');
        await prisma.emailNotification.deleteMany();

        console.log('Clearing Guests...');
        await prisma.guest.deleteMany();

        console.log('Clearing Parties...');
        await prisma.party.deleteMany();

        console.log('Clearing Children...');
        await prisma.child.deleteMany();

        console.log('Clearing Contacts...');
        await prisma.contact.deleteMany();

        console.log('Clearing Sessions...');
        await prisma.session.deleteMany();

        console.log('Clearing Accounts...');
        await prisma.account.deleteMany();

        console.log('Clearing Verification Tokens...');
        await prisma.verificationToken.deleteMany();

        console.log('Clearing Users...');
        await prisma.user.deleteMany();

        console.log('--- All tables cleared successfully ---');
    } catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
