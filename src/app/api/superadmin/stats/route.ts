// =============================================================
// FILE: src/app/api/superadmin/stats/route.ts
// GET → revenue + overall stats
// =============================================================

import { Subscription } from '@/models/Subscription'
import { User } from '@/models/User'
import { Student } from '@/models/Student'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'

export async function GET_STATS(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const [
            totalSchools,
            activeSchools,
            paidSchools,
            trialSchools,
            allActiveSubs,
            newSchoolsThisMonth,
            totalStudents,
            totalTeachers,
        ] = await Promise.all([
            School.countDocuments({}),
            School.countDocuments({ isActive: true }),
            School.countDocuments({ isActive: true, subscriptionId: { $ne: null } }),
            School.countDocuments({
                isActive: true,
                subscriptionId: null,
                trialEndsAt: { $gte: now },
            }),
            Subscription.find({ status: 'active' }).lean(),
            School.countDocuments({ createdAt: { $gte: thisMonthStart } }),
            Student.countDocuments({ status: 'active' }),
            User.countDocuments({ role: 'teacher', isActive: true }),
        ])

        // MRR calculation
        const mrr = allActiveSubs.reduce((sum, s) => {
            if (s.billingCycle === 'monthly') return sum + s.amount
            return sum + Math.round(s.amount / 12)
        }, 0)

        // ARR
        const arr = mrr * 12

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
        })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}