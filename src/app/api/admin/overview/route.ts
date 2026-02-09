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

    // Run all queries in parallel
    const [
      totalUsers,
      verifiedUsers,
      newUsersToday,
      newUsersThisWeek,
      totalParties,
      upcomingParties,
      totalGuests,
      totalChildren,
      rsvpCounts,
      totalEmails,
      emailStatusCounts,
      recentUsers,
      recentParties,
      recentRsvps,
    ] = await Promise.all([
      // User stats
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: { not: null } } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),

      // Party stats
      prisma.party.count(),
      prisma.party.count({ where: { eventDatetime: { gt: now } } }),

      // Guest & children stats
      prisma.guest.count(),
      prisma.child.count(),

      // RSVP breakdown
      prisma.rSVP.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Email stats
      prisma.emailNotification.count(),
      prisma.emailNotification.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Recent users
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          role: true,
          _count: { select: { parties: true } },
        },
      }),

      // Recent parties
      prisma.party.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          eventDatetime: true,
          location: true,
          createdAt: true,
          child: { select: { name: true } },
          targetAge: true,
          _count: { select: { guests: true } },
          guests: {
            select: {
              rsvp: { select: { status: true } },
            },
          },
        },
      }),

      // Recent RSVPs
      prisma.rSVP.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          guest: {
            select: {
              childName: true,
              partyId: true,
            },
          },
        },
      }),
    ])

    // Process RSVP counts into a map
    const rsvpMap: Record<string, number> = {}
    for (const r of rsvpCounts) {
      rsvpMap[r.status] = r._count.status
    }
    const totalRsvps = Object.values(rsvpMap).reduce((a, b) => a + b, 0)
    const pendingRsvps = totalGuests - totalRsvps

    // Process email status counts
    const emailMap: Record<string, number> = {}
    for (const e of emailStatusCounts) {
      emailMap[e.status] = e._count.status
    }

    // Process recent parties to include RSVP stats
    const processedParties = recentParties.map((party) => {
      const rsvpStats: Record<string, number> = {}
      for (const guest of party.guests) {
        const status = guest.rsvp?.status || 'pending'
        rsvpStats[status] = (rsvpStats[status] || 0) + 1
      }
      return {
        id: party.id,
        childName: party.child.name,
        targetAge: party.targetAge,
        eventDatetime: party.eventDatetime,
        location: party.location,
        createdAt: party.createdAt,
        guestCount: party._count.guests,
        rsvpStats,
      }
    })

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
        },
        parties: {
          total: totalParties,
          upcoming: upcomingParties,
          past: totalParties - upcomingParties,
        },
        guests: {
          total: totalGuests,
          attending: rsvpMap['attending'] || 0,
          declined: rsvpMap['declined'] || 0,
          maybe: rsvpMap['maybe'] || 0,
          pending: pendingRsvps,
        },
        children: {
          total: totalChildren,
        },
        emails: {
          total: totalEmails,
          sent: emailMap['sent'] || 0,
          pending: emailMap['pending'] || 0,
          failed: emailMap['failed'] || 0,
        },
      },
      recent: {
        users: recentUsers.map((u) => ({
          id: u.id,
          email: u.email,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
          role: u.role,
          partyCount: u._count.parties,
        })),
        parties: processedParties,
        rsvps: recentRsvps.map((r) => ({
          id: r.id,
          childName: r.guest.childName,
          status: r.status,
          partyId: r.guest.partyId,
          updatedAt: r.updatedAt,
        })),
      },
    })
  } catch (error) {
    console.error('Admin overview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    )
  }
}
