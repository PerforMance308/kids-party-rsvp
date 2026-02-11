export async function register() {
  // Only run cron on the server (not edge runtime or build time)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron')
    const {
      scheduleBirthdayReminders,
      processPendingEmails,
    } = await import('@/lib/notification-scheduler')

    // Every day at 9:00 UTC
    cron.default.schedule('0 9 * * *', async () => {
      console.log('🕐 Daily cron job started')
      try {
        await scheduleBirthdayReminders()
        const count = await processPendingEmails()
        console.log(`✅ Daily cron completed. Emails processed: ${count}`)
      } catch (error) {
        console.error('❌ Daily cron error:', error)
      }
    }, { timezone: 'UTC' })

    console.log('📅 Cron jobs registered (daily at 09:00 UTC)')
  }
}
