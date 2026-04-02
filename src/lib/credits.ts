// FILE: src/lib/credits.ts
// COMPLETE FILE — All fixes applied
// ═══════════════════════════════════════════════════════════

import { connectDB } from './db'
import { MessageCredit } from '@/models/MessageCredit'
import { CreditTransaction } from '@/models/CreditTransaction'
import { School } from '@/models/School'
import { Types } from 'mongoose'
import {
    PLANS,
    TRIAL_CONFIG,
    CREDIT_COSTS,
    CREDIT_PACKS,
    ADDON_PRICING,
    calculateCreditCost,
    type PlanId,
    type CreditType,
    type CreditPackId,
    type ExtraStudentPackId,
    type ExtraTeacherPackId,
} from '@/config/pricing'

// ── Import type separately from model ──
import type { ICreditTransaction } from '@/models/CreditTransaction'

// ─── Transaction type alias (from interface, not model) ───
type TransactionType = ICreditTransaction['type']

// ══════════════════════════════════════════════════════════
// GET OR CREATE CREDIT RECORD
// ══════════════════════════════════════════════════════════

export async function getOrCreateCredit(tenantId: string) {
    let credit = await MessageCredit.findOne({ tenantId })

    if (!credit) {
        const school = await School.findById(tenantId)
            .select('plan addonLimits')
            .lean() as any

        const plan = PLANS[school?.plan as PlanId] ?? PLANS.starter

        credit = await MessageCredit.create({
            tenantId,
            balance: 0,
            totalEarned: 0,
            totalUsed: 0,
            totalExpired: 0,
            extraStudents: school?.addonLimits?.extraStudents ?? 0,
            extraTeachers: school?.addonLimits?.extraTeachers ?? 0,
            effectiveMaxStudents:
                plan.maxStudents === -1
                    ? -1
                    : plan.maxStudents + (school?.addonLimits?.extraStudents ?? 0),
            effectiveMaxTeachers:
                plan.maxTeachers === -1
                    ? -1
                    : plan.maxTeachers + (school?.addonLimits?.extraTeachers ?? 0),
        })
    }

    return credit
}

// ══════════════════════════════════════════════════════════
// GET BALANCE
// ══════════════════════════════════════════════════════════

export async function getCreditBalance(tenantId: string): Promise<number> {
    await connectDB()
    const credit = await MessageCredit.findOne({ tenantId })
        .select('balance')
        .lean() as any
    return credit?.balance ?? 0
}

// ══════════════════════════════════════════════════════════
// CHECK CREDITS
// ══════════════════════════════════════════════════════════

export interface CreditCheckResult {
    canSend: boolean
    balance: number
    required: number
    remaining: number
    lowCreditWarning: boolean
    message?: string
}

export async function checkCredits(
    tenantId: string,
    type: CreditType,
    count: number = 1
): Promise<CreditCheckResult> {
    await connectDB()

    const credit = await getOrCreateCredit(tenantId)
    const required = calculateCreditCost(type, count)
    const balance = credit.balance
    const canSend = balance >= required

    return {
        canSend,
        balance,
        required,
        remaining: Math.max(0, balance - required),
        lowCreditWarning: balance < 100,
        message: !canSend
            ? `Insufficient credits. Required: ${required}, Available: ${balance}. Please purchase a credit pack.`
            : undefined,
    }
}

// ══════════════════════════════════════════════════════════
// DEDUCT CREDITS (Atomic)
// ══════════════════════════════════════════════════════════

export interface DeductResult {
    success: boolean
    creditsDeducted: number
    newBalance: number
    error?: string
}

export async function deductCredits(
    tenantId: string,
    type: CreditType,
    count: number,
    purpose: string,
    messageLogId?: string
): Promise<DeductResult> {
    await connectDB()

    const required = calculateCreditCost(type, count)

    // Atomic update — only deduct if balance is sufficient
    const credit = await MessageCredit.findOneAndUpdate(
        {
            tenantId,
            balance: { $gte: required },
        },
        {
            $inc: {
                balance: -required,
                totalUsed: required,
            },
        },
        { new: true }
    )

    if (!credit) {
        const current = await getCreditBalance(tenantId)
        return {
            success: false,
            creditsDeducted: 0,
            newBalance: current,
            error: `Insufficient credits. Required: ${required}, Available: ${current}`,
        }
    }

    // Log transaction
    await CreditTransaction.create({
        tenantId,
        type: 'message_deduct' as TransactionType,
        amount: -required,
        balanceBefore: credit.balance + required,
        balanceAfter: credit.balance,
        description: `${count} ${type} message(s) sent — ${purpose}`,
        messageLogId,
        channel: type,
        purpose,
    })

    // Sync quick-access balance on School doc
    await School.findByIdAndUpdate(tenantId, {
        creditBalance: credit.balance,
    })

    return {
        success: true,
        creditsDeducted: required,
        newBalance: credit.balance,
    }
}

// ══════════════════════════════════════════════════════════
// ADD CREDITS
// ══════════════════════════════════════════════════════════

export async function addCredits(
    tenantId: string,
    amount: number,
    type: TransactionType,
    description: string,
    meta?: {
        packId?: string
        orderId?: string
        razorpayPaymentId?: string
        amountPaid?: number
        adjustedBy?: string
    }
): Promise<{ newBalance: number }> {
    await connectDB()

    const credit = await MessageCredit.findOneAndUpdate(
        { tenantId },
        {
            $inc: {
                balance: amount,
                totalEarned: amount,
            },
        },
        { new: true, upsert: true }
    )

    await CreditTransaction.create({
        tenantId,
        type,
        amount,
        balanceBefore: credit.balance - amount,
        balanceAfter: credit.balance,
        description,
        packId: meta?.packId,
        orderId: meta?.orderId,
        razorpayPaymentId: meta?.razorpayPaymentId,
        amountPaid: meta?.amountPaid,
        adjustedBy: meta?.adjustedBy,
    })

    await School.findByIdAndUpdate(tenantId, {
        creditBalance: credit.balance,
    })

    return { newBalance: credit.balance }
}

// ══════════════════════════════════════════════════════════
// MONTHLY CREDIT GRANT (Called by cron — 1st of every month)
// ══════════════════════════════════════════════════════════

export async function grantMonthlyCredits(
    tenantId: string,
    planId: PlanId,
    isTrial: boolean = false
): Promise<{ granted: number; rolledOver: number; expired: number }> {
    await connectDB()

    const plan = PLANS[planId]
    const creditsToGrant = isTrial
        ? TRIAL_CONFIG.freeCredits
        : plan.freeCreditsPerMonth

    const month = new Date().toISOString().slice(0, 7) // "2025-01"
    const credit = await getOrCreateCredit(tenantId)

    // Already granted this month — skip
    const alreadyGranted = credit.monthlyCredits.some(
        (m: any) => m.month === month
    )
    if (alreadyGranted) {
        return { granted: 0, rolledOver: 0, expired: 0 }
    }

    const rolloverMonths = plan.creditRolloverMonths
    let currentBalance = credit.balance
    let rolledOver = 0
    let expired = 0

    // ── Handle rollover vs expiry ──
    if (rolloverMonths === 0 && currentBalance > 0) {
        // Starter — no rollover, expire unused credits
        expired = currentBalance

        await CreditTransaction.create({
            tenantId,
            type: 'expired' as TransactionType,
            amount: -currentBalance,
            balanceBefore: currentBalance,
            balanceAfter: 0,
            description: `Monthly credits expired — ${plan.name} plan (no rollover)`,
        })

        await MessageCredit.findOneAndUpdate(
            { tenantId },
            {
                $set: { balance: 0 },
                $inc: { totalExpired: expired },
            }
        )

        currentBalance = 0

    } else if (rolloverMonths > 0 || rolloverMonths === -1) {
        // Growth/Pro/Enterprise — carry forward
        rolledOver = currentBalance
    }

    // ── Grant new monthly credits ──
    const newBalance = currentBalance + creditsToGrant

    await MessageCredit.findOneAndUpdate(
        { tenantId },
        {
            $set: { balance: newBalance },
            $inc: { totalEarned: creditsToGrant },
            $push: {
                monthlyCredits: {
                    month,
                    plan: planId,
                    creditsGiven: creditsToGrant,
                    creditsFromPrev: rolledOver,
                    creditsExpiredAt:
                        rolloverMonths === 0
                            ? new Date(
                                new Date().setMonth(new Date().getMonth() + 1)
                            )
                            : undefined,
                },
            },
        }
    )

    await CreditTransaction.create({
        tenantId,
        type: 'monthly_grant' as TransactionType,
        amount: creditsToGrant,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Monthly ${creditsToGrant} credits granted — ${plan.name} plan`,
    })

    await School.findByIdAndUpdate(tenantId, {
        creditBalance: newBalance,
    })

    return { granted: creditsToGrant, rolledOver, expired }
}

// ══════════════════════════════════════════════════════════
// GRANT TRIAL CREDITS (One-time on school registration)
// ══════════════════════════════════════════════════════════

export async function grantTrialCredits(tenantId: string): Promise<void> {
    await connectDB()

    const month = new Date().toISOString().slice(0, 7)

    await MessageCredit.findOneAndUpdate(
        { tenantId },
        {
            $set: { balance: TRIAL_CONFIG.freeCredits },
            $inc: { totalEarned: TRIAL_CONFIG.freeCredits },
            $push: {
                monthlyCredits: {
                    month,
                    plan: 'trial',
                    creditsGiven: TRIAL_CONFIG.freeCredits,
                    creditsFromPrev: 0,
                },
            },
        },
        { upsert: true, new: true }
    )

    await CreditTransaction.create({
        tenantId,
        type: 'trial_grant' as TransactionType,
        amount: TRIAL_CONFIG.freeCredits,
        balanceBefore: 0,
        balanceAfter: TRIAL_CONFIG.freeCredits,
        description: `60-day trial — ${TRIAL_CONFIG.freeCredits} free credits granted`,
    })

    await School.findByIdAndUpdate(tenantId, {
        creditBalance: TRIAL_CONFIG.freeCredits,
    })
}

// ══════════════════════════════════════════════════════════
// PURCHASE CREDIT PACK
// ══════════════════════════════════════════════════════════

export interface PackPurchaseResult {
    success: boolean
    creditsAdded: number
    newBalance: number
    error?: string
}

export async function purchaseCreditPack(
    tenantId: string,
    packId: CreditPackId,
    orderId: string,
    razorpayPaymentId: string
): Promise<PackPurchaseResult> {
    await connectDB()

    const pack = CREDIT_PACKS.find(p => p.id === packId)
    if (!pack) {
        return {
            success: false,
            creditsAdded: 0,
            newBalance: 0,
            error: 'Invalid pack ID',
        }
    }

    const { newBalance } = await addCredits(
        tenantId,
        pack.credits,
        'pack_purchase',
        `Purchased ${pack.name} — ${pack.credits} credits`,
        {
            packId,
            orderId,
            razorpayPaymentId,
            amountPaid: pack.price,
        }
    )

    return {
        success: true,
        creditsAdded: pack.credits,
        newBalance,
    }
}

// ══════════════════════════════════════════════════════════
// PURCHASE EXTRA STUDENTS ADD-ON
// ══════════════════════════════════════════════════════════

export async function purchaseExtraStudents(
    tenantId: string,
    packId: ExtraStudentPackId,
    orderId: string,
    razorpayPaymentId: string
): Promise<{
    success: boolean
    extraStudents: number
    newLimit: number
    error?: string
}> {
    await connectDB()

    const pack = ADDON_PRICING.extraStudents[packId]
    if (!pack) {
        return {
            success: false,
            extraStudents: 0,
            newLimit: 0,
            error: 'Invalid student pack ID',
        }
    }

    const school = await School.findById(tenantId)
        .select('plan addonLimits')
        .lean() as any

    if (!school) {
        return {
            success: false,
            extraStudents: 0,
            newLimit: 0,
            error: 'School not found',
        }
    }

    const planConfig = PLANS[school.plan as PlanId]
    const currentExtra = school.addonLimits?.extraStudents ?? 0
    const newExtra = currentExtra + pack.students

    // Update School addonLimits
    await School.findByIdAndUpdate(tenantId, {
        $inc: { 'addonLimits.extraStudents': pack.students },
    })

    // Update MessageCredit
    const credit = await MessageCredit.findOneAndUpdate(
        { tenantId },
        {
            $inc: { extraStudents: pack.students },
            $push: {
                extraStudentPacks: {
                    packId,
                    students: pack.students,
                    price: pack.price,
                    purchasedAt: new Date(),
                    orderId,
                },
            },
        },
        { new: true, upsert: true }
    )

    const newLimit =
        planConfig.maxStudents === -1 ? -1 : planConfig.maxStudents + newExtra

    // Update effectiveMaxStudents
    await MessageCredit.findOneAndUpdate(
        { tenantId },
        { $set: { effectiveMaxStudents: newLimit } }
    )

    // Audit log via CreditTransaction
    await CreditTransaction.create({
        tenantId,
        type: 'addon_purchase' as TransactionType,
        amount: 0,
        balanceBefore: credit?.balance ?? 0,
        balanceAfter: credit?.balance ?? 0,
        description: `Extra ${pack.students} students purchased — ₹${pack.price}`,
        packId,
        orderId,
        razorpayPaymentId,
        amountPaid: pack.price,
    })

    return {
        success: true,
        extraStudents: pack.students,
        newLimit,
    }
}

// ══════════════════════════════════════════════════════════
// PURCHASE EXTRA TEACHERS ADD-ON
// ══════════════════════════════════════════════════════════

export async function purchaseExtraTeachers(
    tenantId: string,
    packId: ExtraTeacherPackId,
    orderId: string,
    razorpayPaymentId: string
): Promise<{
    success: boolean
    extraTeachers: number
    newLimit: number
    error?: string
}> {
    await connectDB()

    const pack = ADDON_PRICING.extraTeachers[packId]
    if (!pack) {
        return {
            success: false,
            extraTeachers: 0,
            newLimit: 0,
            error: 'Invalid teacher pack ID',
        }
    }

    const school = await School.findById(tenantId)
        .select('plan addonLimits')
        .lean() as any

    if (!school) {
        return {
            success: false,
            extraTeachers: 0,
            newLimit: 0,
            error: 'School not found',
        }
    }

    const planConfig = PLANS[school.plan as PlanId]
    const currentExtra = school.addonLimits?.extraTeachers ?? 0
    const newExtra = currentExtra + pack.teachers

    // Update School
    await School.findByIdAndUpdate(tenantId, {
        $inc: { 'addonLimits.extraTeachers': pack.teachers },
    })

    // Update MessageCredit
    const credit = await MessageCredit.findOneAndUpdate(
        { tenantId },
        {
            $inc: { extraTeachers: pack.teachers },
            $push: {
                extraTeacherPacks: {
                    packId,
                    teachers: pack.teachers,
                    price: pack.price,
                    purchasedAt: new Date(),
                    orderId,
                },
            },
        },
        { new: true, upsert: true }
    )

    const newLimit =
        planConfig.maxTeachers === -1 ? -1 : planConfig.maxTeachers + newExtra

    // Update effectiveMaxTeachers
    await MessageCredit.findOneAndUpdate(
        { tenantId },
        { $set: { effectiveMaxTeachers: newLimit } }
    )

    // Audit via CreditTransaction
    await CreditTransaction.create({
        tenantId,
        type: 'addon_purchase' as TransactionType,
        amount: 0,
        balanceBefore: credit?.balance ?? 0,
        balanceAfter: credit?.balance ?? 0,
        description: `Extra ${pack.teachers} teachers purchased — ₹${pack.price}`,
        packId,
        orderId,
        razorpayPaymentId,
        amountPaid: pack.price,
    })

    return {
        success: true,
        extraTeachers: pack.teachers,
        newLimit,
    }
}

// ══════════════════════════════════════════════════════════
// GET CREDIT STATS
// ══════════════════════════════════════════════════════════

export async function getCreditStats(tenantId: string) {
    await connectDB()

    const credit = await getOrCreateCredit(tenantId)
    const school = await School.findById(tenantId)
        .select('plan addonLimits')
        .lean() as any

    const planConfig = PLANS[(school?.plan as PlanId) ?? 'starter']

    const last30Days = await CreditTransaction.aggregate([
        {
            $match: {
                tenantId: new Types.ObjectId(tenantId),
                type: 'message_deduct',
                createdAt: {
                    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
            },
        },
        {
            $group: {
                _id: '$channel',
                totalCredits: { $sum: { $abs: '$amount' } },
                count: { $sum: 1 },
            },
        },
    ])

    return {
        balance: credit.balance,
        totalEarned: credit.totalEarned,
        totalUsed: credit.totalUsed,
        totalExpired: credit.totalExpired,
        extraStudents: credit.extraStudents,
        extraTeachers: credit.extraTeachers,
        effectiveMaxStudents: credit.effectiveMaxStudents,
        effectiveMaxTeachers: credit.effectiveMaxTeachers,
        freeCreditsPerMonth: planConfig.freeCreditsPerMonth,
        rolloverMonths: planConfig.creditRolloverMonths,
        lowCreditWarning: credit.balance < 100,
        last30DaysUsage: last30Days,
    }
}