import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response!

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(todayStart)
    monthStart.setDate(monthStart.getDate() - 30)

    // ── Core counts ──────────────────────────────────────────────
    const [
      totalUsers,
      verifiedUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      totalParties,
      newPartiesThisWeek,
      newPartiesThisMonth,
      upcomingParties,
      totalGuests,
      rsvpCounts,
      totalEmails,
      emailStatusCounts,
      photoSharingParties,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: { not: null } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.party.count(),
      prisma.party.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.party.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.party.count({ where: { eventDatetime: { gt: now } } }),
      prisma.guest.count(),
      prisma.rSVP.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.emailNotification.count(),
      prisma.emailNotification.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.party.count({ where: { allowPhotoSharing: true } }),
    ])

    // ── Raw SQL queries (things Prisma can't do well) ────────────
    const [
      userGrowthRaw,
      partyCreationRaw,
      activeUsersRaw,
      usersWithMultiplePartiesRaw,
      paidTemplatePartiesRaw,
      totalRevenueRaw,
      monthlyRevenueRaw,
      revenueTrendRaw,
      revenueByFeatureRaw,
    ] = await Promise.all([
      // 30-day user growth trend
      prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT DATE("created_at")::text as date, COUNT(*)::int as count
        FROM users WHERE "created_at" >= ${monthStart}
        GROUP BY DATE("created_at") ORDER BY date`,

      // 30-day party creation trend
      prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT DATE("created_at")::text as date, COUNT(*)::int as count
        FROM parties WHERE "created_at" >= ${monthStart}
        GROUP BY DATE("created_at") ORDER BY date`,

      // Active users (created a party in last 30 days)
      prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(DISTINCT "user_id")::int as count
        FROM parties WHERE "created_at" >= ${monthStart}`,

      // Users with 2+ parties
      prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int as count FROM (
          SELECT "user_id" FROM parties GROUP BY "user_id" HAVING COUNT(*) >= 2
        ) sub`,

      // Parties with paid templates
      prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int as count
        FROM parties WHERE array_length(paid_templates, 1) > 0`,

      // Total revenue (succeeded payments)
      prisma.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(amount), 0)::int as total
        FROM payments WHERE status = 'succeeded'`,

      // Monthly revenue (last 30 days)
      prisma.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(amount), 0)::int as total
        FROM payments WHERE status = 'succeeded' AND "created_at" >= ${monthStart}`,

      // 30-day revenue trend
      prisma.$queryRaw<Array<{ date: string; amount: number; count: number }>>`
        SELECT DATE("created_at")::text as date, SUM(amount)::int as amount, COUNT(*)::int as count
        FROM payments WHERE status = 'succeeded' AND "created_at" >= ${monthStart}
        GROUP BY DATE("created_at") ORDER BY date`,

      // Revenue by feature
      prisma.$queryRaw<Array<{ feature: string; total: number; count: number }>>`
        SELECT feature, SUM(amount)::int as total, COUNT(*)::int as count
        FROM payments WHERE status = 'succeeded' GROUP BY feature`,
    ])

    // ── Process results ──────────────────────────────────────────
    const rsvpMap: Record<string, number> = {}
    for (const r of rsvpCounts) rsvpMap[r.status] = r._count.status
    const totalRsvps = Object.values(rsvpMap).reduce((a, b) => a + b, 0)
    const pendingRsvps = totalGuests - totalRsvps

    const emailMap: Record<string, number> = {}
    for (const e of emailStatusCounts) emailMap[e.status] = e._count.status

    const activeUsers = activeUsersRaw[0]?.count ?? 0
    const usersWithMultipleParties = usersWithMultiplePartiesRaw[0]?.count ?? 0
    const paidTemplateParties = paidTemplatePartiesRaw[0]?.count ?? 0
    const totalRevenue = totalRevenueRaw[0]?.total ?? 0
    const monthlyRevenue = monthlyRevenueRaw[0]?.total ?? 0

    const overallResponseRate = totalGuests > 0
      ? Math.round((totalRsvps / totalGuests) * 100)
      : 0

    const emailsSent = emailMap['sent'] || 0
    const emailsFailed = emailMap['failed'] || 0
    const emailsPending = emailMap['pending'] || 0
    const emailDeliveryRate = (emailsSent + emailsFailed) > 0
      ? Math.round((emailsSent / (emailsSent + emailsFailed)) * 100)
      : 100

    const verificationRate = totalUsers > 0
      ? Math.round((verifiedUsers / totalUsers) * 100) : 0
    const avgPartiesPerUser = totalUsers > 0
      ? Math.round((totalParties / totalUsers) * 100) / 100 : 0
    const avgGuestsPerParty = totalParties > 0
      ? Math.round((totalGuests / totalParties) * 100) / 100 : 0

    // Revenue by feature map
    const revenueByFeature: Record<string, { total: number; count: number }> = {}
    for (const r of revenueByFeatureRaw) {
      revenueByFeature[r.feature] = { total: r.total, count: r.count }
    }

    // ── Activity feed ────────────────────────────────────────────
    const [recentUsers, recentPartiesRaw, recentRsvps] = await Promise.all([
      prisma.user.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, createdAt: true },
      }),
      prisma.party.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          child: { select: { name: true } },
          location: true,
        },
      }),
      prisma.rSVP.findMany({
        take: 8,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          guest: { select: { childName: true, party: { select: { child: { select: { name: true } } } } } },
        },
      }),
    ])

    const activityFeed = [
      ...recentUsers.map((u) => ({
        type: 'user_registered' as const,
        description: `New user registered: ${u.email}`,
        timestamp: u.createdAt.toISOString(),
      })),
      ...recentPartiesRaw.map((p) => ({
        type: 'party_created' as const,
        description: `Party created for ${p.child.name} at ${p.location}`,
        timestamp: p.createdAt.toISOString(),
      })),
      ...recentRsvps.map((r) => ({
        type: 'rsvp_received' as const,
        description: `${r.guest.childName} RSVP'd "${r.status}" to ${r.guest.party.child.name}'s party`,
        timestamp: r.updatedAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15)

    // ── Response ─────────────────────────────────────────────────
    return NextResponse.json({
      kpis: {
        totalUsers,
        usersGrowthWeek: newUsersThisWeek,
        usersGrowthMonth: newUsersThisMonth,
        totalParties,
        partiesGrowthWeek: newPartiesThisWeek,
        partiesGrowthMonth: newPartiesThisMonth,
        overallResponseRate,
        emailDeliveryRate,
        activeUsers,
        totalRevenue,
        monthlyRevenue,
      },
      charts: {
        userGrowth: userGrowthRaw,
        partyCreation: partyCreationRaw,
        rsvpDistribution: [
          { status: 'attending', count: rsvpMap['attending'] || 0 },
          { status: 'declined', count: rsvpMap['declined'] || 0 },
          { status: 'maybe', count: rsvpMap['maybe'] || 0 },
          { status: 'pending', count: pendingRsvps },
        ],
        revenueTrend: revenueTrendRaw,
      },
      operationalMetrics: {
        userHealth: {
          verificationRate,
          retentionRate: totalUsers > 0
            ? Math.round((usersWithMultipleParties / totalUsers) * 100) : 0,
          avgPartiesPerUser,
        },
        eventOps: {
          avgGuestsPerParty,
          avgResponseRate: overallResponseRate,
          upcomingEvents: upcomingParties,
        },
        emailHealth: {
          deliverySuccessRate: emailDeliveryRate,
          failureRate: (emailsSent + emailsFailed) > 0
            ? Math.round((emailsFailed / (emailsSent + emailsFailed)) * 100) : 0,
          pendingQueueSize: emailsPending,
        },
        featureAdoption: {
          photoSharingRate: totalParties > 0
            ? Math.round((photoSharingParties / totalParties) * 100) : 0,
          paidTemplateRate: totalParties > 0
            ? Math.round((paidTemplateParties / totalParties) * 100) : 0,
        },
        revenue: {
          totalRevenue,
          monthlyRevenue,
          byFeature: {
            photo_sharing: revenueByFeature['photo_sharing'] || { total: 0, count: 0 },
            template: revenueByFeature['template'] || { total: 0, count: 0 },
          },
        },
      },
      activityFeed,
    })
  } catch (error) {
    console.error('Admin overview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    )
  }
}
