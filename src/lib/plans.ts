// FILE: src/lib/plans.ts
// UPDATED: Re-exports from config/pricing.ts
// FULLY BACKWARD COMPATIBLE — all old imports work
// ═══════════════════════════════════════════════════════════

// Re-export everything from new config
export type { PlanId, BillingCycle, CreditType } from '@/config/pricing'
export {
    PLANS,
    TRIAL_CONFIG,
    GST_CONFIG,
    RAZORPAY_CONFIG,
    // ← DEMO_CONFIG yahan se export NAHI karo — niche alag define hai
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

// Old helpers — still work
export function checkStudentLimit(planId: string, currentCount: number): LimitCheck {
    const { getPlan } = require('@/config/pricing')
    const plan = getPlan(planId as any)
    const limit = plan.maxStudents
    if (limit === -1) {
        return { allowed: true, current: currentCount, limit: -1, remaining: -1, isUnlimited: true }
    }
    return {
        allowed: currentCount < limit,
        current: currentCount,
        limit,
        remaining: Math.max(0, limit - currentCount),
        isUnlimited: false,
        message: currentCount >= limit ? `Student limit reached (${currentCount}/${limit}).` : undefined,
    }
}

export function checkSmsLimit(_planId: string, currentMonthUsage: number): LimitCheck {
    // SMS is now credit-based — always allowed (credit check handles it)
    return { allowed: true, current: currentMonthUsage, limit: -1, remaining: -1, isUnlimited: true }
}

export function checkEmailLimit(_planId: string, currentMonthUsage: number): LimitCheck {
    return { allowed: true, current: currentMonthUsage, limit: -1, remaining: -1, isUnlimited: true }
}

export function checkWhatsappLimit(_planId: string, currentMonthUsage: number): LimitCheck {
    return { allowed: true, current: currentMonthUsage, limit: -1, remaining: -1, isUnlimited: true }
}

export function getTrialDurationDays(): number {
    const { TRIAL_CONFIG } = require('@/config/pricing')
    return TRIAL_CONFIG.durationDays
}

// ── Price breakdown types (backward compat) ──
export interface PriceBreakdown {
    baseAmount: number
    gstAmount: number
    totalAmount: number
    gstEnabled: boolean
    gstRate: number
}

export function getPlanPriceBreakdown(planId: string, cycle: string): PriceBreakdown {
    const { getPrice, getPriceBreakdown } = require('@/config/pricing')
    return getPriceBreakdown(getPrice(planId as any, cycle as any))
}

export interface UpgradeBreakdown {
    newPlanPrice: number
    creditAmount: number
    subtotal: number
    gstAmount: number
    totalPayable: number
    daysRemaining: number
    dailyRate: number
    explanation: string
}

// ── DEMO_CONFIG — defined here only (not re-exported from pricing.ts) ──
// pricing.ts wala DEMO_CONFIG internal hai
// plans.ts wala ye public facing hai — dono alag hain
export const DEMO_CONFIG = {
    schoolCode: 'demo_school',
    schoolName: 'Demo School - Skolify',
    adminPhone: '9999999999',
    adminPassword: 'Demo@123',
    adminName: 'Demo Admin',
    plan: 'enterprise' as any,
    trialDays: 36500,
    modules: [] as string[],
    isDemo: true,
} as const