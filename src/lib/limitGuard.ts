// FILE: src/lib/limitGuard.ts
// UPDATED: Uses new credit system + add-on limits
// BACKWARD COMPATIBLE
// ═══════════════════════════════════════════════════════════

import { connectDB } from './db'
import { School } from '@/models/School'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { Subscription } from '@/models/Subscription'
import { MessageCredit } from '@/models/MessageCredit'
import { PLANS, TRIAL_CONFIG } from '@/config/pricing'
import type { PlanId } from '@/config/pricing'

interface LimitResult {
    allowed: boolean
    current: number
    limit: number
    remaining: number
    isUnlimited: boolean
    message?: string
    plan: string
    // NEW fields
    hasAddon: boolean
    addonCount: number
    canPurchaseAddon: boolean    // Always true (paid feature)
    upgradeMessage?: string
}

// ── Get effective plan from DB ──
async function getEffectivePlan(tenantId: string): Promise<{
    plan: PlanId
    isTrial: boolean
    extraStudents: number
    extraTeachers: number
}> {
    const school = await School.findById(tenantId)
        .select('plan subscriptionId trialEndsAt addonLimits')
        .lean() as any

    if (!school) throw new Error('School not found')

    const activeSub = await Subscription.findOne({
        tenantId,
        status: 'active',
    }).sort({ createdAt: -1 }).lean() as any

    const now = new Date()
    const trialEnd = new Date(school.trialEndsAt)
    const hasPaidSub = Boolean(activeSub) && Boolean(school.subscriptionId)

    const extraStudents = school.addonLimits?.extraStudents ?? 0
    const extraTeachers = school.addonLimits?.extraTeachers ?? 0

    if (hasPaidSub && activeSub?.currentPeriodEnd && new Date(activeSub.currentPeriodEnd) > now) {
        return { plan: activeSub.plan as PlanId, isTrial: false, extraStudents, extraTeachers }
    }

    if (!hasPaidSub && trialEnd > now) {
        return { plan: TRIAL_CONFIG.plan, isTrial: true, extraStudents: 0, extraTeachers: 0 }
    }

    return { plan: 'starter', isTrial: false, extraStudents, extraTeachers }
}

// ── Check student limit (plan + add-ons) ──
export async function checkCanAddStudent(tenantId: string): Promise<LimitResult> {
    await connectDB()

    const { plan: planId, isTrial, extraStudents } = await getEffectivePlan(tenantId)
    const planConfig = PLANS[planId]

    const currentCount = await Student.countDocuments({
        tenantId,
        status: 'active',
    })

    // Trial has fixed limit, no add-ons allowed
    if (isTrial) {
        const limit = TRIAL_CONFIG.maxStudents
        const allowed = currentCount < limit
        return {
            allowed,
            current: currentCount,
            limit,
            remaining: Math.max(0, limit - currentCount),
            isUnlimited: false,
            plan: planId,
            hasAddon: false,
            addonCount: 0,
            canPurchaseAddon: false,
            message: !allowed
                ? `Trial limit reached (${currentCount}/${limit}). Subscribe to a plan to add more students.`
                : undefined,
            upgradeMessage: !allowed
                ? 'Trial mein max 100 students. Subscribe karo for more.'
                : undefined,
        }
    }

    // Unlimited plan
    if (planConfig.maxStudents === -1) {
        return {
            allowed: true,
            current: currentCount,
            limit: -1,
            remaining: -1,
            isUnlimited: true,
            plan: planId,
            hasAddon: extraStudents > 0,
            addonCount: extraStudents,
            canPurchaseAddon: true,
        }
    }

    // Effective limit = plan limit + purchased add-ons
    const effectiveLimit = planConfig.maxStudents + extraStudents
    const allowed = currentCount < effectiveLimit

    return {
        allowed,
        current: currentCount,
        limit: effectiveLimit,
        remaining: Math.max(0, effectiveLimit - currentCount),
        isUnlimited: false,
        plan: planId,
        hasAddon: extraStudents > 0,
        addonCount: extraStudents,
        canPurchaseAddon: true,
        message: !allowed
            ? `Student limit reached (${currentCount}/${effectiveLimit}). Purchase extra student add-on or upgrade plan.`
            : undefined,
        upgradeMessage: !allowed
            ? `${planConfig.name} plan limit (${planConfig.maxStudents}) + ${extraStudents} add-on = ${effectiveLimit}. Extra students kharido ya plan upgrade karo.`
            : undefined,
    }
}

// ── Check teacher limit ──
export async function checkCanAddTeacher(tenantId: string): Promise<LimitResult> {
    await connectDB()

    const { plan: planId, isTrial, extraTeachers } = await getEffectivePlan(tenantId)
    const planConfig = PLANS[planId]

    const currentCount = await User.countDocuments({
        tenantId,
        role: { $in: ['teacher', 'staff'] },
        isActive: true,
    })

    if (isTrial) {
        const limit = TRIAL_CONFIG.maxTeachers
        const allowed = currentCount < limit
        return {
            allowed,
            current: currentCount,
            limit,
            remaining: Math.max(0, limit - currentCount),
            isUnlimited: false,
            plan: planId,
            hasAddon: false,
            addonCount: 0,
            canPurchaseAddon: false,
            message: !allowed
                ? `Trial limit reached (${currentCount}/${limit}). Subscribe to add more staff.`
                : undefined,
        }
    }

    if (planConfig.maxTeachers === -1) {
        return {
            allowed: true,
            current: currentCount,
            limit: -1,
            remaining: -1,
            isUnlimited: true,
            plan: planId,
            hasAddon: extraTeachers > 0,
            addonCount: extraTeachers,
            canPurchaseAddon: true,
        }
    }

    const effectiveLimit = planConfig.maxTeachers + extraTeachers
    const allowed = currentCount < effectiveLimit

    return {
        allowed,
        current: currentCount,
        limit: effectiveLimit,
        remaining: Math.max(0, effectiveLimit - currentCount),
        isUnlimited: false,
        plan: planId,
        hasAddon: extraTeachers > 0,
        addonCount: extraTeachers,
        canPurchaseAddon: true,
        message: !allowed
            ? `Staff limit reached (${currentCount}/${effectiveLimit}). Purchase extra staff add-on or upgrade plan.`
            : undefined,
        upgradeMessage: !allowed
            ? `${planConfig.name} plan limit (${planConfig.maxTeachers}) + ${extraTeachers} add-on = ${effectiveLimit}. Extra staff kharido ya plan upgrade karo.`
            : undefined,
    }
}

// ── Check credit balance ──
export interface CreditLimitResult {
    allowed: boolean
    balance: number
    required: number
    lowWarning: boolean
    message?: string
}

export async function checkCreditLimit(
    tenantId: string,
    creditsRequired: number
): Promise<CreditLimitResult> {
    await connectDB()

    const school = await School.findById(tenantId)
        .select('trialEndsAt subscriptionId creditBalance')
        .lean() as any

    const isTrial = !school?.subscriptionId &&
        new Date(school?.trialEndsAt) > new Date()
    const balance = school?.creditBalance ?? 0

    if (isTrial) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // ← Fix: proper import
        const { MessageLog } = await import('@/models/MessageLog')
        const { Types } = await import('mongoose')

        const todayUsage = await MessageLog.aggregate([
            {
                $match: {
                    tenantId: new Types.ObjectId(tenantId),
                    createdAt: { $gte: today },
                    status: { $ne: 'failed' },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$creditsUsed' },
                },
            },
        ])

        const todayCredits = todayUsage[0]?.total ?? 0
        const dailyCap = TRIAL_CONFIG.maxSmsPerDay * 2

        if (todayCredits + creditsRequired > dailyCap) {
            return {
                allowed: false,
                balance,
                required: creditsRequired,
                lowWarning: balance < 100,
                message: 'Trial daily limit reached. Subscribe for unlimited messaging.',
            }
        }
    }

    const allowed = balance >= creditsRequired
    return {
        allowed,
        balance,
        required: creditsRequired,
        lowWarning: balance < 100,
        message: !allowed
            ? `Insufficient credits. Balance: ${balance}, Required: ${creditsRequired}. Please purchase a credit pack.`
            : undefined,
    }
}