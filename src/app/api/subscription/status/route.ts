// FILE: src/app/api/subscription/status/route.ts
// FIX: storageAddon field add in select + correct parameter pass

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
    STORAGE_PACKS,
} from '@/config/pricing'
import type { PlanId } from '@/config/pricing'
import { getStorageStats } from '@/lib/storageAddon'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const school = await School.findById(session.user.tenantId)
            .select(
                'plan trialEndsAt subscriptionId isActive modules name ' +
                'creditBalance addonLimits storageAddon storageUsedBytes' // ✅ FIX: storageAddon + storageUsedBytes added
            )
            .lean() as any

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

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

        const [studentCount, teacherStaffCount] = await Promise.all([
            Student.countDocuments({ tenantId: school._id, status: 'active' }),
            User.countDocuments({
                tenantId: school._id,
                role: { $in: ['teacher', 'staff'] },
                isActive: true,
            }),
        ])

        const creditStats = await getCreditStats(session.user.tenantId)

        // ✅ FIX: school.storageAddon pass karo, addonLimits nahi
        const storageStats = await getStorageStats(
            session.user.tenantId,
            effectivePlan as PlanId,
            school.storageAddon  // ✅ CORRECT field
        )

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

        const recentPayments =
            isPaid && activeSub?.paymentHistory
                ? activeSub.paymentHistory.slice(-5)
                : []

        const planOrder: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']
        const currentRank = planOrder.indexOf(effectivePlan)
        const nextPlan =
            currentRank < planOrder.length - 1
                ? PLANS[planOrder[currentRank + 1]]
                : null

        // ✅ FIX: addonExpired correctly calculate karo
        const addonExpired = school.storageAddon?.validUntil
            ? new Date(school.storageAddon.validUntil) < now
            : false

        return NextResponse.json({
            plan: effectivePlan,
            planName: planConfig.name,
            planColor: planConfig.color,

            isInTrial,
            isPaid,
            isExpired,
            isScheduledCancel: activeSub?.status === 'scheduled_cancel',
            scheduledCancelAt: activeSub?.scheduledCancelAt
                ? new Date(activeSub.scheduledCancelAt).toISOString()
                : null,

            daysLeft: isInTrial ? getTrialDaysRemaining(trialEnd) : null,
            trialEndsAt: school.trialEndsAt
                ? new Date(school.trialEndsAt).toISOString()
                : null,
            validTill:
                isPaid && activeSub?.currentPeriodEnd
                    ? new Date(activeSub.currentPeriodEnd).toISOString()
                    : trialEnd.toISOString(),
            billingCycle: activeSub?.billingCycle ?? null,

            limits: {
                students: {
                    used: studentCount,
                    limit: effectiveStudentLimit,
                    remaining:
                        effectiveStudentLimit === -1
                            ? -1
                            : Math.max(0, effectiveStudentLimit - studentCount),
                    isUnlimited: effectiveStudentLimit === -1,
                    planLimit: isInTrial
                        ? TRIAL_CONFIG.maxStudents
                        : planConfig.maxStudents,
                    addonCount: extraStudents,
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
                    planLimit: isInTrial
                        ? TRIAL_CONFIG.maxTeachers
                        : planConfig.maxTeachers,
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

            credits: {
                balance: creditStats.balance,
                totalEarned: creditStats.totalEarned,
                totalUsed: creditStats.totalUsed,
                totalExpired: creditStats.totalExpired,
                freeCreditsPerMonth: isInTrial ? 0 : creditStats.freeCreditsPerMonth,
                rolloverMonths: creditStats.rolloverMonths,
                lowCreditWarning: creditStats.lowCreditWarning,
                last30DaysUsage: creditStats.last30DaysUsage,
                creditPacks: CREDIT_PACKS.map(p => ({
                    id: p.id,
                    name: p.name,
                    credits: p.credits,
                    price: p.price,
                    savingsPercent: p.savingsPercent,
                    popular: p.popular,
                    description: p.description,
                })),
                creditGuide: {
                    sms: '1 credit = 1 SMS',
                    whatsapp: '1 credit = 1 WhatsApp',
                    email: '1 credit = 10 Emails',
                },
            },

            modules: school.modules || [],
            moduleCount: (school.modules || []).length,

            recentPayments,
            amount: activeSub?.amount || null,

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

            addons: {
                extraStudents,
                extraTeachers,
                maxAddonStudents: planConfig.maxAddonStudents,
                maxAddonTeachers: planConfig.maxAddonTeachers,
                remainingAddonStudents: planConfig.maxAddonStudents === -1
                    ? -1
                    : Math.max(0, planConfig.maxAddonStudents - extraStudents),
                remainingAddonTeachers: planConfig.maxAddonTeachers === -1
                    ? -1
                    : Math.max(0, planConfig.maxAddonTeachers - extraTeachers),
                canPurchaseStudents: !isInTrial
                    && planConfig.maxStudents !== -1
                    && (planConfig.maxAddonStudents === -1
                        || extraStudents < planConfig.maxAddonStudents),
                canPurchaseTeachers: !isInTrial
                    && planConfig.maxTeachers !== -1
                    && (planConfig.maxAddonTeachers === -1
                        || extraTeachers < planConfig.maxAddonTeachers),
                studentAddonLimitReached: planConfig.maxAddonStudents !== -1
                    && extraStudents >= planConfig.maxAddonStudents,
                teacherAddonLimitReached: planConfig.maxAddonTeachers !== -1
                    && extraTeachers >= planConfig.maxAddonTeachers,
                upgradeNudge: (() => {
                    const planOrder: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']
                    const currentRank = planOrder.indexOf(effectivePlan)
                    const nextPlanId = currentRank < 3 ? planOrder[currentRank + 1] : null
                    if (!nextPlanId) return null
                    const np = PLANS[nextPlanId]
                    return {
                        planId: nextPlanId,
                        planName: np.name,
                        studentLimit: np.maxStudents === -1 ? 'Unlimited' : np.maxStudents,
                        teacherLimit: np.maxTeachers === -1 ? 'Unlimited' : np.maxTeachers,
                        monthlyPrice: np.monthlyPrice,
                    }
                })(),
            },

            // ✅ FIX: storageStats correctly populated
            storage: {
                planBaseGB: storageStats.planBaseGB,
                addonGB: storageStats.addonGB,
                totalLimitGB: storageStats.totalLimitGB,
                usedBytes: storageStats.usedBytes,
                usedGB: storageStats.usedGB,
                usedPercent: storageStats.usedPercent,
                freeGB: storageStats.freeGB,
                isUnlimited: storageStats.isUnlimited,
                isNearLimit: storageStats.isNearLimit,
                isFull: storageStats.isFull,
                addonCap: storageStats.addonCap,
                remainingAddonGB: storageStats.remainingAddonGB,
                canPurchaseMore: storageStats.canPurchaseMore && !isInTrial,

                // ✅ Addon expiry info
                addonExpired,
                addonExpiresAt: school.storageAddon?.validUntil
                    ? new Date(school.storageAddon.validUntil).toISOString()
                    : null,
                gracePeriodActive: school.storageAddon?.gracePeriodEndsAt
                    ? new Date(school.storageAddon.gracePeriodEndsAt) > now
                    : false,
                gracePeriodEndsAt: school.storageAddon?.gracePeriodEndsAt
                    ? new Date(school.storageAddon.gracePeriodEndsAt).toISOString()
                    : null,
                canDownload: true,
                autoRenew: school.storageAddon?.autoRenew ?? true,

                storagePacks: !isInTrial
                    ? STORAGE_PACKS.map(p => ({
                        id: p.id,
                        name: p.name,
                        storageGB: p.storageGB,
                        monthlyPrice: p.monthlyPrice,
                        yearlyPrice: p.yearlyPrice,
                        pricePerGB: p.pricePerGB,
                        pricePerDay: p.pricePerDay,
                        popular: p.popular,
                        description: p.description,
                        savingsPercent: p.savingsPercent,
                        features: p.features,
                    }))
                    : [],
            },
        })

    } catch (err: any) {
        console.error('Subscription status error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}