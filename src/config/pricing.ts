// FILE: src/config/pricing.ts
// ═══════════════════════════════════════════════════════════════
// SKOLIFY PRICING MASTER CONFIG — Single Source of Truth
// School visits + Internal P&L + Credit System + Plans
// DO NOT modify without updating all dependent files
// ═══════════════════════════════════════════════════════════════

export type PlanId = 'starter' | 'growth' | 'pro' | 'enterprise'
export type BillingCycle = 'monthly' | 'yearly'
export type CreditType = 'sms' | 'email' | 'whatsapp'

// ─── CREDIT COSTS (What 1 action costs in credits) ───
export const CREDIT_COSTS: Record<CreditType, number> = {
    sms: 1,        // 1 SMS = 1 Credit
    whatsapp: 1,   // 1 WhatsApp = 1 Credit
    email: 0.1,    // 10 Emails = 1 Credit
}

// ─── OUR ACTUAL COST (Internal P&L Reference) ───
// MSG91 rates — DO NOT SHARE WITH SCHOOLS
export const INTERNAL_COSTS = {
    perSms: 0.20,           // ₹0.20 per SMS (MSG91 transactional)
    perWhatsapp: 0.35,      // ₹0.35 per WhatsApp (MSG91 utility)
    perEmail: 0.033,        // ₹0.033 per email (Resend after free tier)
    perCreditCostAvg: 0.20, // Average cost per credit to us
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

// ─── CREDIT SELL PRICE ───
// 1 Credit = ₹1 to school
// Our margin per credit type:
// SMS: ₹1 - ₹0.20 = 80% margin
// WhatsApp: ₹1 - ₹0.35 = 65% margin
// Email: ₹0.10 - ₹0.033 = 67% margin
export const CREDIT_SELL_PRICE = 1 // ₹1 per credit

// ─── CREDIT PACKS ───
export const CREDIT_PACKS = [
    {
        id: 'small',
        name: 'Small Pack',
        credits: 250,
        price: 199,
        pricePerCredit: 0.796,
        savingsPercent: 0,
        popular: false,
        description: '~250 SMS ya 250 WhatsApp messages',
    },
    {
        id: 'medium',
        name: 'Medium Pack',
        credits: 700,
        price: 499,
        pricePerCredit: 0.713,
        savingsPercent: 29,
        popular: true,
        description: '~700 SMS ya 700 WhatsApp messages',
    },
    {
        id: 'large',
        name: 'Large Pack',
        credits: 1500,
        price: 999,
        pricePerCredit: 0.666,
        savingsPercent: 33,
        popular: false,
        description: '~1,500 SMS ya 1,500 WhatsApp messages',
    },
    {
        id: 'bulk',
        name: 'Bulk Pack',
        credits: 3500,
        price: 1999,
        pricePerCredit: 0.571,
        savingsPercent: 43,
        popular: false,
        description: '~3,500 SMS ya 3,500 WhatsApp messages',
    },
] as const

export type CreditPackId = typeof CREDIT_PACKS[number]['id']

// ─── ADD-ON: EXTRA STUDENTS/TEACHERS ───
// Jab limit puri ho to school extra kharid sake
export const ADDON_PRICING = {
    extraStudents: {
        pack50: { students: 50, price: 99, pricePerStudent: 1.98 },
        pack100: { students: 100, price: 179, pricePerStudent: 1.79 },
        pack250: { students: 250, price: 399, pricePerStudent: 1.60 },
        pack500: { students: 500, price: 699, pricePerStudent: 1.40 },
    },
    extraTeachers: {
        pack5: { teachers: 5, price: 99, pricePerTeacher: 19.8 },
        pack10: { teachers: 10, price: 179, pricePerTeacher: 17.9 },
        pack25: { teachers: 25, price: 399, pricePerTeacher: 15.96 },
    },
} as const

export type ExtraStudentPackId = keyof typeof ADDON_PRICING.extraStudents
export type ExtraTeacherPackId = keyof typeof ADDON_PRICING.extraTeachers

// ─── TRIAL CONFIG ───
export const TRIAL_CONFIG = {
    durationDays: 60,
    plan: 'starter' as PlanId,
    freeCredits: 500,         // Total credits for entire trial (NOT per month)
    maxStudents: 100,
    maxTeachers: 10,
    maxSmsPerDay: 50,         // Daily cap to prevent abuse
    maxWhatsappPerDay: 30,
    maxEmailPerDay: 200,
    modules: [
        'students', 'teachers', 'attendance', 'notices',
        'website', 'gallery', 'fees', 'exams', 'timetable',
        'homework', 'documents', 'reports', 'communication',
        'library', 'certificates', 'lms',
        'hr', 'transport', 'hostel',
        'inventory', 'visitor', 'health', 'alumni',
    ],
    // Trial cost to us:
    // 500 credits × ₹0.20 = ₹100
    // Infra: ₹80 × 2 months = ₹160
    // Total: ₹260 per trial school
    internalCost: 260,
}

// ─── PLAN DEFINITIONS ───
export interface PlanConfig {
    id: PlanId
    name: string
    tagline: string
    monthlyPrice: number
    yearlyPrice: number
    yearlyMonthlyEquivalent: number  // yearlyPrice / 12
    yearlySavings: number            // monthlyPrice * 12 - yearlyPrice
    description: string
    color: string
    accentColor: string
    maxStudents: number              // -1 = unlimited
    maxTeachers: number
    maxClasses: number
    freeCreditsPerMonth: number      // Included credits
    creditRolloverMonths: number     // 0 = no rollover
    storageGB: number                // -1 = unlimited
    modules: string[]
    features: string[]
    notIncluded: string[]
    highlighted: boolean
    badge?: string
    // Internal P&L fields
    internalMonthlyCost: number      // Our cost to serve this plan
    internalMargin: number           // Revenue - Cost
    // ── NEW: Addon caps ──
    maxAddonStudents: number    // -1 = unlimited, else max extra students
    maxAddonTeachers: number    // -1 = unlimited, else max extra teachers
}

export const PLANS: Record<PlanId, PlanConfig> = {

    // ─── STARTER ₹499/mo ───
    starter: {
        id: 'starter',
        name: 'Starter',
        tagline: 'Start your digital school — just ₹17/day',
        monthlyPrice: 499,
        yearlyPrice: 4999,
        yearlyMonthlyEquivalent: 417,
        yearlySavings: 989,
        description: 'Perfect for small schools — website, attendance, and messaging all in one place',
        color: '#64748B',
        accentColor: '#94A3B8',
        maxStudents: 500,
        maxTeachers: 20,
        maxClasses: 12,
        freeCreditsPerMonth: 500,
        creditRolloverMonths: 0,
        storageGB: 2,
        modules: [
            'students', 'teachers', 'attendance', 'notices',
            'website', 'gallery',
        ],
        features: [
            'Up to 500 students',
            'Up to 20 teachers/staff',
            'Professional school website',
            'Student management + ID cards',
            'Daily attendance tracking',
            'Notice board',
            'Photo gallery',
            'Student & Parent login',
            '500 free credits/month',
            '2 GB storage',
            'Email support',
            'Buy extra credits anytime',
            'Extra student add-on available',
        ],
        notIncluded: [
            'Online fee collection',
            'Exam & result management',
            'Timetable management',
            'Library management',
            'HR & Payroll',
        ],
        highlighted: false,
        internalMonthlyCost: 217,
        internalMargin: 282,
        maxAddonStudents: 250,   // 500 → max 750 total
        maxAddonTeachers: 10,    // 20  → max 30 total
    },

    // ─── GROWTH ₹999/mo ───
    growth: {
        id: 'growth',
        name: 'Growth',
        tagline: 'Most popular — complete school in one app',
        monthlyPrice: 999,
        yearlyPrice: 9999,
        yearlyMonthlyEquivalent: 833,
        yearlySavings: 1989,
        description: 'For growing schools — fees, exams, and homework fully automated',
        color: '#4F46E5',
        accentColor: '#6366F1',
        maxStudents: 1500,
        maxTeachers: 50,
        maxClasses: 24,
        freeCreditsPerMonth: 1500,
        creditRolloverMonths: 3,
        storageGB: 10,
        modules: [
            'students', 'teachers', 'attendance', 'notices',
            'website', 'gallery', 'fees', 'exams', 'timetable',
            'homework', 'documents', 'reports', 'communication',
        ],
        features: [
            'Everything in Starter +',
            'Up to 1,500 students',
            'Up to 50 teachers/staff',
            'Online fee collection (Razorpay)',
            'Automatic fee reminders',
            'Exam scheduling + marks entry',
            'Report cards PDF',
            'Class timetable',
            'Homework & assignments',
            'TC, CC & Bonafide generation',
            '1,500 free credits/month',
            '3-month credit rollover',
            '10 GB storage',
            'WhatsApp support',
            'Buy extra credits anytime',
            'Extra student add-on available',
        ],
        notIncluded: [
            'Library management',
            'Certificate generation',
            'Online classes (LMS)',
            'HR & Payroll',
            'Transport tracking',
        ],
        highlighted: true,
        badge: 'Most Popular',
        internalMonthlyCost: 484,
        internalMargin: 515,
        maxAddonStudents: 750,   // 1500 → max 2250 total
        maxAddonTeachers: 25,    // 50   → max 75 total
    },

    // ─── PRO ₹1,999/mo ───
    pro: {
        id: 'pro',
        name: 'Pro',
        tagline: 'Complete solution — everything included',
        monthlyPrice: 1999,
        yearlyPrice: 19999,
        yearlyMonthlyEquivalent: 1667,
        yearlySavings: 3989,
        description: 'For large schools — library, LMS, certificates, and advanced analytics',
        color: '#7C3AED',
        accentColor: '#8B5CF6',
        maxStudents: 5000,
        maxTeachers: 150,
        maxClasses: 50,
        freeCreditsPerMonth: 3000,
        creditRolloverMonths: 6,
        storageGB: 50,
        modules: [
            'students', 'teachers', 'attendance', 'notices',
            'website', 'gallery', 'fees', 'exams', 'timetable',
            'homework', 'documents', 'reports', 'communication',
            'library', 'certificates', 'lms',
        ],
        features: [
            'Everything in Growth +',
            'Up to 5,000 students',
            'Up to 150 teachers/staff',
            'Library management',
            'Custom certificate generation',
            'Online classes & LMS',
            'Advanced analytics',
            'Custom school branding',
            '3,000 free credits/month',
            '6-month credit rollover',
            '50 GB storage',
            'Priority support',
            'Dedicated WhatsApp group',
            'Buy extra credits anytime',
            'Extra student add-on available',
        ],
        notIncluded: [
            'HR & Payroll',
            'Transport & GPS tracking',
            'Hostel management',
            'Multi-branch support',
        ],
        highlighted: false,
        internalMonthlyCost: 899,
        internalMargin: 1100,
        maxAddonStudents: 2000,  // 5000 → max 7000 total
        maxAddonTeachers: 50,    // 150  → max 200 total
    },

    // ─── ENTERPRISE ₹3,999/mo ───
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        tagline: 'Zero limits — complete school ecosystem',
        monthlyPrice: 3999,
        yearlyPrice: 39999,
        yearlyMonthlyEquivalent: 3333,
        yearlySavings: 7989,
        description: 'For school chains & institutions — unlimited everything',
        color: '#B45309',
        accentColor: '#D97706',
        maxStudents: -1,
        maxTeachers: -1,
        maxClasses: -1,
        freeCreditsPerMonth: 10000,
        creditRolloverMonths: -1,
        storageGB: -1,
        modules: [
            'students', 'teachers', 'attendance', 'notices',
            'website', 'gallery', 'fees', 'exams', 'timetable',
            'homework', 'documents', 'reports', 'communication',
            'library', 'certificates', 'lms',
            'hr', 'transport', 'hostel',
            'inventory', 'visitor', 'health', 'alumni',
        ],
        features: [
            'Everything in Pro +',
            'Unlimited students & teachers',
            'HR & staff payroll',
            'Transport & GPS tracking',
            'Hostel management',
            'Inventory tracking',
            'Visitor management',
            'Student health records',
            'Alumni network',
            '10,000 free credits/month',
            'Credits never expire',
            'Unlimited storage',
            'Multi-branch support',
            'API access',
            'White-label option',
            'Dedicated account manager',
            'Custom feature development',
        ],
        notIncluded: [],
        highlighted: false,
        badge: 'Enterprise',
        internalMonthlyCost: 1650,
        internalMargin: 2349,
        maxAddonStudents: -1,    // unlimited
        maxAddonTeachers: -1,    // unlimited
    },
}

// ─── GST CONFIG ───
export const GST_CONFIG = {
    enabled: false,
    rate: 0.18,
    gstin: '',
    legalName: 'Shivshakti Computer Academy',
}

// ─── RAZORPAY CONFIG ───
export const RAZORPAY_CONFIG = {
    feeRate: 0.02,
    gstOnFee: 0.18,
    netDeductionRate: 0.0236,
}

// ─── DEMO CONFIG ───
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

// ═══════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════

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

export function isModuleAllowed(planId: PlanId, moduleKey: string): boolean {
    return getPlan(planId).modules.includes(moduleKey)
}

export function getTrialDaysRemaining(trialEndsAt: Date | string): number {
    const diff = new Date(trialEndsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function isTrialExpired(trialEndsAt: Date | string): boolean {
    return new Date(trialEndsAt) < new Date()
}

export function getTrialModules(): string[] {
    return TRIAL_CONFIG.modules
}

// Credit cost calculator
export function calculateCreditCost(
    type: CreditType,
    count: number
): number {
    const raw = count * CREDIT_COSTS[type]

    // Email: 0.1 per message — decimal preserve karo
    // SMS/WhatsApp: 1 per message — ceil safe hai
    // Math.ceil sirf bulk ke liye use karo (fractional messages nahi hote)
    // Per-message cost exact hona chahiye
    return Math.round(raw * 100) / 100
}

// How many actions can you do with X credits
export function creditsToActions(credits: number, type: CreditType): number {
    if (type === 'email') return Math.floor(credits / CREDIT_COSTS.email)
    return Math.floor(credits / CREDIT_COSTS[type])
}

// Get credit pack by id
export function getCreditPack(packId: CreditPackId) {
    return CREDIT_PACKS.find(p => p.id === packId)
}

// Get extra student pack
export function getExtraStudentPack(packId: ExtraStudentPackId) {
    return ADDON_PRICING.extraStudents[packId]
}

export function getExtraTeacherPack(packId: ExtraTeacherPackId) {
    return ADDON_PRICING.extraTeachers[packId]
}

// Price breakdown with GST
export interface PriceBreakdown {
    baseAmount: number
    gstAmount: number
    totalAmount: number
    gstEnabled: boolean
    gstRate: number
}

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

// Razorpay breakdown
export interface RazorpayBreakdown {
    schoolPays: number
    razorpayFee: number
    razorpayGST: number
    totalDeduction: number
    netToAccount: number
    gstToGovt: number
    effectiveIncome: number
}

export function getRazorpayBreakdown(totalPaid: number): RazorpayBreakdown {
    const razorpayFee = Math.round(totalPaid * RAZORPAY_CONFIG.feeRate)
    const razorpayGST = Math.round(razorpayFee * RAZORPAY_CONFIG.gstOnFee)
    const totalDeduction = razorpayFee + razorpayGST
    const netToAccount = totalPaid - totalDeduction
    const gstToGovt = GST_CONFIG.enabled
        ? Math.round(totalPaid * GST_CONFIG.rate / (1 + GST_CONFIG.rate))
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

// Upgrade proration
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

export function calculateUpgradeAmount(
    currentPlan: PlanId,
    newPlan: PlanId,
    newBillingCycle: BillingCycle,
    currentBillingCycle: BillingCycle,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
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
        explanation: `${daysRemaining} din bache → ₹${creditAmount.toLocaleString('en-IN')} credit mila → Sirf ₹${subtotal.toLocaleString('en-IN')} pay karo`,
    }
}

export function getOrderAmountPaise(baseAmount: number): number {
    return getPriceBreakdown(baseAmount).totalAmount * 100
}

// ─── SCHOOL VISIT CARD DATA (Public Facing) ───
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
        { feature: 'Starting Price', classPlus: '₹2,499/mo', others: '₹1,499', skolify: '₹299/mo ✅' },
        { feature: 'SMS', classPlus: 'Extra cost', others: 'Extra', skolify: 'Credits included ✅' },
        { feature: 'WhatsApp', classPlus: '❌', others: '❌', skolify: '✅ Credits' },
        { feature: 'Free Trial', classPlus: '7 days', others: '14 days', skolify: '60 days ✅' },
        { feature: 'Pay-as-you-go', classPlus: '❌', others: '❌', skolify: '✅ UNIQUE' },
        { feature: 'Hidden charges', classPlus: 'Yes', others: 'Yes', skolify: 'None ✅' },
    ],
}

// ─── INTERNAL P&L SUMMARY (Never Share) ───
export const INTERNAL_PNL = {
    trialCostPerSchool: TRIAL_CONFIG.internalCost,
    targetConversionRate: 0.25,
    breakEvenSchools: {
        starter: Math.ceil(TRIAL_CONFIG.internalCost / PLANS.starter.internalMargin),
        growth: Math.ceil(TRIAL_CONFIG.internalCost / PLANS.growth.internalMargin),
        pro: Math.ceil(TRIAL_CONFIG.internalCost / PLANS.pro.internalMargin),
    },
    creditPackMargins: {
        small: { revenue: 199, cost: Math.ceil(250 * INTERNAL_COSTS.perCreditCostAvg), margin: 199 - 50 },
        medium: { revenue: 499, cost: Math.ceil(700 * INTERNAL_COSTS.perCreditCostAvg), margin: 499 - 140 },
        large: { revenue: 999, cost: Math.ceil(1500 * INTERNAL_COSTS.perCreditCostAvg), margin: 999 - 300 },
        bulk: { revenue: 1999, cost: Math.ceil(3500 * INTERNAL_COSTS.perCreditCostAvg), margin: 1999 - 700 },
    },
}