export async function register() {
  // Fallback to an in-process scheduler when the deployment does not provide
  // an external cron trigger for /api/cron/daily.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron')
    const {
      scheduleBirthdayReminders,
      processPendingEmails,
      processPartyReminders24h,
    } = await import('@/lib/notification-scheduler')

    // Every day at 9:00 UTC
    cron.default.schedule(
      '0 9 * * *',
      async () => {
        console.log('[cron] Daily cron job started')
        try {
          await scheduleBirthdayReminders()
          await processPartyReminders24h()
          const count = await processPendingEmails()
          console.log(`[cron] Daily cron completed. Emails processed: ${count}`)
        } catch (error) {
          console.error('[cron] Daily cron error:', error)
        }
      },
      { timezone: 'UTC' }
    )

    console.log('[cron] In-process cron registered (daily at 09:00 UTC)')
  }
}
