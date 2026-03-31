// FILE: src/app/api/subscription/status/route.ts — COMPLETE UPDATE

import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { getPlan, TRIAL_CONFIG, getTrialDaysRemaining } from '@/lib/plans'
import { MessageUsage } from '@/lib/messaging'
import type { PlanId } from '@/lib/plans'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const school = await School.findById(session.user.tenantId)
            .select('plan trialEndsAt subscriptionId isActive modules name')
            .lean() as any

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        // ✅ Include scheduled_cancel as active
        const activeSub = await Subscription.findOne({
            tenantId: school._id,
            status: { $in: ['active', 'scheduled_cancel'] },
        })
            .sort({ createdAt: -1 })
            .lean() as any

        const now = new Date()
        const trialEnd = new Date(school.trialEndsAt)
        const isPaid = Boolean(school.subscriptionId) && Boolean(activeSub)
        const isInTrial = !isPaid && trialEnd > now
        const isExpired = !isInTrial && !isPaid

        const effectivePlan = isPaid
            ? (activeSub.plan as PlanId)
            : isInTrial
                ? TRIAL_CONFIG.plan
                : 'starter'

        const plan = getPlan(effectivePlan)

        // Count usage
        const [studentCount, teacherCount] = await Promise.all([
            Student.countDocuments({ tenantId: school._id, status: 'active' }),
            User.countDocuments({ tenantId: school._id, role: 'teacher', isActive: true }),
        ])

        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const msgUsage = await MessageUsage.findOne({
            tenantId: school._id,
            month,
        }).lean() as any

        const effectiveStudentLimit = isInTrial ? TRIAL_CONFIG.maxStudents : plan.maxStudents
        const effectiveTeacherLimit = isInTrial ? TRIAL_CONFIG.maxTeachers : plan.maxTeachers
        const effectiveSmsLimit = isInTrial ? TRIAL_CONFIG.maxSmsPerMonth : plan.maxSmsPerMonth

        const recentPayments = isPaid && activeSub?.paymentHistory
            ? activeSub.paymentHistory.slice(-5)
            : []

        return NextResponse.json({
            plan: effectivePlan,
            planName: plan.name,
            isInTrial,
            isPaid,
            isExpired,
            daysLeft: isInTrial ? getTrialDaysRemaining(trialEnd) : null,
            trialEndsAt: school.trialEndsAt
                ? new Date(school.trialEndsAt).toISOString()
                : null,
            validTill: isPaid && activeSub?.currentPeriodEnd
                ? new Date(activeSub.currentPeriodEnd).toISOString()
                : trialEnd.toISOString(),
            billingCycle: activeSub?.billingCycle ?? null,

            // ✅ NEW: Cancel info
            isScheduledCancel: activeSub?.status === 'scheduled_cancel',
            scheduledCancelAt: activeSub?.scheduledCancelAt
                ? new Date(activeSub.scheduledCancelAt).toISOString()
                : null,

            // Limits
            limits: {
                students: {
                    used: studentCount,
                    limit: effectiveStudentLimit,
                    remaining: effectiveStudentLimit === -1 ? -1 : Math.max(0, effectiveStudentLimit - studentCount),
                    isUnlimited: effectiveStudentLimit === -1,
                },
                teachers: {
                    used: teacherCount,
                    limit: effectiveTeacherLimit,
                    remaining: effectiveTeacherLimit === -1 ? -1 : Math.max(0, effectiveTeacherLimit - teacherCount),
                    isUnlimited: effectiveTeacherLimit === -1,
                },
                sms: {
                    used: msgUsage?.smsCount || 0,
                    limit: effectiveSmsLimit,
                    remaining: effectiveSmsLimit === -1 ? -1 : Math.max(0, effectiveSmsLimit - (msgUsage?.smsCount || 0)),
                    isUnlimited: effectiveSmsLimit === -1,
                },
                email: {
                    used: msgUsage?.emailCount || 0,
                    limit: isInTrial ? 500 : plan.maxEmailPerMonth,
                    isUnlimited: plan.maxEmailPerMonth === -1,
                },
                whatsapp: {
                    used: msgUsage?.whatsappCount || 0,
                    limit: isInTrial ? 100 : plan.maxWhatsappPerMonth,
                    isUnlimited: plan.maxWhatsappPerMonth === -1,
                },
            },

            modules: school.modules || [],
            moduleCount: (school.modules || []).length,
            recentPayments,
            amount: activeSub?.amount || null,
        })
    } catch (err: any) {
        console.error('Subscription status error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}