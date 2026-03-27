// =============================================================
// FILE: src/lib/plans.ts — COMPLETE, FUTURE-READY
// Abhi: GST nahi (prices all-inclusive)
// Future: Sirf ek flag badlo → GST system active
// =============================================================

export type PlanId = 'starter' | 'pro' | 'enterprise'
export type BillingCycle = 'monthly' | 'yearly'

// ─────────────────────────────────────────────────────────────
// GST CONFIG — jab GST registration ho jaaye
// sirf yeh ek flag true karo, baki sab automatic
// ─────────────────────────────────────────────────────────────
export const GST_CONFIG = {
    enabled: false,          // ← TRUE karo jab GST number mile
    rate: 0.18,           // 18% GST
    gstin: '',             // ← Apna GSTIN yahan daalo
    legalName: 'Shivshakti Computer Academy',
}

// Razorpay fees — yeh hamesha lagte hain (GST ho ya na ho)
export const RAZORPAY_CONFIG = {
    feeRate: 0.02,   // 2% per transaction
    gstOnFee: 0.18,   // 18% GST on Razorpay fee (Razorpay ka GST, tumhara nahi)
    // Net deduction per transaction = amount × 2% × 1.18 = 2.36%
    netDeductionRate: 0.0236,
}

// ─────────────────────────────────────────────────────────────
// PLAN INTERFACE
// ─────────────────────────────────────────────────────────────
export interface Plan {
    id: PlanId
    name: string
    tagline: string
    monthlyPrice: number   // All-inclusive price (jo school pay karega)
    yearlyPrice: number
    description: string
    color: string
    modules: string[]
    maxStudents: number   // -1 = unlimited
    maxTeachers: number
    features: string[]
    notIncluded?: string[]
    highlighted?: boolean
}

// ─────────────────────────────────────────────────────────────
// PLANS — monthlyPrice = final amount school pays
// Abhi GST inclusive nahi hai kyunki GST nahi hai
// Jab GST enable hoga: price = base, GST alag add hoga
// ─────────────────────────────────────────────────────────────
export const PLANS: Record<PlanId, Plan> = {
    starter: {
        id: 'starter',
        name: 'Starter',
        tagline: 'Shuruat karne ke liye',
        monthlyPrice: 999,
        yearlyPrice: 8990,   // ~₹749/mo — 2 months free
        description: 'Chhoti schools ke liye — digital presence + basic management',
        color: '#64748B',
        maxStudents: 300,
        maxTeachers: 15,
        modules: ['students', 'attendance', 'notices', 'teachers', 'website'],
        features: [
            'Upto 300 students',
            'Student management + ID Cards',
            'Daily attendance + Absent SMS to parents',
            'Notice board (SMS blast)',
            'Professional school website (3 templates)',
            'PWA — installable mobile app',
            'Teacher portal',
            'Admission management',
            'Email support',
            'Daily data backups',
        ],
        notIncluded: [
            'Online fee collection',
            'Exam & result management',
            'Grade cards PDF',
            'Library management',
            'HR & Payroll',
        ],
    },

    pro: {
        id: 'pro',
        name: 'Pro',
        tagline: 'Sabse popular — complete school management',
        monthlyPrice: 2499,
        yearlyPrice: 22490,  // ~₹1874/mo
        description: 'Growing schools ke liye — sab kuch ek jagah',
        color: '#4F46E5',
        maxStudents: 1000,
        maxTeachers: 50,
        highlighted: true,
        modules: ['students', 'attendance', 'notices', 'teachers', 'website', 'fees', 'exams'],
        features: [
            'Sab Starter features +',
            'Upto 1000 students',
            'Online fee collection (Razorpay)',
            'Automatic fee reminders (SMS)',
            'Late fine automation',
            'Fee receipts PDF (auto-generated)',
            'Exam scheduling + marks entry',
            'Grade cards + Report cards PDF',
            'Result SMS to parents',
            'Class-wise + subject-wise reports',
            'Parent app (attendance, fees, results)',
            'Priority support (WhatsApp)',
        ],
        notIncluded: [
            'Library management',
            'HR & Payroll',
            'Transport tracking',
            'Custom branding',
        ],
    },

    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        tagline: 'Badi schools ke liye — unlimited sab kuch',
        monthlyPrice: 4999,
        yearlyPrice: 44990,  // ~₹3749/mo
        description: 'Large schools aur chains ke liye — no limits',
        color: '#7C3AED',
        maxStudents: -1,
        maxTeachers: -1,
        modules: [
            'students', 'attendance', 'notices', 'teachers', 'website',
            'fees', 'exams', 'library', 'hr', 'transport',
        ],
        features: [
            'Sab Pro features +',
            'Unlimited students & teachers',
            'Library management system',
            'HR & Staff payroll',
            'Salary slips PDF',
            'Leave management',
            'Transport & bus tracking',
            'Custom school branding',
            'White-label option (aapka logo)',
            'Dedicated WhatsApp support',
            'Priority bug fixes',
            'Data export (Excel, PDF)',
            'API access',
            'Multi-branch support (coming soon)',
        ],
    },
}

// ─────────────────────────────────────────────────────────────
// PRICE HELPERS
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// GST HELPERS — future ready
// Abhi GST_CONFIG.enabled = false → sab functions
// GST-free amounts return karti hain
// ─────────────────────────────────────────────────────────────

export interface PriceBreakdown {
    baseAmount: number   // Price before GST
    gstAmount: number   // GST amount (0 if not enabled)
    totalAmount: number   // What school pays
    gstEnabled: boolean  // For UI conditional rendering
    gstRate: number   // 0 or 0.18
}

/**
 * Kisi bhi amount ka price breakdown nikalo
 * GST enabled hone pe automatically calculate hoga
 */
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

    // GST enabled: amount is base, GST add karo
    const gstAmount = Math.round(amount * GST_CONFIG.rate)
    return {
        baseAmount: amount,
        gstAmount,
        totalAmount: amount + gstAmount,
        gstEnabled: true,
        gstRate: GST_CONFIG.rate,
    }
}

/**
 * Plan ki price breakdown (subscription page ke liye)
 */
export function getPlanPriceBreakdown(planId: PlanId, cycle: BillingCycle): PriceBreakdown {
    const base = getPrice(planId, cycle)
    return getPriceBreakdown(base)
}

/**
 * Razorpay deduction calculate karo — tumhara net income
 * Yeh GST se alag hai — Razorpay hamesha apna fee leta hai
 *
 * Example (₹999 plan, GST off):
 *   School pays:        ₹999
 *   Razorpay fee (2%):  ₹19.98
 *   GST on fee (18%):   ₹3.60
 *   Net to you:         ₹975.42
 *
 * Example (₹999 plan, GST on):
 *   Base:               ₹999
 *   GST (18%):          ₹180
 *   School pays:        ₹1,179
 *   Razorpay fee (2%):  ₹23.58
 *   GST on fee (18%):   ₹4.24
 *   Net to you:         ₹1,151.18  (GST ₹180 govt ko dena hoga)
 *   Effective net:      ₹971.18
 */
export interface RazorpayBreakdown {
    schoolPays: number   // Total amount school ne diya
    razorpayFee: number   // 2% fee
    razorpayGST: number   // 18% on Razorpay fee
    totalDeduction: number   // razorpayFee + razorpayGST
    netToAccount: number   // schoolPays - totalDeduction
    gstToGovt: number   // Agar GST enabled: yeh govt ko dena hoga
    effectiveIncome: number   // netToAccount - gstToGovt (actual tumhara)
}

export function getRazorpayBreakdown(totalPaid: number): RazorpayBreakdown {
    const razorpayFee = Math.round(totalPaid * RAZORPAY_CONFIG.feeRate)
    const razorpayGST = Math.round(razorpayFee * RAZORPAY_CONFIG.gstOnFee)
    const totalDeduction = razorpayFee + razorpayGST
    const netToAccount = totalPaid - totalDeduction

    // Agar GST enabled hai: reverse calculate karo kitna GST tha
    let gstToGovt = 0
    if (GST_CONFIG.enabled) {
        // GST inclusive amount se base nikalo
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

// ─────────────────────────────────────────────────────────────
// UPGRADE / PRORATION HELPERS
// ─────────────────────────────────────────────────────────────

export interface UpgradeBreakdown {
    newPlanPrice: number
    creditAmount: number   // Unused days credit
    subtotal: number   // newPlanPrice - creditAmount
    gstAmount: number   // 0 if GST not enabled
    totalPayable: number   // What school pays for upgrade
    daysRemaining: number
    dailyRate: number
    explanation: string
}

export function calculateUpgradeAmount(
    currentPlan: PlanId,
    newPlan: PlanId,
    billingCycle: BillingCycle,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
): UpgradeBreakdown {
    const now = new Date()
    const totalMs = currentPeriodEnd.getTime() - currentPeriodStart.getTime()
    const remainingMs = Math.max(0, currentPeriodEnd.getTime() - now.getTime())
    const totalDays = Math.ceil(totalMs / 86400000)
    const daysRemaining = Math.ceil(remainingMs / 86400000)

    const currentPrice = getPrice(currentPlan, billingCycle)
    const newPrice = getPrice(newPlan, billingCycle)

    const dailyRate = currentPrice / totalDays
    const creditAmount = Math.round(dailyRate * daysRemaining)
    const subtotal = Math.max(0, newPrice - creditAmount)

    // GST on subtotal (0 if not enabled)
    const { gstAmount, totalAmount } = GST_CONFIG.enabled
        ? { gstAmount: Math.round(subtotal * GST_CONFIG.rate), totalAmount: subtotal + Math.round(subtotal * GST_CONFIG.rate) }
        : { gstAmount: 0, totalAmount: subtotal }

    return {
        newPlanPrice: newPrice,
        creditAmount,
        subtotal,
        gstAmount,
        totalPayable: totalAmount,
        daysRemaining,
        dailyRate: Math.round(dailyRate),
        explanation: `${daysRemaining} din bache hain → ₹${creditAmount} credit mila → Sirf ₹${subtotal} pay karo${GST_CONFIG.enabled ? ` + ₹${gstAmount} GST` : ''}`,
    }
}

// ─────────────────────────────────────────────────────────────
// RAZORPAY ORDER AMOUNT
// Always in paise (×100), includes GST if enabled
// ─────────────────────────────────────────────────────────────
export function getOrderAmountPaise(baseAmount: number): number {
    const { totalAmount } = getPriceBreakdown(baseAmount)
    return totalAmount * 100  // Razorpay needs paise
}