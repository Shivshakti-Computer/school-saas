// FILE: src/app/api/superadmin/route.ts
// UPDATED: Credit stats added

import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { MessageCredit } from '@/models/MessageCredit'
import { CreditTransaction } from '@/models/CreditTransaction'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { Types } from 'mongoose'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const [
    totalSchools,
    activeSchools,
    trialSchools,
    paidSchools,
    schoolsByPlan,
    // ── NEW: Credit stats ──
    totalCreditBalance,
    last30DaysCreditUsage,
  ] = await Promise.all([
    School.countDocuments({}),
    School.countDocuments({ isActive: true }),
    School.countDocuments({
      isActive: true,
      subscriptionId: null,
      trialEndsAt: { $gte: new Date() },
    }),
    School.countDocuments({
      isActive: true,
      subscriptionId: { $ne: null },
    }),
    School.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]),

    // Total credits across all schools
    MessageCredit.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]),

    // Last 30 days credit usage by channel
    CreditTransaction.aggregate([
      {
        $match: {
          type: 'message_deduct',
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 },
          credits: { $sum: { $abs: '$amount' } },
        },
      },
    ]),
  ])

  const recentSchools = await School.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name subdomain plan isActive trialEndsAt createdAt creditBalance')
    .lean()

  return NextResponse.json({
    stats: {
      totalSchools,
      activeSchools,
      trialSchools,
      paidSchools,
      schoolsByPlan,
    },
    recentSchools,
    // ── NEW ──
    credits: {
      totalBalance: totalCreditBalance[0]?.total ?? 0,
      last30DaysUsage: last30DaysCreditUsage,
    },
  })
}