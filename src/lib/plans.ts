// =============================================================
// FILE: src/lib/plans.ts — UPDATED
// Changes:
// 1. Trial: 15 → 60 days
// 2. Trial features: ALL modules combo (maximum features)
// 3. Limits increased significantly
// 4. New helper functions for limit checking
// =============================================================

export type PlanId = 'starter' | 'growth' | 'pro' | 'enterprise'
export type BillingCycle = 'monthly' | 'yearly'

// ─── TRIAL CONFIG ───
export const TRIAL_CONFIG = {
    durationDays: 60,        // 60 days free trial
    plan: 'starter' as PlanId,
    // Trial me SARE modules milenge (sab plans ka combo)
    // Taaki user sab try kare, habit bane, fir subscribe kare
    modules: [
        'students', 'teachers', 'attendance', 'notices',
        'website', 'gallery', 'fees', 'exams', 'timetable',
        'homework', 'documents', 'reports', 'communication',
        'library', 'certificates', 'lms',
        // Enterprise modules bhi trial me (limited)
        'hr', 'transport', 'hostel',
        'inventory', 'visitor', 'health', 'alumni',
    ],
    // Trial limits — generous but capped
    maxStudents: 100,
    maxTeachers: 10,
    maxSmsPerMonth: 200,
}

// ─── GST CONFIG ───
export const GST_CONFIG = {
    enabled: false,
    rate: 0.18,
    gstin: '',
    legalName: 'Shivshakti Computer Academy',
}

// ─── Razorpay fees ───
export const RAZORPAY_CONFIG = {
    feeRate: 0.02,
    gstOnFee: 0.18,
    netDeductionRate: 0.0236,
}

// ─── Plan Interface ───
export interface Plan {
    id: PlanId
    name: string
    tagline: string
    monthlyPrice: number
    yearlyPrice: number
    description: string
    color: string
    modules: string[]
    maxStudents: number     // -1 = unlimited
    maxTeachers: number
    maxClasses: number      // NEW
    maxSmsPerMonth: number  // -1 = unlimited
    maxEmailPerMonth: number // NEW
    maxWhatsappPerMonth: number // NEW
    maxStorageGB: number    // NEW
    features: string[]
    notIncluded?: string[]
    highlighted?: boolean
}

// ─── 4 PLANS (Updated Limits) ───
export const PLANS: Record<PlanId, Plan> = {

    // ─────────────────────────────────────────
    // STARTER — ₹499/mo
    // ─────────────────────────────────────────
    starter: {
        id: 'starter',
        name: 'Starter',
        tagline: 'Digital school ki shuruat — sirf ₹17/din',
        monthlyPrice: 499,
        yearlyPrice: 4999,
        description: 'Chhoti schools ke liye — website, attendance, SMS sab ek jagah',
        color: '#64748B',
        maxStudents: 500,        // 200 → 500
        maxTeachers: 20,         // 10 → 20
        maxClasses: 12,
        maxSmsPerMonth: 2000,    // 500 → 2000
        maxEmailPerMonth: 1000,
        maxWhatsappPerMonth: 500,
        maxStorageGB: 2,
        modules: [
            'students', 'teachers', 'attendance', 'notices',
            'website', 'gallery',
        ],
        features: [
            'Upto 500 students',
            'Upto 20 teachers',
            'Professional school website',
            'Student management + ID cards PDF',
            'Daily attendance tracking',
            'Absent SMS/WhatsApp to parents (auto)',
            'Notice board with SMS blast',
            'Photo gallery & events',
            'Installable mobile app (PWA)',
            'Student & Parent login portal',
            'Daily data backup',
            '2,000 SMS/month included',
            '1,000 Emails/month',
            '500 WhatsApp/month',
            '2 GB storage',
            'Email support',
        ],
        notIncluded: [
            'Online fee collection',
            'Exam & result management',
            'Timetable management',
            'Homework & assignments',
            'Library management',
            'HR & Payroll',
        ],
    },

    // ─────────────────────────────────────────
    // GROWTH — ₹999/mo — MOST POPULAR
    // ─────────────────────────────────────────
    growth: {
        id: 'growth',
        name: 'Growth',
        tagline: 'Sabse popular — poora school ek app mein',
        monthlyPrice: 999,
        yearlyPrice: 9999,
        description: 'Growing schools ke liye — fees, exams, homework sab automated',
        color: '#4F46E5',
        maxStudents: 1500,       // 500 → 1500
        maxTeachers: 50,         // 30 → 50
        maxClasses: 24,
        maxSmsPerMonth: 5000,    // 2000 → 5000
        maxEmailPerMonth: 5000,
        maxWhatsappPerMonth: 2000,
        maxStorageGB: 10,
        highlighted: true,
        modules: [
            'students', 'teachers', 'attendance', 'notices',
            'website', 'gallery', 'fees', 'exams', 'timetable',
            'homework', 'documents', 'reports', 'communication',
        ],
        features: [
            'Sab Starter features +',
            'Upto 1,500 students',
            'Upto 50 teachers',
            'Online fee collection (Razorpay)',
            'Automatic fee reminders (SMS + WhatsApp)',
            'Late fine automation',
            'Fee receipts PDF (auto)',
            'Exam scheduling + marks entry',
            'Grade cards + Report cards PDF',
            'Result SMS to parents',
            'Class timetable management',
            'Homework & assignments',
            'TC, CC, Bonafide generation',
            'Class-wise & subject-wise reports',
            'Parent app (full access)',
            '3 website templates',
            '5,000 SMS/month included',
            '5,000 Emails/month',
            '2,000 WhatsApp/month',
            '10 GB storage',
            'WhatsApp support',
        ],
        notIncluded: [
            'Library management',
            'Certificate generation',
            'Online classes (LMS)',
            'HR & Payroll',
            'Transport tracking',
            'Custom branding',
        ],
    },

    // ─────────────────────────────────────────
    // PRO — ₹1,999/mo
    // ─────────────────────────────────────────
    pro: {
        id: 'pro',
        name: 'Pro',
        tagline: 'Complete solution — sab kuch included',
        monthlyPrice: 1999,
        yearlyPrice: 19999,
        description: 'Bade schools ke liye — library, LMS, certificates, analytics',
        color: '#7C3AED',
        maxStudents: 5000,       // 1500 → 5000
        maxTeachers: 150,        // 75 → 150
        maxClasses: 50,
        maxSmsPerMonth: 15000,   // 5000 → 15000
        maxEmailPerMonth: 15000,
        maxWhatsappPerMonth: 5000,
        maxStorageGB: 50,
        modules: [
            'students', 'teachers', 'attendance', 'notices',
            'website', 'gallery', 'fees', 'exams', 'timetable',
            'homework', 'documents', 'reports', 'communication',
            'library', 'certificates', 'lms',
        ],
        features: [
            'Sab Growth features +',
            'Upto 5,000 students',
            'Upto 150 teachers',
            'Library book catalogue & issue tracking',
            'Custom certificate generation',
            'Online classes & video lessons (LMS)',
            'Advanced analytics & insights',
            'Excel & PDF data export',
            'Custom school branding (logo, colors)',
            'All website templates + custom design',
            '15,000 SMS/month included',
            '15,000 Emails/month',
            '5,000 WhatsApp/month',
            '50 GB storage',
            'Priority bug fixes',
            'Dedicated WhatsApp group',
        ],
        notIncluded: [
            'HR & Payroll',
            'Transport & GPS tracking',
            'Hostel management',
            'Multi-branch support',
        ],
    },

    // ─────────────────────────────────────────
    // ENTERPRISE — ₹3,999/mo
    // ─────────────────────────────────────────
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        tagline: 'Zero limits — poora school ecosystem',
        monthlyPrice: 3999,
        yearlyPrice: 39999,
        description: 'School chains & bade institutions ke liye — unlimited sab kuch',
        color: '#B45309',
        maxStudents: -1,
        maxTeachers: -1,
        maxClasses: -1,
        maxSmsPerMonth: -1,
        maxEmailPerMonth: -1,
        maxWhatsappPerMonth: -1,
        maxStorageGB: -1,
        modules: [
            'students', 'teachers', 'attendance', 'notices',
            'website', 'gallery', 'fees', 'exams', 'timetable',
            'homework', 'documents', 'reports', 'communication',
            'library', 'certificates', 'lms',
            'hr', 'transport', 'hostel',
            'inventory', 'visitor', 'health', 'alumni',
        ],
        features: [
            'Sab Pro features +',
            'Unlimited students & teachers',
            'HR & staff payroll + salary slips',
            'Leave management',
            'Transport & bus tracking (GPS)',
            'Hostel & mess management',
            'School inventory tracking',
            'Visitor management system',
            'Student health records',
            'Alumni network',
            'Unlimited SMS, Email & WhatsApp',
            'Unlimited storage',
            'Multi-branch support',
            'API access for integrations',
            'White-label option (aapka logo)',
            'Dedicated account manager',
            'Custom feature development',
        ],
    },
}

// ─── PRICE HELPERS ───

export function getPlan(planId: PlanId): Plan {
    return PLANS[planId] ?? PLANS.starter
}

export function getPrice(planId: PlanId, cycle: BillingCycle): number {
    const plan = getPlan(planId)
    return cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
}

export function isModuleAllowed(planId: PlanId, moduleKey: string): boolean {
    return getPlan(planId).modules.includes(moduleKey)
}

export function getSavings(planId: PlanId): number {
    const plan = getPlan(planId)
    return (plan.monthlyPrice * 12) - plan.yearlyPrice
}

// ─── LIMIT CHECK HELPERS (NEW) ───

export interface LimitCheck {
    allowed: boolean
    current: number
    limit: number
    remaining: number
    isUnlimited: boolean
    message?: string
}

export function checkStudentLimit(planId: PlanId, currentCount: number): LimitCheck {
    const plan = getPlan(planId)
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
        message: currentCount >= limit
            ? `Student limit reached (${currentCount}/${limit}). Upgrade your plan to add more students.`
            : undefined,
    }
}

export function checkTeacherLimit(planId: PlanId, currentCount: number): LimitCheck {
    const plan = getPlan(planId)
    const limit = plan.maxTeachers

    if (limit === -1) {
        return { allowed: true, current: currentCount, limit: -1, remaining: -1, isUnlimited: true }
    }

    return {
        allowed: currentCount < limit,
        current: currentCount,
        limit,
        remaining: Math.max(0, limit - currentCount),
        isUnlimited: false,
        message: currentCount >= limit
            ? `Teacher limit reached (${currentCount}/${limit}). Upgrade your plan to add more teachers.`
            : undefined,
    }
}

export function checkSmsLimit(planId: PlanId, currentMonthUsage: number): LimitCheck {
    const plan = getPlan(planId)
    const limit = plan.maxSmsPerMonth

    if (limit === -1) {
        return { allowed: true, current: currentMonthUsage, limit: -1, remaining: -1, isUnlimited: true }
    }

    return {
        allowed: currentMonthUsage < limit,
        current: currentMonthUsage,
        limit,
        remaining: Math.max(0, limit - currentMonthUsage),
        isUnlimited: false,
        message: currentMonthUsage >= limit
            ? `SMS limit reached (${currentMonthUsage}/${limit}). Upgrade for more SMS.`
            : undefined,
    }
}

export function checkEmailLimit(planId: PlanId, currentMonthUsage: number): LimitCheck {
    const plan = getPlan(planId)
    const limit = plan.maxEmailPerMonth

    if (limit === -1) {
        return { allowed: true, current: currentMonthUsage, limit: -1, remaining: -1, isUnlimited: true }
    }

    return {
        allowed: currentMonthUsage < limit,
        current: currentMonthUsage,
        limit,
        remaining: Math.max(0, limit - currentMonthUsage),
        isUnlimited: false,
    }
}

export function checkWhatsappLimit(planId: PlanId, currentMonthUsage: number): LimitCheck {
    const plan = getPlan(planId)
    const limit = plan.maxWhatsappPerMonth

    if (limit === -1) {
        return { allowed: true, current: currentMonthUsage, limit: -1, remaining: -1, isUnlimited: true }
    }

    return {
        allowed: currentMonthUsage < limit,
        current: currentMonthUsage,
        limit,
        remaining: Math.max(0, limit - currentMonthUsage),
        isUnlimited: false,
    }
}

// ─── TRIAL HELPERS (NEW) ───

export function getTrialModules(): string[] {
    return TRIAL_CONFIG.modules
}

export function getTrialDurationDays(): number {
    return TRIAL_CONFIG.durationDays
}

export function isTrialExpired(trialEndsAt: Date | string): boolean {
    return new Date(trialEndsAt) < new Date()
}

export function getTrialDaysRemaining(trialEndsAt: Date | string): number {
    const diff = new Date(trialEndsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// ─── GST HELPERS ───

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

export function getPlanPriceBreakdown(planId: PlanId, cycle: BillingCycle): PriceBreakdown {
    return getPriceBreakdown(getPrice(planId, cycle))
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

export function getRazorpayBreakdown(totalPaid: number): RazorpayBreakdown {
    const razorpayFee = Math.round(totalPaid * RAZORPAY_CONFIG.feeRate)
    const razorpayGST = Math.round(razorpayFee * RAZORPAY_CONFIG.gstOnFee)
    const totalDeduction = razorpayFee + razorpayGST
    const netToAccount = totalPaid - totalDeduction
    let gstToGovt = 0
    if (GST_CONFIG.enabled) {
        gstToGovt = Math.round(totalPaid * GST_CONFIG.rate / (1 + GST_CONFIG.rate))
    }
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

// ─── UPGRADE / PRORATION HELPERS ───

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
        explanation: `${daysRemaining} din bache hain → ₹${creditAmount.toLocaleString('en-IN')} credit mila → Sirf ₹${subtotal.toLocaleString('en-IN')} pay karo${GST_CONFIG.enabled ? ` + ₹${gstAmount.toLocaleString('en-IN')} GST` : ''}`,
    }
}

export function getOrderAmountPaise(baseAmount: number): number {
    const { totalAmount } = getPriceBreakdown(baseAmount)
    return totalAmount * 100
}

// ─── DEMO ACCOUNT CONFIG (NEW) ───
export const DEMO_CONFIG = {
    schoolCode: 'demo_school',
    schoolName: 'Demo School - Skolify',
    adminPhone: '9999999999',
    adminPassword: 'Demo@123',
    adminName: 'Demo Admin',
    plan: 'enterprise' as PlanId,
    // Demo account never expires
    trialDays: 36500, // ~100 years
    modules: Object.keys(PLANS.enterprise.modules) as string[],
    isDemo: true,
}