// FILE: src/lib/limitGuard.ts
// Check student/teacher count limits before adding new ones

import { connectDB } from './db'
import { School } from '@/models/School'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { Subscription } from '@/models/Subscription'
import { getPlan, TRIAL_CONFIG } from './plans'
import type { PlanId } from './plans'

interface LimitResult {
    allowed: boolean
    current: number
    limit: number
    remaining: number
    isUnlimited: boolean
    message?: string
    plan: string
}

async function getEffectivePlan(tenantId: string): Promise<{
    plan: PlanId
    isTrial: boolean
}> {
    const school = await School.findById(tenantId)
        .select('plan subscriptionId trialEndsAt')
        .lean() as any

    if (!school) throw new Error('School not found')

    const activeSub = await Subscription.findOne({
        tenantId,
        status: 'active',
    }).sort({ createdAt: -1 }).lean() as any

    const now = new Date()
    const trialEnd = new Date(school.trialEndsAt)
    const hasPaidSub = Boolean(activeSub) && Boolean(school.subscriptionId)

    if (hasPaidSub && activeSub?.currentPeriodEnd && new Date(activeSub.currentPeriodEnd) > now) {
        return { plan: activeSub.plan as PlanId, isTrial: false }
    }

    if (!hasPaidSub && trialEnd > now) {
        return { plan: TRIAL_CONFIG.plan, isTrial: true }
    }

    return { plan: 'starter', isTrial: false }
}

export async function checkCanAddStudent(tenantId: string): Promise<LimitResult> {
    await connectDB()

    const { plan: planId, isTrial } = await getEffectivePlan(tenantId)
    const plan = getPlan(planId)

    const currentCount = await Student.countDocuments({
        tenantId,
        status: 'active',
    })

    const limit = isTrial ? TRIAL_CONFIG.maxStudents : plan.maxStudents

    if (limit === -1) {
        return {
            allowed: true, current: currentCount, limit: -1,
            remaining: -1, isUnlimited: true, plan: planId,
        }
    }

    const allowed = currentCount < limit
    return {
        allowed,
        current: currentCount,
        limit,
        remaining: Math.max(0, limit - currentCount),
        isUnlimited: false,
        plan: planId,
        message: !allowed
            ? `Student limit reached (${currentCount}/${limit}). Upgrade your plan to add more students.`
            : undefined,
    }
}

export async function checkCanAddTeacher(tenantId: string): Promise<LimitResult> {
    await connectDB()

    const { plan: planId, isTrial } = await getEffectivePlan(tenantId)
    const plan = getPlan(planId)

    const currentCount = await User.countDocuments({
        tenantId,
        role: 'teacher',
        isActive: true,
    })

    const limit = isTrial ? TRIAL_CONFIG.maxTeachers : plan.maxTeachers

    if (limit === -1) {
        return {
            allowed: true, current: currentCount, limit: -1,
            remaining: -1, isUnlimited: true, plan: planId,
        }
    }

    const allowed = currentCount < limit
    return {
        allowed,
        current: currentCount,
        limit,
        remaining: Math.max(0, limit - currentCount),
        isUnlimited: false,
        plan: planId,
        message: !allowed
            ? `Teacher limit reached (${currentCount}/${limit}). Upgrade your plan to add more teachers.`
            : undefined,
    }
}