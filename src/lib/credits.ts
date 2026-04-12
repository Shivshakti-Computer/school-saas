// FILE: src/lib/credits.ts
// FIXED: grantUpgradeCredits correct math + rollover properly implemented
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
import type { ICreditTransaction } from '@/models/CreditTransaction'

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

    // ✅ FIX: Math.ceil hatao — exact cost use karo
    // calculateCreditCost already round karta hai
    const required = calculateCreditCost(type, count)
    const requiredRounded = Math.round(required * 100) / 100

    // Baaki code same...
    const credit = await MessageCredit.findOneAndUpdate(
        { tenantId, balance: { $gte: requiredRounded } },
        {
            $inc: {
                balance: -requiredRounded,
                totalUsed: requiredRounded,
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
            error: `Insufficient credits. Required: ${requiredRounded}, Available: ${current}`,
        }
    }

    const balanceRounded = Math.round(credit.balance * 100) / 100

    await CreditTransaction.create({
        tenantId,
        type: 'message_deduct' as TransactionType,
        amount: -requiredRounded,
        balanceBefore: Math.round((credit.balance + requiredRounded) * 100) / 100,
        balanceAfter: balanceRounded,
        description: `${count} ${type} message(s) sent — ${purpose}`,
        messageLogId,
        channel: type,
        purpose,
    })

    await School.findByIdAndUpdate(tenantId, {
        creditBalance: balanceRounded,
    })

    return {
        success: true,
        creditsDeducted: requiredRounded,
        newBalance: balanceRounded,
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
        { $inc: { balance: amount, totalEarned: amount } },
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

    await School.findByIdAndUpdate(tenantId, { creditBalance: credit.balance })

    return { newBalance: credit.balance }
}

// ══════════════════════════════════════════════════════════
// MONTHLY CREDIT GRANT
// Cron pe call hoga — 1st of every month
//
// Rollover rules:
//   starter:    rolloverMonths = 0  → expire all unused, grant fresh
//   growth:     rolloverMonths = 3  → carry forward upto 3 months old
//   pro:        rolloverMonths = 6  → carry forward upto 6 months old
//   enterprise: rolloverMonths = -1 → never expire, always carry forward
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

    const month = new Date().toISOString().slice(0, 7)
    const credit = await getOrCreateCredit(tenantId)

    // Already granted this month — skip
    const alreadyGranted = (credit.monthlyCredits ?? []).some(
        (m: any) => m.month === month
    )
    if (alreadyGranted) {
        return { granted: 0, rolledOver: 0, expired: 0 }
    }

    const rolloverMonths = plan.creditRolloverMonths
    let currentBalance = credit.balance
    let rolledOver = 0
    let expired = 0

    if (rolloverMonths === 0) {
        // ── Starter: No rollover — expire all unused ──
        if (currentBalance > 0) {
            expired = currentBalance

            await CreditTransaction.create({
                tenantId,
                type: 'expired' as TransactionType,
                amount: -expired,
                balanceBefore: currentBalance,
                balanceAfter: 0,
                description: `Credits expired — ${plan.name} plan (no rollover)`,
            })

            await MessageCredit.findOneAndUpdate(
                { tenantId },
                {
                    $set: { balance: 0 },
                    $inc: { totalExpired: expired },
                }
            )

            currentBalance = 0
        }

    } else if (rolloverMonths === -1) {
        // ── Enterprise: Never expire — full carry forward ──
        rolledOver = currentBalance

    } else {
        // ── Growth (3mo) / Pro (6mo): Cap-based rollover ──
        const maxCarryForward = rolloverMonths * plan.freeCreditsPerMonth

        if (currentBalance > maxCarryForward) {
            // Balance cap se zyada hai — excess expire karo
            expired = currentBalance - maxCarryForward
            currentBalance = maxCarryForward

            await CreditTransaction.create({
                tenantId,
                type: 'expired' as TransactionType,
                amount: -expired,
                balanceBefore: currentBalance + expired,
                balanceAfter: currentBalance,
                description:
                    `${expired} credits expired — ${plan.name} rollover cap ` +
                    `(max carry = ${rolloverMonths}mo × ${plan.freeCreditsPerMonth} = ${maxCarryForward})`,
            })

            await MessageCredit.findOneAndUpdate(
                { tenantId },
                {
                    $set: { balance: currentBalance },
                    $inc: { totalExpired: expired },
                }
            )
        }

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
                    expired: false,
                    ...(rolloverMonths === 0 ? {
                        creditsExpiredAt: new Date(
                            new Date().getFullYear(),
                            new Date().getMonth() + 1,
                            1
                        ),
                    } : {}),
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
        description: rolloverMonths === 0
            ? `${creditsToGrant} credits granted — ${plan.name} (prev ${expired} expired, no rollover)`
            : rolloverMonths === -1
                ? `${creditsToGrant} credits granted — ${plan.name} + ${rolledOver} carried (never expire)`
                : `${creditsToGrant} credits granted — ${plan.name} + ${rolledOver} carried ` +
                `(cap: ${rolloverMonths}mo × ${plan.freeCreditsPerMonth} = ${rolloverMonths * plan.freeCreditsPerMonth})`,
    })

    await School.findByIdAndUpdate(tenantId, { creditBalance: newBalance })

    return { granted: creditsToGrant, rolledOver, expired }
}

// ══════════════════════════════════════════════════════════
// GRANT UPGRADE CREDITS
//
// FIXED LOGIC:
//   currentBalance (existing sab kuch) + newPlanCredits = newBalance
//
//   Example:
//   Starter 500 + addon 250 = 750 balance
//   Growth upgrade → 750 + 1500 = 2250 ✅
//
//   Upgrade pe KUCH EXPIRE NAHI HOGA
//   Chahe old plan Starter (rollover=0) tha
//   Upgrade = reward, punish nahi
//
// NOTE: grantMonthlyCredits se ALAG hai
//   grantMonthlyCredits = cron pe chalta hai, rollover/expire karta hai
//   grantUpgradeCredits = upgrade pe chalta hai, sirf ADD karta hai
// ══════════════════════════════════════════════════════════
export async function grantUpgradeCredits(
    tenantId: string,
    newPlanId: PlanId,
    oldPlanId?: PlanId,
): Promise<{ granted: number; newBalance: number }> {
    await connectDB()

    const newPlan = PLANS[newPlanId]
    const newPlanCredits = newPlan.freeCreditsPerMonth
    const month = new Date().toISOString().slice(0, 7)

    // Current state
    const credit = await getOrCreateCredit(tenantId)
    const currentBalance = credit.balance

    // Is month already koi grant tha?
    const thisMonthGrant = (credit.monthlyCredits ?? []).find(
        (m: any) => m.month === month
    )

    // ── CORRECT MATH ──
    // currentBalance = jo bhi hai (plan credits + purchased addon credits)
    // newBalance = currentBalance + newPlanCredits (poore, diff nahi)
    //
    // WHY NOT DIFF?
    // Diff logic galat hai:
    //   diff = 1500 - 500 = 1000
    //   newBalance = 750 + 1000 = 1750 ❌
    //
    // Sahi logic:
    //   newBalance = 750 + 1500 = 2250 ✅
    //   (750 already balance mein hai, usme se 500 plan ke the — koi fark nahi)
    //   (school ko poore 1500 milne chahiye kyunki usne Growth kharida)
    const newBalance = currentBalance + newPlanCredits

    const description =
        `Plan upgrade ${oldPlanId ?? '?'} → ${newPlanId}: ` +
        `existing ${currentBalance} + ${newPlanCredits} new = ${newBalance}`

    if (thisMonthGrant) {
        // Is month pehle grant tha (old plan ka)
        // Sirf plan update karo record mein, balance mein newPlanCredits add karo
        await MessageCredit.findOneAndUpdate(
            { tenantId, 'monthlyCredits.month': month },
            {
                $set: {
                    balance: newBalance,
                    'monthlyCredits.$.plan': newPlanId,
                    'monthlyCredits.$.creditsGiven': newPlanCredits,
                    'monthlyCredits.$.creditsFromPrev': currentBalance,
                    'monthlyCredits.$.expired': false,
                },
                $inc: { totalEarned: newPlanCredits },
            }
        )
    } else {
        // Is month koi grant nahi tha — naya record
        await MessageCredit.findOneAndUpdate(
            { tenantId },
            {
                $set: { balance: newBalance },
                $inc: { totalEarned: newPlanCredits },
                $push: {
                    monthlyCredits: {
                        month,
                        plan: newPlanId,
                        creditsGiven: newPlanCredits,
                        creditsFromPrev: currentBalance,
                        expired: false,
                    },
                },
            },
            { upsert: true }
        )
    }

    await CreditTransaction.create({
        tenantId,
        type: 'upgrade_grant' as TransactionType,
        amount: newPlanCredits,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description,
    })

    await School.findByIdAndUpdate(tenantId, { creditBalance: newBalance })

    console.log(
        `[grantUpgradeCredits] ${oldPlanId ?? '?'} → ${newPlanId}: ` +
        `${currentBalance} + ${newPlanCredits} = ${newBalance}`
    )

    return { granted: newPlanCredits, newBalance }
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
                    expired: false,
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
        description: `60-day trial — ${TRIAL_CONFIG.freeCredits} free credits`,
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
        return { success: false, creditsAdded: 0, newBalance: 0, error: 'Invalid pack ID' }
    }

    const { newBalance } = await addCredits(
        tenantId,
        pack.credits,
        'pack_purchase',
        `Purchased ${pack.name} — ${pack.credits} credits`,
        { packId, orderId, razorpayPaymentId, amountPaid: pack.price }
    )

    return { success: true, creditsAdded: pack.credits, newBalance }
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
    // NEW: useful for frontend
    currentAddon?: number
    maxAddon?: number
    remainingAddonSlots?: number
}> {
    await connectDB()

    const pack = ADDON_PRICING.extraStudents[packId]
    if (!pack) {
        return { success: false, extraStudents: 0, newLimit: 0, error: 'Invalid student pack ID' }
    }

    const school = await School.findById(tenantId)
        .select('plan addonLimits')
        .lean() as any

    if (!school) {
        return { success: false, extraStudents: 0, newLimit: 0, error: 'School not found' }
    }

    const planConfig = PLANS[school.plan as PlanId]
    const currentExtra = school.addonLimits?.extraStudents ?? 0
    const maxAddon = planConfig.maxAddonStudents

    // ── ADDON CAP CHECK ──
    if (maxAddon !== -1) {
        const afterPurchase = currentExtra + pack.students

        if (afterPurchase > maxAddon) {
            const remainingSlots = Math.max(0, maxAddon - currentExtra)
            const planLimit = planConfig.maxStudents
            const nextPlanName =
                school.plan === 'starter' ? 'Growth' :
                    school.plan === 'growth' ? 'Pro' :
                        school.plan === 'pro' ? 'Enterprise' : ''

            return {
                success: false,
                extraStudents: 0,
                newLimit: planLimit + currentExtra,
                currentAddon: currentExtra,
                maxAddon,
                remainingAddonSlots: remainingSlots,
                error: remainingSlots === 0
                    ? `${planConfig.name} plan mein addon limit full ho gayi (max +${maxAddon} students). ` +
                    `${nextPlanName ? `${nextPlanName} plan upgrade karein — ${nextPlanName === 'Growth' ? '1,500' : nextPlanName === 'Pro' ? '5,000' : 'unlimited'} students milenge.` : ''}`
                    : `Is pack mein ${pack.students} students hain lekin sirf ${remainingSlots} aur add ho sakte hain. ` +
                    `Chhota pack choose karein.`,
            }
        }
    }

    // ── All good — proceed ──
    const newExtra = currentExtra + pack.students
    const newLimit = planConfig.maxStudents === -1
        ? -1
        : planConfig.maxStudents + newExtra

    await School.findByIdAndUpdate(tenantId, {
        $inc: { 'addonLimits.extraStudents': pack.students },
    })

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

    await MessageCredit.findOneAndUpdate(
        { tenantId },
        { $set: { effectiveMaxStudents: newLimit } }
    )

    await CreditTransaction.create({
        tenantId,
        type: 'addon_purchase' as TransactionType,
        amount: 0,
        balanceBefore: credit?.balance ?? 0,
        balanceAfter: credit?.balance ?? 0,
        description:
            `Extra ${pack.students} students purchased — ₹${pack.price} ` +
            `(addon: ${newExtra}/${maxAddon === -1 ? '∞' : maxAddon}, total limit: ${newLimit})`,
        packId,
        orderId,
        razorpayPaymentId,
        amountPaid: pack.price,
    })

    return {
        success: true,
        extraStudents: pack.students,
        newLimit,
        currentAddon: newExtra,
        maxAddon,
        remainingAddonSlots: maxAddon === -1 ? -1 : maxAddon - newExtra,
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
    currentAddon?: number
    maxAddon?: number
    remainingAddonSlots?: number
}> {
    await connectDB()

    const pack = ADDON_PRICING.extraTeachers[packId]
    if (!pack) {
        return { success: false, extraTeachers: 0, newLimit: 0, error: 'Invalid teacher pack ID' }
    }

    const school = await School.findById(tenantId)
        .select('plan addonLimits')
        .lean() as any

    if (!school) {
        return { success: false, extraTeachers: 0, newLimit: 0, error: 'School not found' }
    }

    const planConfig = PLANS[school.plan as PlanId]
    const currentExtra = school.addonLimits?.extraTeachers ?? 0
    const maxAddon = planConfig.maxAddonTeachers

    // ── ADDON CAP CHECK ──
    if (maxAddon !== -1) {
        const afterPurchase = currentExtra + pack.teachers

        if (afterPurchase > maxAddon) {
            const remainingSlots = Math.max(0, maxAddon - currentExtra)
            const nextPlanName =
                school.plan === 'starter' ? 'Growth' :
                    school.plan === 'growth' ? 'Pro' :
                        school.plan === 'pro' ? 'Enterprise' : ''

            return {
                success: false,
                extraTeachers: 0,
                newLimit: planConfig.maxTeachers + currentExtra,
                currentAddon: currentExtra,
                maxAddon,
                remainingAddonSlots: remainingSlots,
                error: remainingSlots === 0
                    ? `${planConfig.name} plan mein teacher addon limit full ho gayi (max +${maxAddon} staff). ` +
                    `${nextPlanName ? `${nextPlanName} plan upgrade karein.` : ''}`
                    : `Is pack mein ${pack.teachers} teachers hain lekin sirf ${remainingSlots} aur add ho sakte hain. ` +
                    `Chhota pack choose karein.`,
            }
        }
    }

    // ── All good — proceed ──
    const newExtra = currentExtra + pack.teachers
    const newLimit = planConfig.maxTeachers === -1
        ? -1
        : planConfig.maxTeachers + newExtra

    await School.findByIdAndUpdate(tenantId, {
        $inc: { 'addonLimits.extraTeachers': pack.teachers },
    })

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

    await MessageCredit.findOneAndUpdate(
        { tenantId },
        { $set: { effectiveMaxTeachers: newLimit } }
    )

    await CreditTransaction.create({
        tenantId,
        type: 'addon_purchase' as TransactionType,
        amount: 0,
        balanceBefore: credit?.balance ?? 0,
        balanceAfter: credit?.balance ?? 0,
        description:
            `Extra ${pack.teachers} teachers purchased — ₹${pack.price} ` +
            `(addon: ${newExtra}/${maxAddon === -1 ? '∞' : maxAddon}, total limit: ${newLimit})`,
        packId,
        orderId,
        razorpayPaymentId,
        amountPaid: pack.price,
    })

    return {
        success: true,
        extraTeachers: pack.teachers,
        newLimit,
        currentAddon: newExtra,
        maxAddon,
        remainingAddonSlots: maxAddon === -1 ? -1 : maxAddon - newExtra,
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