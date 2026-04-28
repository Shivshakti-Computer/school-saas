// FILE: src/lib/plans.ts
// Re-export everything from config/pricing
// Backward compatible — purani imports kaam karengi
// ✅ UPDATED: getTrialModulesForInstitution + getModulesForInstitution added

export type {
    PlanId,
    BillingCycle,
    CreditType,
    CreditPackId,
    ExtraStudentPackId,
    ExtraTeacherPackId,
    PriceBreakdown,
    UpgradeBreakdown,
} from '@/config/pricing'

export {
    PLANS,
    TRIAL_CONFIG,
    INSTITUTION_MODULES,    // ✅ ADD: Migration script + guards use karte hain
    GST_CONFIG,
    RAZORPAY_CONFIG,
    CREDIT_COSTS,
    CREDIT_PACKS,
    ADDON_PRICING,
    getPlan,
    getPrice,
    getSavings,
    isModuleAllowed,
    getTrialDaysRemaining,
    isTrialExpired,
    getTrialModules,                    // existing
    getTrialModulesForInstitution,      // ✅ ADD: Registration use karta hai
    getModulesForInstitution,           // ✅ ADD: Paid plan filtering
    calculateCreditCost,
    getPriceBreakdown,
    getRazorpayBreakdown,
    calculateUpgradeAmount,
    getOrderAmountPaise,
    getCreditPack,
    getExtraStudentPack,
    getExtraTeacherPack,
    DEMO_CONFIG,
} from '@/config/pricing'

// ── Old interface kept for backward compatibility ──
export interface Plan {
    id: string
    name: string
    tagline: string
    monthlyPrice: number
    yearlyPrice: number
    description: string
    color: string
    modules: string[]
    maxStudents: number
    maxTeachers: number
    maxClasses: number
    maxSmsPerMonth: number
    maxEmailPerMonth: number
    maxWhatsappPerMonth: number
    maxStorageGB: number
    features: string[]
    notIncluded?: string[]
    highlighted?: boolean
}

export interface LimitCheck {
    allowed: boolean
    current: number
    limit: number
    remaining: number
    isUnlimited: boolean
    message?: string
}

import {
    getPlan as _getPlan,
    TRIAL_CONFIG as _TRIAL_CONFIG,
    getPrice as _getPrice,
    getPriceBreakdown as _getPriceBreakdown,
} from '@/config/pricing'
import type { PlanId as _PlanId, BillingCycle as _BillingCycle } from '@/config/pricing'

export function checkStudentLimit(
    planId: string,
    currentCount: number
): LimitCheck {
    const plan = _getPlan(planId as _PlanId)
    const limit = plan.maxStudents

    if (limit === -1) {
        return {
            allowed: true,
            current: currentCount,
            limit: -1,
            remaining: -1,
            isUnlimited: true,
        }
    }

    return {
        allowed: currentCount < limit,
        current: currentCount,
        limit,
        remaining: Math.max(0, limit - currentCount),
        isUnlimited: false,
        message:
            currentCount >= limit
                ? `Student limit reached (${currentCount}/${limit}).`
                : undefined,
    }
}

export function checkSmsLimit(
    _planId: string,
    currentMonthUsage: number
): LimitCheck {
    return {
        allowed: true,
        current: currentMonthUsage,
        limit: -1,
        remaining: -1,
        isUnlimited: true,
    }
}

export function checkEmailLimit(
    _planId: string,
    currentMonthUsage: number
): LimitCheck {
    return {
        allowed: true,
        current: currentMonthUsage,
        limit: -1,
        remaining: -1,
        isUnlimited: true,
    }
}

export function checkWhatsappLimit(
    _planId: string,
    currentMonthUsage: number
): LimitCheck {
    return {
        allowed: true,
        current: currentMonthUsage,
        limit: -1,
        remaining: -1,
        isUnlimited: true,
    }
}

export function getTrialDurationDays(): number {
    return _TRIAL_CONFIG.durationDays
}

export function getPlanPriceBreakdown(
    planId: string,
    cycle: string
): import('@/config/pricing').PriceBreakdown {
    const price = _getPrice(planId as _PlanId, cycle as _BillingCycle)
    return _getPriceBreakdown(price)
}