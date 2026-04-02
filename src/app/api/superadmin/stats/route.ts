// FILE: src/app/api/superadmin/stats/route.ts
// UPDATED: Credit revenue + message stats added

import { Subscription } from '@/models/Subscription'
import { User } from '@/models/User'
import { Student } from '@/models/Student'
import { MessageCredit } from '@/models/MessageCredit'
import { CreditTransaction } from '@/models/CreditTransaction'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        const [
            totalSchools,
            activeSchools,
            paidSchools,
            trialSchools,
            allActiveSubs,
            newSchoolsThisMonth,
            totalStudents,
            totalTeachers,
            // ── NEW: Credit stats ──
            totalCreditsPurchased,
            totalCreditsUsed,
            creditPurchasesThisMonth,
            last30DaysChannelUsage,
        ] = await Promise.all([
            School.countDocuments({}),
            School.countDocuments({ isActive: true }),
            School.countDocuments({
                isActive: true,
                subscriptionId: { $ne: null },
            }),
            School.countDocuments({
                isActive: true,
                subscriptionId: null,
                trialEndsAt: { $gte: now },
            }),
            Subscription.find({ status: 'active' }).lean(),
            School.countDocuments({ createdAt: { $gte: thisMonthStart } }),
            Student.countDocuments({ status: 'active' }),
            User.countDocuments({ role: 'teacher', isActive: true }),

            // Total credits ever purchased (all tenants)
            CreditTransaction.aggregate([
                { $match: { type: 'purchase' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),

            // Total credits ever used
            CreditTransaction.aggregate([
                { $match: { type: 'message_deduct' } },
                { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
            ]),

            // Credit purchase revenue this month
            CreditTransaction.aggregate([
                {
                    $match: {
                        type: 'purchase',
                        createdAt: { $gte: thisMonthStart },
                    },
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        credits: { $sum: '$amount' },
                    },
                },
            ]),

            // Last 30 days — messages by channel
            CreditTransaction.aggregate([
                {
                    $match: {
                        type: 'message_deduct',
                        createdAt: { $gte: last30Days },
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

        // ── MRR / ARR (subscription) ──
        const mrr = (allActiveSubs as any[]).reduce((sum, s) => {
            if (s.billingCycle === 'monthly') return sum + (s.amount || 0)
            return sum + Math.round((s.amount || 0) / 12)
        }, 0)
        const arr = mrr * 12

        // ── Credit revenue (1 credit = ₹1) ──
        const creditRevenue = creditPurchasesThisMonth[0]?.credits ?? 0

        return NextResponse.json({
            totalSchools,
            activeSchools,
            paidSchools,
            trialSchools,
            newSchoolsThisMonth,
            totalStudents,
            totalTeachers,
            mrr,
            arr,
            // ── NEW ──
            credits: {
                totalPurchased: totalCreditsPurchased[0]?.total ?? 0,
                totalUsed: totalCreditsUsed[0]?.total ?? 0,
                revenueThisMonth: creditRevenue,
                purchasesThisMonth: creditPurchasesThisMonth[0]?.count ?? 0,
                last30DaysChannelUsage,
            },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}