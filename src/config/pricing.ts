// FILE: src/config/pricing.ts
// ═══════════════════════════════════════════════════════════════
// MULTI-TENANT PRICING CONFIGURATION
// School, Academy, Coaching Institute Management
// ✅ UPDATED: Trial me institution-wise sab modules (habit building)
// ✅ UPDATED: fees unified for all, coursePayments removed
// ═══════════════════════════════════════════════════════════════

import type { InstitutionType } from '@/lib/institutionConfig'

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type PlanId = 'starter' | 'growth' | 'pro' | 'enterprise'
export type BillingCycle = 'monthly' | 'yearly'
export type CreditType = 'sms' | 'email' | 'whatsapp'
export type CreditPackId = typeof CREDIT_PACKS[number]['id']
export type StoragePackId = typeof STORAGE_PACKS[number]['id']
export type ExtraStudentPackId = keyof typeof ADDON_PRICING.extraStudents
export type ExtraTeacherPackId = keyof typeof ADDON_PRICING.extraTeachers

export interface PlanConfig {
    id: PlanId
    name: string
    tagline: string
    monthlyPrice: number
    yearlyPrice: number
    yearlyMonthlyEquivalent: number
    yearlySavings: number
    description: string
    color: string
    accentColor: string
    maxStudents: number
    maxTeachers: number
    maxClasses: number
    freeCreditsPerMonth: number
    creditRolloverMonths: number
    storageGB: number
    modules: string[]
    features: string[]
    notIncluded: string[]
    highlighted: boolean
    badge?: string
    internalMonthlyCost: number
    internalMargin: number
    maxAddonStudents: number
    maxAddonTeachers: number
}

export interface PriceBreakdown {
    baseAmount: number
    gstAmount: number
    totalAmount: number
    gstEnabled: boolean
    gstRate: number
}

export interface RazorpayBreakdown {
    schoolPays: number
    razorpayFee: number
    razorpayGST: number
    totalDeduction: number
    netToAccount: number
    gstToGovt: number
    effectiveIncome: number
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

// ═══════════════════════════════════════════════════════════════
// INSTITUTION-SPECIFIC MODULES
// ✅ UPDATED: fees → common (all institution types)
// ✅ UPDATED: coursePayments → removed
// ✅ UPDATED: fees → removed from schoolOnly
// ═══════════════════════════════════════════════════════════════

export const INSTITUTION_MODULES = {
    common: [
        'students',
        'teachers',
        'attendance',
        'notices',
        'website',
        'gallery',
        'reports',
        'communication',
        'documents',
        'certificates',
        'fees',             // ✅ Now common — School: Fee Mgmt | Academy/Coaching: Course Payments
    ],

    schoolOnly: [
        // ✅ fees removed from here
        'exams',
        'timetable',
        'homework',
        'library',
        'lms',
        'hr',
        'transport',
        'hostel',
        'inventory',
        'visitor',
        'health',
        'alumni',
    ],

    academyCoachingOnly: [
        // ✅ coursePayments removed from here
        'courses',
        'batches',
        'enrollments',
        'franchises',
        'assessments',
        'assignments',
    ],
} as const

// ═══════════════════════════════════════════════════════════════
// CREDIT SYSTEM CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const CREDIT_COSTS: Record<CreditType, number> = {
    sms: 1,
    whatsapp: 1,
    email: 0.1,
}

export const CREDIT_SELL_PRICE = 1

export const CREDIT_PACKS = [
    {
        id: 'small',
        name: 'Small Pack',
        credits: 250,
        price: 199,
        pricePerCredit: 0.796,
        savingsPercent: 0,
        popular: false,
        description: '~250 SMS or 250 WhatsApp messages',
    },
    {
        id: 'medium',
        name: 'Medium Pack',
        credits: 700,
        price: 499,
        pricePerCredit: 0.713,
        savingsPercent: 29,
        popular: true,
        description: '~700 SMS or 700 WhatsApp messages',
    },
    {
        id: 'large',
        name: 'Large Pack',
        credits: 1500,
        price: 999,
        pricePerCredit: 0.666,
        savingsPercent: 33,
        popular: false,
        description: '~1,500 SMS or 1,500 WhatsApp messages',
    },
    {
        id: 'bulk',
        name: 'Bulk Pack',
        credits: 3500,
        price: 1999,
        pricePerCredit: 0.571,
        savingsPercent: 43,
        popular: false,
        description: '~3,500 SMS or 3,500 WhatsApp messages',
    },
] as const

// ═══════════════════════════════════════════════════════════════
// ADDON PRICING (STUDENTS & TEACHERS)
// ═══════════════════════════════════════════════════════════════

export const ADDON_PRICING = {
    extraStudents: {
        pack50: { students: 50, price: 99, pricePerStudent: 1.98 },
        pack100: { students: 100, price: 179, pricePerStudent: 1.79 },
        pack250: { students: 250, price: 399, pricePerStudent: 1.6 },
        pack500: { students: 500, price: 699, pricePerStudent: 1.4 },
    },
    extraTeachers: {
        pack5: { teachers: 5, price: 99, pricePerTeacher: 19.8 },
        pack10: { teachers: 10, price: 179, pricePerTeacher: 17.9 },
        pack25: { teachers: 25, price: 399, pricePerTeacher: 15.96 },
    },
} as const

// ═══════════════════════════════════════════════════════════════
// STORAGE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const PLAN_STORAGE_GB: Record<PlanId, number> = {
    starter: 2,
    growth: 10,
    pro: 50,
    enterprise: -1,
}

export const PLAN_STORAGE_ADDON_CAP_GB: Record<PlanId, number> = {
    starter: 20,
    growth: 100,
    pro: 500,
    enterprise: -1,
}

export const STORAGE_PACKS = [
    {
        id: 'storage_5gb',
        name: '5 GB Storage',
        storageGB: 5,
        monthlyPrice: 79,
        yearlyPrice: 799,
        pricePerGB: 15.8,
        pricePerDay: 2.63,
        popular: false,
        description: 'Extra photos aur documents ke liye',
        savingsPercent: 17,
        features: [
            '~2,500 high-res photos',
            '~100 PDF documents',
            'Auto-renews monthly',
            'Cancel anytime',
        ],
        ourCostPerMonth: 12,
        ourMargin: 84.8,
    },
    {
        id: 'storage_20gb',
        name: '20 GB Storage',
        storageGB: 20,
        monthlyPrice: 249,
        yearlyPrice: 2499,
        pricePerGB: 12.45,
        pricePerDay: 8.3,
        popular: true,
        description: 'Gallery aur homework files ke liye',
        savingsPercent: 17,
        features: [
            '~10,000 high-res photos',
            '~500 PDF documents',
            '~50 homework videos (5 min each)',
            'Perfect for growing schools',
        ],
        ourCostPerMonth: 38,
        ourMargin: 84.7,
    },
    {
        id: 'storage_50gb',
        name: '50 GB Storage',
        storageGB: 50,
        monthlyPrice: 499,
        yearlyPrice: 4999,
        pricePerGB: 9.98,
        pricePerDay: 16.63,
        popular: false,
        description: 'LMS videos aur bulk content',
        savingsPercent: 17,
        features: [
            '~25,000 photos',
            '~150 video lectures (10 min each)',
            '~1,000 documents',
            'Ideal for LMS module',
        ],
        ourCostPerMonth: 85,
        ourMargin: 83.0,
    },
    {
        id: 'storage_100gb',
        name: '100 GB Storage',
        storageGB: 100,
        monthlyPrice: 799,
        yearlyPrice: 7999,
        pricePerGB: 7.99,
        pricePerDay: 26.63,
        popular: false,
        description: 'Enterprise-level bulk storage',
        savingsPercent: 17,
        features: [
            '~50,000 photos',
            '~300 video lectures',
            '~2,000 documents',
            'Best value for large schools',
        ],
        ourCostPerMonth: 155,
        ourMargin: 80.6,
    },
] as const

export const STORAGE_INTERNAL_COSTS = {
    r2PerGBMonthly: 1.41,
    r2ClassAPerMillion: 423,
    r2ClassBPerMillion: 34,
    r2EgressPerGB: 0,
    avgUploadsPerSchool: 5000,
    avgDownloadsPerSchool: 50000,
    margin5GB: 84.8,
    margin20GB: 84.7,
    margin50GB: 83.0,
    margin100GB: 80.6,
    breakEvenMonths: 0,
    storagePerGBMonthly: 1.41,
    storageClassAPerMillion: 423,
    storageClassBPerMillion: 34,
    infraPerSchoolMonthly: {
        starter: 55,
        growth: 100,
        pro: 200,
        enterprise: 450,
    },
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL COST TRACKING
// ═══════════════════════════════════════════════════════════════

export const INTERNAL_COSTS = {
    perSms: 0.2,
    perWhatsapp: 0.35,
    perEmail: 0.033,
    perCreditCostAvg: 0.2,
    infraPerSchoolMonthly: {
        starter: 80,
        growth: 120,
        pro: 200,
        enterprise: 400,
    },
    razorpayFeeRate: 0.02,
    razorpayGSTOnFee: 0.18,
    supportCostMonthly: {
        starter: 30,
        growth: 50,
        pro: 75,
        enterprise: 150,
    },
}

// ═══════════════════════════════════════════════════════════════
// TRIAL CONFIGURATION
// ✅ UPDATED: coursePayments removed, fees added
// ✅ modules array = backward compat only
// ✅ Use getTrialModulesForInstitution() for registration
// ═══════════════════════════════════════════════════════════════

export const TRIAL_CONFIG = {
    durationDays: 60,
    plan: 'starter' as PlanId,
    freeCredits: 500,
    maxStudents: 100,
    maxTeachers: 10,
    maxSmsPerDay: 50,
    maxWhatsappPerDay: 30,
    maxEmailPerDay: 200,

    // ⚠️ Backward compat only — direct use mat karo
    // Registration ke liye getTrialModulesForInstitution() use karo
    modules: [
        // Common
        'students',
        'teachers',
        'attendance',
        'notices',
        'website',
        'gallery',
        'reports',
        'communication',
        'documents',
        'certificates',
        'fees',             // ✅ unified
        // School
        'exams',
        'timetable',
        'homework',
        'library',
        'lms',
        'hr',
        'transport',
        'hostel',
        'inventory',
        'visitor',
        'health',
        'alumni',
        // Academy/Coaching
        'courses',
        'batches',
        'enrollments',
        'franchises',
        'assessments',
        'assignments',
        // ✅ coursePayments removed
    ],

    internalCost: 260,
}

// ═══════════════════════════════════════════════════════════════
// PLAN DEFINITIONS
// ✅ UPDATED: coursePayments removed from all plans, fees unified
// ═══════════════════════════════════════════════════════════════

export const PLANS: Record<PlanId, PlanConfig> = {

    // ─────────────────────────────────────────────────────────────
    // STARTER PLAN - ₹499/month
    // ─────────────────────────────────────────────────────────────
    starter: {
        id: 'starter',
        name: 'Starter',
        tagline: 'Start your digital institution — just ₹17/day',
        monthlyPrice: 499,
        yearlyPrice: 4999,
        yearlyMonthlyEquivalent: 417,
        yearlySavings: 989,
        description: 'Perfect for small institutions — essential features',
        color: '#64748B',
        accentColor: '#94A3B8',
        maxStudents: 500,
        maxTeachers: 20,
        maxClasses: 12,
        freeCreditsPerMonth: 500,
        creditRolloverMonths: 0,
        storageGB: 2,

        modules: [
            'students',
            'teachers',
            'attendance',
            'notices',
            'website',
            'gallery',
            // Academy/Coaching ke liye
            'courses',
            'batches',
            'enrollments',
            // fees starter mein nahi — growth+ mein hai
        ],

        features: [
            'Up to 500 students',
            'Up to 20 teachers/instructors',
            'Professional website',
            'Student management + ID cards',
            'Daily attendance tracking',
            'Notice board',
            'Photo gallery',
            'Course/Batch management (Academy/Coaching)',
            '500 free credits/month',
            '2 GB storage',
            'Email support',
        ],

        notIncluded: [
            'Online payments',
            'Advanced features',
            'Franchise management',
        ],

        highlighted: false,
        internalMonthlyCost: 217,
        internalMargin: 282,
        maxAddonStudents: 250,
        maxAddonTeachers: 10,
    },

    // ─────────────────────────────────────────────────────────────
    // GROWTH PLAN - ₹999/month
    // ─────────────────────────────────────────────────────────────
    growth: {
        id: 'growth',
        name: 'Growth',
        tagline: 'Most popular — complete solution',
        monthlyPrice: 999,
        yearlyPrice: 9999,
        yearlyMonthlyEquivalent: 833,
        yearlySavings: 1989,
        description: 'For growing institutions — advanced features',
        color: '#4F46E5',
        accentColor: '#6366F1',
        maxStudents: 1500,
        maxTeachers: 50,
        maxClasses: 24,
        freeCreditsPerMonth: 1500,
        creditRolloverMonths: 3,
        storageGB: 10,

        modules: [
            'students',
            'teachers',
            'attendance',
            'notices',
            'website',
            'gallery',
            'reports',
            'communication',
            'documents',
            'fees',             // ✅ Unified — School: fees | Academy/Coaching: course payments
            // School modules
            'exams',
            'timetable',
            'homework',
            // Academy/Coaching modules
            'courses',
            'batches',
            'enrollments',
            'franchises',
            'assessments',
            'assignments',
            // ✅ coursePayments removed
        ],

        features: [
            'Everything in Starter +',
            'Up to 1,500 students',
            'Up to 50 teachers/instructors',
            'Online payments (All institution types)',
            'Exam/Assessment management',
            'Franchise management',
            'Reports & analytics',
            '1,500 free credits/month',
            '10 GB storage',
            'WhatsApp support',
        ],

        notIncluded: ['Library management', 'HR & Payroll', 'Advanced LMS'],

        highlighted: true,
        badge: 'Most Popular',
        internalMonthlyCost: 484,
        internalMargin: 515,
        maxAddonStudents: 750,
        maxAddonTeachers: 25,
    },

    // ─────────────────────────────────────────────────────────────
    // PRO PLAN - ₹1,999/month
    // ─────────────────────────────────────────────────────────────
    pro: {
        id: 'pro',
        name: 'Pro',
        tagline: 'Complete solution — everything included',
        monthlyPrice: 1999,
        yearlyPrice: 19999,
        yearlyMonthlyEquivalent: 1667,
        yearlySavings: 3989,
        description: 'For large institutions — premium features',
        color: '#7C3AED',
        accentColor: '#8B5CF6',
        maxStudents: 5000,
        maxTeachers: 150,
        maxClasses: 50,
        freeCreditsPerMonth: 3000,
        creditRolloverMonths: 6,
        storageGB: 50,

        modules: [
            'students',
            'teachers',
            'attendance',
            'notices',
            'website',
            'gallery',
            'reports',
            'communication',
            'documents',
            'certificates',
            'fees',             // ✅ Unified
            // School modules
            'exams',
            'timetable',
            'homework',
            'library',
            'lms',
            // Academy/Coaching modules
            'courses',
            'batches',
            'enrollments',
            'franchises',
            'assessments',
            'assignments',
            // ✅ coursePayments removed
        ],

        features: [
            'Everything in Growth +',
            'Up to 5,000 students',
            'Up to 150 teachers/instructors',
            'Library management (Schools)',
            'Online classes & LMS',
            'Custom certificates',
            'Advanced analytics',
            'Multi-franchise support',
            '3,000 free credits/month',
            '50 GB storage',
            'Priority support',
        ],

        notIncluded: ['HR & Payroll (School)', 'Multi-branch'],

        highlighted: false,
        internalMonthlyCost: 899,
        internalMargin: 1100,
        maxAddonStudents: 2000,
        maxAddonTeachers: 50,
    },

    // ─────────────────────────────────────────────────────────────
    // ENTERPRISE PLAN - ₹3,999/month
    // ─────────────────────────────────────────────────────────────
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        tagline: 'Zero limits — complete ecosystem',
        monthlyPrice: 3999,
        yearlyPrice: 39999,
        yearlyMonthlyEquivalent: 3333,
        yearlySavings: 7989,
        description: 'For chains & large institutions — unlimited',
        color: '#B45309',
        accentColor: '#D97706',
        maxStudents: -1,
        maxTeachers: -1,
        maxClasses: -1,
        freeCreditsPerMonth: 10000,
        creditRolloverMonths: -1,
        storageGB: -1,

        modules: [
            'students',
            'teachers',
            'attendance',
            'notices',
            'website',
            'gallery',
            'reports',
            'communication',
            'documents',
            'certificates',
            'fees',             // ✅ Unified
            // School modules
            'exams',
            'timetable',
            'homework',
            'library',
            'lms',
            'hr',
            'transport',
            'hostel',
            'inventory',
            'visitor',
            'health',
            'alumni',
            // Academy/Coaching modules
            'courses',
            'batches',
            'enrollments',
            'franchises',
            'assessments',
            'assignments',
            // ✅ coursePayments removed
        ],

        features: [
            'Everything in Pro +',
            'Unlimited students & teachers',
            'HR & Payroll (Schools)',
            'Transport tracking (Schools)',
            'Hostel management (Schools)',
            'Multi-branch/franchise',
            'API access',
            'White-label option',
            '10,000 free credits/month',
            'Unlimited storage',
            'Dedicated account manager',
        ],

        notIncluded: [],

        highlighted: false,
        badge: 'Enterprise',
        internalMonthlyCost: 1650,
        internalMargin: 2349,
        maxAddonStudents: -1,
        maxAddonTeachers: -1,
    },
}

// ═══════════════════════════════════════════════════════════════
// GST & PAYMENT GATEWAY CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const GST_CONFIG = {
    enabled: false,
    rate: 0.18,
    gstin: '',
    legalName: 'Shivshakti Computer Academy',
}

export const RAZORPAY_CONFIG = {
    feeRate: 0.02,
    gstOnFee: 0.18,
    netDeductionRate: 0.0236,
}

// ═══════════════════════════════════════════════════════════════
// DEMO CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const DEMO_CONFIG = {
    schoolCode: 'demo_school',
    schoolName: 'Demo School - Skolify',
    adminPhone: '9999999999',
    adminPassword: 'Demo@123',
    adminName: 'Demo Admin',
    plan: 'enterprise' as PlanId,
    trialDays: 365,
    isDemo: true,
}

// ═══════════════════════════════════════════════════════════════
// MARKETING & COMPARISON DATA
// ═══════════════════════════════════════════════════════════════

export const VISIT_CARD = {
    tagline: 'Jitna use karo utna pay karo — waste nahi!',
    trialOffer: '60 din FREE trial — koi card nahi chahiye',

    creditExplanation: {
        title: '1 Credit = ₹1',
        items: [
            { action: '1 SMS bhejo', credits: 1 },
            { action: '1 WhatsApp bhejo', credits: 1 },
            { action: '10 Emails bhejo', credits: 1 },
        ],
    },

    realExamples: [
        {
            schoolSize: '200 students',
            plan: 'Starter ₹299/month',
            freeCredits: 500,
            estimatedExtra: '₹199 credit pack',
            totalMonthly: '~₹498/month',
            perStudent: '₹2.49/student/month',
        },
        {
            schoolSize: '800 students',
            plan: 'Growth ₹599/month',
            freeCredits: 1500,
            estimatedExtra: '₹199-499 credit pack',
            totalMonthly: '~₹798-1,098/month',
            perStudent: '₹1.37/student/month',
        },
        {
            schoolSize: '2,000 students',
            plan: 'Pro ₹999/month',
            freeCredits: 3000,
            estimatedExtra: '₹999-1,999 credit pack',
            totalMonthly: '~₹1,998-2,998/month',
            perStudent: '₹1.50/student/month',
        },
    ],

    competitorComparison: [
        {
            feature: 'Starting Price',
            classPlus: '₹2,499/mo',
            others: '₹1,499',
            skolify: '₹299/mo ✅',
        },
        {
            feature: 'SMS',
            classPlus: 'Extra cost',
            others: 'Extra',
            skolify: 'Credits included ✅',
        },
        {
            feature: 'WhatsApp',
            classPlus: '❌',
            others: '❌',
            skolify: '✅ Credits',
        },
        {
            feature: 'Free Trial',
            classPlus: '7 days',
            others: '14 days',
            skolify: '60 days ✅',
        },
        {
            feature: 'Pay-as-you-go',
            classPlus: '❌',
            others: '❌',
            skolify: '✅ UNIQUE',
        },
        {
            feature: 'Hidden charges',
            classPlus: 'Yes',
            others: 'Yes',
            skolify: 'None ✅',
        },
    ],
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL P&L TRACKING
// ═══════════════════════════════════════════════════════════════

export const INTERNAL_PNL = {
    trialCostPerSchool: TRIAL_CONFIG.internalCost,
    targetConversionRate: 0.25,

    breakEvenSchools: {
        starter: Math.ceil(TRIAL_CONFIG.internalCost / PLANS.starter.internalMargin),
        growth: Math.ceil(TRIAL_CONFIG.internalCost / PLANS.growth.internalMargin),
        pro: Math.ceil(TRIAL_CONFIG.internalCost / PLANS.pro.internalMargin),
    },

    creditPackMargins: {
        small: {
            revenue: 199,
            cost: Math.ceil(250 * INTERNAL_COSTS.perCreditCostAvg),
            margin: 199 - 50,
        },
        medium: {
            revenue: 499,
            cost: Math.ceil(700 * INTERNAL_COSTS.perCreditCostAvg),
            margin: 499 - 140,
        },
        large: {
            revenue: 999,
            cost: Math.ceil(1500 * INTERNAL_COSTS.perCreditCostAvg),
            margin: 999 - 300,
        },
        bulk: {
            revenue: 1999,
            cost: Math.ceil(3500 * INTERNAL_COSTS.perCreditCostAvg),
            margin: 1999 - 700,
        },
    },
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — INSTITUTION MODULE FILTERING
// ═══════════════════════════════════════════════════════════════

/**
 * Trial modules for institution type
 * ✅ Trial = ALL relevant modules for habit building
 * 60-day trial me sab features use kar sake, phir subscribe kare
 */
export function getTrialModulesForInstitution(
    institutionType: InstitutionType
): string[] {
    const commonModules = [...INSTITUTION_MODULES.common]

    if (institutionType === 'school') {
        return [
            ...commonModules,
            ...INSTITUTION_MODULES.schoolOnly,
        ]
    }

    if (institutionType === 'academy' || institutionType === 'coaching') {
        return [
            ...commonModules,
            ...INSTITUTION_MODULES.academyCoachingOnly,
        ]
    }

    // Fallback
    return commonModules
}

/**
 * Paid plan modules for institution type
 * Plan ke modules se institution-type filter lagata hai
 */
export function getModulesForInstitution(
    institutionType: InstitutionType,
    plan: PlanId
): string[] {
    const planConfig = PLANS[plan]
    const allPlanModules = planConfig.modules

    if (institutionType === 'school') {
        return allPlanModules.filter(
            (m) => !INSTITUTION_MODULES.academyCoachingOnly.includes(m as any)
        )
    }

    if (institutionType === 'academy' || institutionType === 'coaching') {
        return allPlanModules.filter(
            (m) => !INSTITUTION_MODULES.schoolOnly.includes(m as any)
        )
    }

    return allPlanModules
}

/**
 * getTrialModules — wrapper for backward compat
 */
export function getTrialModules(institutionType: InstitutionType): string[] {
    return getTrialModulesForInstitution(institutionType)
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — PLAN MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function getPlan(planId: PlanId): PlanConfig {
    return PLANS[planId] ?? PLANS.starter
}

export function getPrice(planId: PlanId, cycle: BillingCycle): number {
    const plan = getPlan(planId)
    return cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
}

export function getSavings(planId: PlanId): number {
    return getPlan(planId).yearlySavings
}

/**
 * Check if module allowed for plan + optional institution type
 */
export function isModuleAllowed(
    planId: PlanId,
    moduleKey: string,
    institutionType?: InstitutionType
): boolean {
    const plan = getPlan(planId)

    if (!plan.modules.includes(moduleKey)) return false

    if (institutionType) {
        const allowedModules = getModulesForInstitution(institutionType, planId)
        return allowedModules.includes(moduleKey)
    }

    return true
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — TRIAL MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function getTrialDaysRemaining(trialEndsAt: Date | string): number {
    const diff = new Date(trialEndsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function isTrialExpired(trialEndsAt: Date | string): boolean {
    return new Date(trialEndsAt) < new Date()
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — CREDIT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function calculateCreditCost(type: CreditType, count: number): number {
    const raw = count * CREDIT_COSTS[type]
    return Math.round(raw * 100) / 100
}

export function creditsToActions(credits: number, type: CreditType): number {
    if (type === 'email') return Math.floor(credits / CREDIT_COSTS.email)
    return Math.floor(credits / CREDIT_COSTS[type])
}

export function getCreditPack(packId: CreditPackId) {
    return CREDIT_PACKS.find((p) => p.id === packId)
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — ADDON MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function getExtraStudentPack(packId: ExtraStudentPackId) {
    return ADDON_PRICING.extraStudents[packId]
}

export function getExtraTeacherPack(packId: ExtraTeacherPackId) {
    return ADDON_PRICING.extraTeachers[packId]
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — STORAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function getStoragePack(packId: StoragePackId) {
    return STORAGE_PACKS.find((p) => p.id === packId)
}

export function getPlanStorageGB(planId: PlanId): number {
    return PLAN_STORAGE_GB[planId] ?? 2
}

export function getPlanStorageAddonCap(planId: PlanId): number {
    return PLAN_STORAGE_ADDON_CAP_GB[planId] ?? 20
}

export function getStoragePrice(
    packId: StoragePackId,
    cycle: 'monthly' | 'yearly'
): number {
    const pack = getStoragePack(packId)
    if (!pack) return 0
    return cycle === 'monthly' ? pack.monthlyPrice : pack.yearlyPrice
}

export function getStorageCost(packId: StoragePackId): number {
    const pack = getStoragePack(packId)
    if (!pack) return 0

    const storageCost = pack.storageGB * STORAGE_INTERNAL_COSTS.r2PerGBMonthly
    const uploadCost =
        (STORAGE_INTERNAL_COSTS.avgUploadsPerSchool / 1_000_000) *
        STORAGE_INTERNAL_COSTS.r2ClassAPerMillion
    const downloadCost =
        (STORAGE_INTERNAL_COSTS.avgDownloadsPerSchool / 1_000_000) *
        STORAGE_INTERNAL_COSTS.r2ClassBPerMillion

    return Math.round(storageCost + uploadCost + downloadCost)
}

export function getStorageMargin(packId: StoragePackId): number {
    const pack = getStoragePack(packId)
    if (!pack) return 0

    const cost = getStorageCost(packId)
    const revenue = pack.monthlyPrice
    const profit = revenue - cost

    return Math.round((profit / revenue) * 100)
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — PRICING CALCULATIONS
// ═══════════════════════════════════════════════════════════════

export function getPriceBreakdown(amount: number): PriceBreakdown {
    if (!GST_CONFIG.enabled) {
        return {
            baseAmount: amount,
            gstAmount: 0,
            totalAmount: amount,
            gstEnabled: false,
            gstRate: 0,
        }
    }

    const gstAmount = Math.round(amount * GST_CONFIG.rate)

    return {
        baseAmount: amount,
        gstAmount,
        totalAmount: amount + gstAmount,
        gstEnabled: true,
        gstRate: GST_CONFIG.rate,
    }
}

export function getRazorpayBreakdown(totalPaid: number): RazorpayBreakdown {
    const razorpayFee = Math.round(totalPaid * RAZORPAY_CONFIG.feeRate)
    const razorpayGST = Math.round(razorpayFee * RAZORPAY_CONFIG.gstOnFee)
    const totalDeduction = razorpayFee + razorpayGST
    const netToAccount = totalPaid - totalDeduction

    const gstToGovt = GST_CONFIG.enabled
        ? Math.round((totalPaid * GST_CONFIG.rate) / (1 + GST_CONFIG.rate))
        : 0

    return {
        schoolPays: totalPaid,
        razorpayFee,
        razorpayGST,
        totalDeduction,
        netToAccount,
        gstToGovt,
        effectiveIncome: netToAccount - gstToGovt,
    }
}

export function calculateUpgradeAmount(
    currentPlan: PlanId,
    newPlan: PlanId,
    newBillingCycle: BillingCycle,
    currentBillingCycle: BillingCycle,
    currentPeriodStart: Date,
    currentPeriodEnd: Date
): UpgradeBreakdown {
    const now = new Date()
    const totalMs = currentPeriodEnd.getTime() - currentPeriodStart.getTime()
    const remainingMs = Math.max(0, currentPeriodEnd.getTime() - now.getTime())
    const totalDays = Math.max(1, Math.ceil(totalMs / 86400000))
    const daysRemaining = Math.ceil(remainingMs / 86400000)

    const currentPrice = getPrice(currentPlan, currentBillingCycle)
    const newPrice = getPrice(newPlan, newBillingCycle)
    const dailyRate = currentPrice / totalDays
    const creditAmount = Math.round(dailyRate * daysRemaining)
    const subtotal = Math.max(0, newPrice - creditAmount)

    const { gstAmount, totalAmount } = GST_CONFIG.enabled
        ? {
            gstAmount: Math.round(subtotal * GST_CONFIG.rate),
            totalAmount: subtotal + Math.round(subtotal * GST_CONFIG.rate),
        }
        : { gstAmount: 0, totalAmount: subtotal }

    return {
        newPlanPrice: newPrice,
        creditAmount,
        subtotal,
        gstAmount,
        totalPayable: totalAmount,
        daysRemaining,
        dailyRate: Math.round(dailyRate),
        explanation: `${daysRemaining} din bache → ₹${creditAmount.toLocaleString(
            'en-IN'
        )} credit mila → Sirf ₹${subtotal.toLocaleString('en-IN')} pay karo`,
    }
}

export function getOrderAmountPaise(baseAmount: number): number {
    return getPriceBreakdown(baseAmount).totalAmount * 100
}