// FILE: src/app/api/subscription/status/route.ts
// COMPLETE REWRITE — Credit system integrated
// MessageUsage removed — getCreditStats use hoga
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { getCreditStats } from '@/lib/credits'
import {
    getPlan,
    TRIAL_CONFIG,
    getTrialDaysRemaining,
    PLANS,
    ADDON_PRICING,
    CREDIT_PACKS,
} from '@/config/pricing'
import type { PlanId } from '@/config/pricing'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const school = await School.findById(session.user.tenantId)
            .select('plan trialEndsAt subscriptionId isActive modules name creditBalance addonLimits')
            .lean() as any

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        // ── Active subscription ──
        const activeSub = await Subscription.findOne({
            tenantId: school._id,
            status: { $in: ['active', 'scheduled_cancel'] },
        }).sort({ createdAt: -1 }).lean() as any

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

        const planConfig = getPlan(effectivePlan)

        // ── Usage counts ──
        const [studentCount, teacherStaffCount] = await Promise.all([
            Student.countDocuments({ tenantId: school._id, status: 'active' }),
            User.countDocuments({
                tenantId: school._id,
                role: { $in: ['teacher', 'staff'] },
                isActive: true,
            }),
        ])

        // ── Credit stats (new system) ──
        const creditStats = await getCreditStats(session.user.tenantId)

        // ── Effective limits (plan + add-ons) ──
        const extraStudents = school.addonLimits?.extraStudents ?? 0
        const extraTeachers = school.addonLimits?.extraTeachers ?? 0

        const effectiveStudentLimit = isInTrial
            ? TRIAL_CONFIG.maxStudents
            : planConfig.maxStudents === -1
                ? -1
                : planConfig.maxStudents + extraStudents

        const effectiveTeacherLimit = isInTrial
            ? TRIAL_CONFIG.maxTeachers
            : planConfig.maxTeachers === -1
                ? -1
                : planConfig.maxTeachers + extraTeachers

        // ── Recent payments ──
        const recentPayments =
            isPaid && activeSub?.paymentHistory
                ? activeSub.paymentHistory.slice(-5)
                : []

        // ── Next plan suggestions ──
        const planOrder: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']
        const currentRank = planOrder.indexOf(effectivePlan)
        const nextPlan =
            currentRank < planOrder.length - 1
                ? PLANS[planOrder[currentRank + 1]]
                : null

        return NextResponse.json({
            // ── Plan info ──
            plan: effectivePlan,
            planName: planConfig.name,
            planColor: planConfig.color,

            // ── Status ──
            isInTrial,
            isPaid,
            isExpired,
            isScheduledCancel: activeSub?.status === 'scheduled_cancel',
            scheduledCancelAt: activeSub?.scheduledCancelAt
                ? new Date(activeSub.scheduledCancelAt).toISOString()
                : null,

            // ── Dates ──
            daysLeft: isInTrial ? getTrialDaysRemaining(trialEnd) : null,
            trialEndsAt: school.trialEndsAt
                ? new Date(school.trialEndsAt).toISOString()
                : null,
            validTill:
                isPaid && activeSub?.currentPeriodEnd
                    ? new Date(activeSub.currentPeriodEnd).toISOString()
                    : trialEnd.toISOString(),
            billingCycle: activeSub?.billingCycle ?? null,

            // ── Student/Teacher Limits ──
            limits: {
                students: {
                    used: studentCount,
                    limit: effectiveStudentLimit,
                    remaining:
                        effectiveStudentLimit === -1
                            ? -1
                            : Math.max(0, effectiveStudentLimit - studentCount),
                    isUnlimited: effectiveStudentLimit === -1,
                    planLimit: isInTrial ? TRIAL_CONFIG.maxStudents : planConfig.maxStudents,
                    addonCount: extraStudents,
                    // Add-on options when limit reached
                    addonOptions: !isInTrial && planConfig.maxStudents !== -1
                        ? Object.entries(ADDON_PRICING.extraStudents).map(([id, pack]) => ({
                            id,
                            students: pack.students,
                            price: pack.price,
                            pricePerStudent: pack.pricePerStudent,
                        }))
                        : [],
                },
                teachers: {
                    used: teacherStaffCount,
                    limit: effectiveTeacherLimit,
                    remaining:
                        effectiveTeacherLimit === -1
                            ? -1
                            : Math.max(0, effectiveTeacherLimit - teacherStaffCount),
                    isUnlimited: effectiveTeacherLimit === -1,
                    planLimit: isInTrial ? TRIAL_CONFIG.maxTeachers : planConfig.maxTeachers,
                    addonCount: extraTeachers,
                    addonOptions: !isInTrial && planConfig.maxTeachers !== -1
                        ? Object.entries(ADDON_PRICING.extraTeachers).map(([id, pack]) => ({
                            id,
                            teachers: pack.teachers,
                            price: pack.price,
                            pricePerTeacher: pack.pricePerTeacher,
                        }))
                        : [],
                },
            },

            // ── Credit System (replaces old SMS/Email/WA limits) ──
            credits: {
                balance: creditStats.balance,
                totalEarned: creditStats.totalEarned,
                totalUsed: creditStats.totalUsed,
                totalExpired: creditStats.totalExpired,
                freeCreditsPerMonth: isInTrial ? 0 : creditStats.freeCreditsPerMonth,
                rolloverMonths: creditStats.rolloverMonths,
                lowCreditWarning: creditStats.lowCreditWarning,
                last30DaysUsage: creditStats.last30DaysUsage,
                // Credit pack options
                creditPacks: CREDIT_PACKS.map(p => ({
                    id: p.id,
                    name: p.name,
                    credits: p.credits,
                    price: p.price,
                    savingsPercent: p.savingsPercent,
                    popular: p.popular,
                    description: p.description,
                })),
                // What 1 credit gets you
                creditGuide: {
                    sms: '1 credit = 1 SMS',
                    whatsapp: '1 credit = 1 WhatsApp',
                    email: '1 credit = 10 Emails',
                },
            },

            // ── Modules ──
            modules: school.modules || [],
            moduleCount: (school.modules || []).length,

            // ── Payments ──
            recentPayments,
            amount: activeSub?.amount || null,

            // ── Next plan (upgrade suggestion) ──
            nextPlan: nextPlan
                ? {
                    id: nextPlan.id,
                    name: nextPlan.name,
                    monthlyPrice: nextPlan.monthlyPrice,
                    yearlyPrice: nextPlan.yearlyPrice,
                    tagline: nextPlan.tagline,
                    additionalFeatures: nextPlan.features.slice(0, 4),
                }
                : null,

            // ── Add-on status ──
            addons: {
                extraStudents,
                extraTeachers,
                canPurchaseStudents: !isInTrial && planConfig.maxStudents !== -1,
                canPurchaseTeachers: !isInTrial && planConfig.maxTeachers !== -1,
            },
        })

    } catch (err: any) {
        console.error('Subscription status error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}