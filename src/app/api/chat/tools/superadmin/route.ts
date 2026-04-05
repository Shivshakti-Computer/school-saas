// src/app/api/chat/tools/superadmin/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { School } from '@/models/School'
import { User } from '@/models/User'
import { Subscription } from '@/models/Subscription'
import { connectDB } from '@/lib/db'

export type SuperadminTool =
  | 'get_platform_stats'
  | 'get_schools_list'
  | 'get_revenue_summary'
  | 'get_subscription_breakdown'
  | 'get_expiring_trials'
  | 'get_recent_registrations'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Superadmin only' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { tool } = body as { tool: SuperadminTool }

    await connectDB()

    switch (tool) {

      // ── Platform Stats ───────────────────────────────────
      case 'get_platform_stats': {
        const [
          totalSchools,
          activeSchools,
          trialSchools,
          expiredSchools,
          totalUsers,
        ] = await Promise.all([
          School.countDocuments({}),
          School.countDocuments({ subscriptionStatus: 'active' }),
          School.countDocuments({ subscriptionStatus: 'trial' }),
          School.countDocuments({ subscriptionStatus: 'expired' }),
          User.countDocuments({ role: { $ne: 'superadmin' } }),
        ])

        return NextResponse.json({
          success: true,
          data: {
            total_schools: totalSchools,
            active_schools: activeSchools,
            trial_schools: trialSchools,
            expired_schools: expiredSchools,
            total_users: totalUsers,
            health: activeSchools > trialSchools ? '🟢 Good' : '🟡 Monitor',
          },
        })
      }

      // ── Schools List ─────────────────────────────────────
      case 'get_schools_list': {
        const schools = await School.find({})
          .sort({ createdAt: -1 })
          .limit(20)
          .select('name subscriptionStatus plan createdAt city')
          .lean()

        return NextResponse.json({
          success: true,
          data: {
            total: schools.length,
            schools: schools.map((s: any) => ({
              name: s.name,
              status: s.subscriptionStatus,
              plan: s.plan || 'starter',
              city: s.city || 'N/A',
              joined: new Date(s.createdAt).toLocaleDateString('en-IN'),
            })),
          },
        })
      }

      // ── Revenue Summary ──────────────────────────────────
      case 'get_revenue_summary': {
        const currentMonth = new Date()
        currentMonth.setDate(1)
        currentMonth.setHours(0, 0, 0, 0)

        const lastMonth = new Date(currentMonth)
        lastMonth.setMonth(lastMonth.getMonth() - 1)

        const [thisMonthSubs, lastMonthSubs, totalActive] = await Promise.all([
          Subscription.find({
            status: 'active',
            createdAt: { $gte: currentMonth },
          })
            .select('amount plan')
            .lean(),
          Subscription.find({
            status: 'active',
            createdAt: { $gte: lastMonth, $lt: currentMonth },
          })
            .select('amount plan')
            .lean(),
          Subscription.countDocuments({ status: 'active' }),
        ])

        const thisMonthRevenue = thisMonthSubs.reduce(
          (sum: number, s: any) => sum + (s.amount || 0), 0
        )
        const lastMonthRevenue = lastMonthSubs.reduce(
          (sum: number, s: any) => sum + (s.amount || 0), 0
        )

        const growth = lastMonthRevenue > 0
          ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
          : 0

        return NextResponse.json({
          success: true,
          data: {
            this_month: `₹${thisMonthRevenue.toLocaleString('en-IN')}`,
            last_month: `₹${lastMonthRevenue.toLocaleString('en-IN')}`,
            growth: `${growth > 0 ? '+' : ''}${growth}%`,
            active_subscriptions: totalActive,
            trend: growth > 0 ? '📈 Growing' : growth < 0 ? '📉 Declining' : '➡️ Stable',
          },
        })
      }

      // ── Subscription Breakdown ───────────────────────────
      case 'get_subscription_breakdown': {
        const breakdown = await School.aggregate([
          {
            $group: {
              _id: { plan: '$plan', status: '$subscriptionStatus' },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ])

        return NextResponse.json({
          success: true,
          data: {
            breakdown: breakdown.map(b => ({
              plan: b._id.plan || 'starter',
              status: b._id.status || 'unknown',
              count: b.count,
            })),
          },
        })
      }

      // ── Expiring Trials ──────────────────────────────────
      case 'get_expiring_trials': {
        const sevenDaysLater = new Date()
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

        const expiring = await School.find({
          subscriptionStatus: 'trial',
          trialEndsAt: { $lte: sevenDaysLater, $gte: new Date() },
        })
          .select('name trialEndsAt email')
          .sort({ trialEndsAt: 1 })
          .limit(10)
          .lean()

        return NextResponse.json({
          success: true,
          data: {
            count: expiring.length,
            schools: expiring.map((s: any) => ({
              name: s.name,
              expires: s.trialEndsAt
                ? new Date(s.trialEndsAt).toLocaleDateString('en-IN')
                : 'N/A',
              days_left: s.trialEndsAt
                ? Math.ceil(
                    (new Date(s.trialEndsAt).getTime() - Date.now())
                    / (1000 * 60 * 60 * 24)
                  )
                : 0,
            })),
          },
        })
      }

      // ── Recent Registrations ─────────────────────────────
      case 'get_recent_registrations': {
        const schools = await School.find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name createdAt plan city')
          .lean()

        return NextResponse.json({
          success: true,
          data: {
            count: schools.length,
            schools: schools.map((s: any) => ({
              name: s.name,
              plan: s.plan || 'starter',
              city: s.city || 'N/A',
              joined: new Date(s.createdAt).toLocaleDateString('en-IN'),
            })),
          },
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown tool: ${tool}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Superadmin Tools] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database query failed' },
      { status: 500 }
    )
  }
}