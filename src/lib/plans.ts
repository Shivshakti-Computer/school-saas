// =============================================================
// FILE: src/lib/plans.ts — COMPLETE REWRITE
// 4 Plans, 20+ modules, affordable pricing
// GST: future-ready (sirf flag badlo)
// =============================================================

export type PlanId = 'starter' | 'growth' | 'pro' | 'enterprise'
export type BillingCycle = 'monthly' | 'yearly'

// ─── GST CONFIG — jab GST number mile sirf enabled: true karo ───
export const GST_CONFIG = {
    enabled: false,
    rate: 0.18,
    gstin: '',
    legalName: 'Shivshakti Computer Academy',
}

// ─── Razorpay fees (hamesha lagte hain) ───
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
    maxStudents: number    // -1 = unlimited
    maxTeachers: number
    maxSmsPerMonth: number // -1 = unlimited
    features: string[]
    notIncluded?: string[]
    highlighted?: boolean
}

// ─── 4 PLANS ───
export const PLANS: Record<PlanId, Plan> = {

    // ─────────────────────────────────────────
    // STARTER — ₹499/mo
    // Chhoti schools, digital presence shuru
    // ─────────────────────────────────────────
    starter: {
        id: 'starter',
        name: 'Starter',
        tagline: 'Digital school ki shuruat — sirf ₹17/din',
        monthlyPrice: 499,
        yearlyPrice: 4999,     // ₹417/mo — 2 months free
        description: 'Chhoti schools ke liye — website, attendance, SMS sab ek jagah',
        color: '#64748B',
        maxStudents: 200,
        maxTeachers: 10,
        maxSmsPerMonth: 500,
        modules: [
            'students', 'teachers', 'attendance', 'notices',
            'website', 'gallery',
        ],
        features: [
            'Upto 200 students',
            'Professional school website',
            'Student management + ID cards PDF',
            'Daily attendance tracking',
            'Absent SMS to parents (auto)',
            'Notice board with SMS blast',
            'Photo gallery & events',
            'Installable mobile app (PWA)',
            'Student & Parent login portal',
            'Daily data backup',
            '500 SMS/month included',
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
    // Growing schools, complete management
    // ─────────────────────────────────────────
    growth: {
        id: 'growth',
        name: 'Growth',
        tagline: 'Sabse popular — poora school ek app mein',
        monthlyPrice: 999,
        yearlyPrice: 9999,     // ₹833/mo — 2 months free
        description: 'Growing schools ke liye — fees, exams, homework sab automated',
        color: '#4F46E5',
        maxStudents: 500,
        maxTeachers: 30,
        maxSmsPerMonth: 2000,
        highlighted: true,     // "Most Popular" badge
        modules: [
            'students', 'teachers', 'attendance', 'notices',
            'website', 'gallery', 'fees', 'exams', 'timetable',
            'homework', 'documents', 'reports', 'communication',
        ],
        features: [
            'Sab Starter features +',
            'Upto 500 students',
            'Online fee collection (Razorpay)',
            'Automatic fee reminders (SMS)',
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
            '2,000 SMS/month included',
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
    // Established schools, premium features
    // ─────────────────────────────────────────
    pro: {
        id: 'pro',
        name: 'Pro',
        tagline: 'Complete solution — sab kuch included',
        monthlyPrice: 1999,
        yearlyPrice: 19999,    // ₹1,667/mo — 2 months free
        description: 'Bade schools ke liye — library, LMS, certificates, analytics',
        color: '#7C3AED',
        maxStudents: 1500,
        maxTeachers: 75,
        maxSmsPerMonth: 5000,
        modules: [
            'students', 'teachers', 'attendance', 'notices',
            'website', 'gallery', 'fees', 'exams', 'timetable',
            'homework', 'documents', 'reports', 'communication',
            'library', 'certificates', 'lms',
        ],
        features: [
            'Sab Growth features +',
            'Upto 1,500 students',
            'Library book catalogue & issue tracking',
            'Custom certificate generation',
            'Online classes & video lessons (LMS)',
            'Advanced analytics & insights',
            'Excel & PDF data export',
            'Custom school branding (logo, colors)',
            'All website templates + custom design',
            '5,000 SMS/month included',
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
    // Large schools, chains, no limits
    // ─────────────────────────────────────────
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        tagline: 'Zero limits — poora school ecosystem',
        monthlyPrice: 3999,
        yearlyPrice: 39999,    // ₹3,333/mo — 2 months free
        description: 'School chains & bade institutions ke liye — unlimited sab kuch',
        color: '#B45309',
        maxStudents: -1,
        maxTeachers: -1,
        maxSmsPerMonth: -1,
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
            'Unlimited SMS',
            'Multi-branch support',
            'API access for integrations',
            'White-label option (aapka logo)',
            'Dedicated account manager',
            'Custom feature development',
        ],
        // Enterprise mein sab kuch hai — no notIncluded
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

// ─── GST HELPERS (future ready) ───

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