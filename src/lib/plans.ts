// Re-export everything from new config
export type {
    PlanId,
    BillingCycle,
    CreditType,
    CreditPackId,           // ← ADDED
    ExtraStudentPackId,     // ← ADDED
    ExtraTeacherPackId,     // ← ADDED
} from '@/config/pricing'

export {
    PLANS,
    TRIAL_CONFIG,
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
    getTrialModules,
    calculateCreditCost,
    getPriceBreakdown,
    getRazorpayBreakdown,
    calculateUpgradeAmount,
    getOrderAmountPaise,
    getCreditPack,
    getExtraStudentPack,
    getExtraTeacherPack,
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

// Old limit check types — kept for backward compat
export interface LimitCheck {
    allowed: boolean
    current: number
    limit: number
    remaining: number
    isUnlimited: boolean
    message?: string
}

// ── FIX: Static import instead of require() ──
import {
    getPlan as _getPlan,
    TRIAL_CONFIG as _TRIAL_CONFIG,
    getPrice as _getPrice,
    getPriceBreakdown as _getPriceBreakdown,
} from '@/config/pricing'
import type { PlanId as _PlanId, BillingCycle as _BillingCycle } from '@/config/pricing'

// Old helpers — still work
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
    // SMS is now credit-based — always allowed
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

// ── Price breakdown types (backward compat) ──
// NOTE: PriceBreakdown pricing.ts se re-export ho raha hai upar
// Yahan alag define karne ki zaroorat nahi
// Lekin agar koi purana code import karta hai to ye alias kaam karega:
export type { PriceBreakdown } from '@/config/pricing'

export function getPlanPriceBreakdown(
    planId: string,
    cycle: string
): import('@/config/pricing').PriceBreakdown {
    const price = _getPrice(planId as _PlanId, cycle as _BillingCycle)
    return _getPriceBreakdown(price)
}

// UpgradeBreakdown — pricing.ts se re-export
export type { UpgradeBreakdown } from '@/config/pricing'

// ── DEMO_CONFIG — Public facing (plans.ts ka apna) ──
export const DEMO_CONFIG = {
    schoolCode: 'demo_school',
    schoolName: 'Demo School - Skolify',
    adminPhone: '9999999999',
    adminPassword: 'Demo@123',
    adminName: 'Demo Admin',
    plan: 'enterprise' as _PlanId,
    trialDays: 36500,
    modules: [] as string[],
    isDemo: true,
} as const