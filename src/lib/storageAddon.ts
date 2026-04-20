// FILE: src/lib/storageAddon.ts
// FIX: purchaseStoragePack mein ek critical bug tha
// School.findById mein storageAddon field lean() ke baad
// correctly read ho raha tha, lekin addonLimits confuse tha
// Ab explicit aur safe hai

import { connectDB } from './db'
import { School } from '@/models/School'
import { MessageCredit } from '@/models/MessageCredit'
import { CreditTransaction } from '@/models/CreditTransaction'
import { Subscription } from '@/models/Subscription'
import {
    STORAGE_PACKS,
    PLAN_STORAGE_GB,
    PLAN_STORAGE_ADDON_CAP_GB,
    getStoragePrice,
    type StoragePackId,
    type PlanId,
} from '@/config/pricing'
import { calculateSchoolStorageBytes } from './r2Client'

// ══════════════════════════════════════════════════════════
// PURCHASE STORAGE PACK
// ══════════════════════════════════════════════════════════

export interface StoragePurchaseResult {
    success: boolean
    storageAdded: number
    newTotalGB: number
    newUsedBytes: number
    validUntil: Date
    billingCycle: 'monthly' | 'yearly'
    error?: string
    currentAddon?: number
    maxAddon?: number
    remainingAddonSlots?: number
}

export async function purchaseStoragePack(
    tenantId: string,
    packId: StoragePackId,
    billingCycle: 'monthly' | 'yearly',
    orderId: string,
    razorpayPaymentId: string
): Promise<StoragePurchaseResult> {
    await connectDB()

    const pack = STORAGE_PACKS.find(p => p.id === packId)
    if (!pack) {
        return {
            success: false,
            storageAdded: 0,
            newTotalGB: 0,
            newUsedBytes: 0,
            validUntil: new Date(),
            billingCycle,
            error: 'Invalid storage pack',
        }
    }

    // ✅ FIX: storageAddon + storageUsedBytes explicitly select karo
    const school = await School.findById(tenantId)
        .select('plan storageAddon storageUsedBytes')
        .lean() as any

    if (!school) {
        return {
            success: false,
            storageAdded: 0,
            newTotalGB: 0,
            newUsedBytes: 0,
            validUntil: new Date(),
            billingCycle,
            error: 'School not found',
        }
    }

    const planId = school.plan as PlanId
    const planBaseGB = PLAN_STORAGE_GB[planId] ?? 2

    // ✅ FIX: storageAddon se read karo, addonLimits se nahi
    const currentExtra: number = school.storageAddon?.extraStorageGB ?? 0
    const maxAddon: number = PLAN_STORAGE_ADDON_CAP_GB[planId] ?? 20

    // ── CAP CHECK ──
    if (maxAddon !== -1) {
        const afterPurchase = currentExtra + pack.storageGB

        if (afterPurchase > maxAddon) {
            const remainingSlots = Math.max(0, maxAddon - currentExtra)
            const nextPlanName =
                planId === 'starter' ? 'Growth' :
                    planId === 'growth' ? 'Pro' :
                        planId === 'pro' ? 'Enterprise' : ''

            return {
                success: false,
                storageAdded: 0,
                newTotalGB: planBaseGB + currentExtra,
                newUsedBytes: school.storageUsedBytes ?? 0,
                validUntil: new Date(),
                billingCycle,
                currentAddon: currentExtra,
                maxAddon,
                remainingAddonSlots: remainingSlots,
                error: remainingSlots === 0
                    ? `${planId} plan mein storage limit full (max +${maxAddon} GB). ${nextPlanName ? `${nextPlanName} upgrade karein.` : ''}`
                    : `Is pack mein ${pack.storageGB} GB hai lekin sirf ${remainingSlots} GB add ho sakta hai.`,
            }
        }
    }

    // ── Calculate validUntil ──
    let validUntil = new Date()

    const activeSub = await Subscription.findOne({
        tenantId,
        status: 'active',
    }).lean() as any

    if (activeSub?.currentPeriodEnd) {
        // Subscription ke saath sync karo
        validUntil = new Date(activeSub.currentPeriodEnd)
    } else {
        // No active sub — standalone renewal
        if (billingCycle === 'yearly') {
            validUntil.setFullYear(validUntil.getFullYear() + 1)
        } else {
            validUntil.setMonth(validUntil.getMonth() + 1)
        }
    }

    // ── New values ──
    const newExtra = currentExtra + pack.storageGB
    const newTotalGB = planBaseGB === -1 ? -1 : planBaseGB + newExtra
    const price = getStoragePrice(packId, billingCycle)

    // ── Update School — atomic ──
    await School.findByIdAndUpdate(
        tenantId,
        {
            $set: {
                'storageAddon.extraStorageGB': newExtra,        // ✅ total addon GB
                'storageAddon.packId': packId,                  // last purchased pack
                'storageAddon.billingCycle': billingCycle,
                'storageAddon.validUntil': validUntil,
                'storageAddon.lastRenewedAt': new Date(),
                'storageAddon.autoRenew': true,
                // Clear grace period if re-purchasing after cancel
                'storageAddon.canceledAt': null,
                'storageAddon.gracePeriodEndsAt': null,
            },
        },
        { new: true }
    )

    // ── Update MessageCredit record ──
    const credit = await MessageCredit.findOneAndUpdate(
        { tenantId },
        {
            $set: { extraStorageGB: newExtra },
            $push: {
                extraStoragePacks: {
                    packId,
                    storageGB: pack.storageGB,
                    price,
                    purchasedAt: new Date(),
                    orderId,
                    validUntil,
                    billingCycle,
                },
            },
        },
        { new: true, upsert: true }
    )

    // ── Transaction Log ──
    await CreditTransaction.create({
        tenantId,
        type: 'storage_purchase',
        amount: 0,
        balanceBefore: credit?.balance ?? 0,
        balanceAfter: credit?.balance ?? 0,
        description:
            `Storage addon: +${pack.storageGB} GB (${pack.name}) — ` +
            `₹${price} (${billingCycle}) — valid till ${validUntil.toLocaleDateString('en-IN')}`,
        packId,
        orderId,
        razorpayPaymentId,
        amountPaid: price,
    })

    return {
        success: true,
        storageAdded: pack.storageGB,
        newTotalGB,
        newUsedBytes: school.storageUsedBytes ?? 0,
        validUntil,
        billingCycle,
        currentAddon: newExtra,
        maxAddon,
        remainingAddonSlots: maxAddon === -1 ? -1 : maxAddon - newExtra,
    }
}

// ══════════════════════════════════════════════════════════
// RENEW STORAGE ADDON (Cron job)
// ══════════════════════════════════════════════════════════

export async function renewStorageAddon(
    tenantId: string
): Promise<{ success: boolean; renewed: boolean; reason?: string }> {
    await connectDB()

    const school = await School.findById(tenantId)
        .select('storageAddon')
        .lean() as any

    if (!school?.storageAddon?.extraStorageGB) {
        return { success: true, renewed: false, reason: 'No addon purchased' }
    }

    if (!school.storageAddon.autoRenew) {
        return { success: true, renewed: false, reason: 'Auto-renew disabled' }
    }

    const now = new Date()
    const validUntil = new Date(school.storageAddon.validUntil)

    if (validUntil > now) {
        return { success: true, renewed: false, reason: 'Not yet expired' }
    }

    const newValidUntil = new Date(validUntil)
    newValidUntil.setMonth(newValidUntil.getMonth() + 1)

    await School.findByIdAndUpdate(tenantId, {
        $set: {
            'storageAddon.validUntil': newValidUntil,
            'storageAddon.lastRenewedAt': now,
        },
    })

    await CreditTransaction.create({
        tenantId,
        type: 'storage_purchase',
        amount: 0,
        balanceBefore: 0,
        balanceAfter: 0,
        description: `Storage addon auto-renewed — valid till ${newValidUntil.toLocaleDateString('en-IN')}`,
    })

    return { success: true, renewed: true }
}

// ══════════════════════════════════════════════════════════
// GET STORAGE STATS
// ══════════════════════════════════════════════════════════

export interface StorageStats {
    planBaseGB: number
    addonGB: number
    totalLimitGB: number
    usedBytes: number
    usedGB: number
    usedPercent: number
    freeBytes: number | -1
    freeGB: number
    isUnlimited: boolean
    isNearLimit: boolean
    isFull: boolean
    addonCap: number
    remainingAddonGB: number
    canPurchaseMore: boolean
    addonValidUntil?: Date
    addonExpired: boolean
    daysUntilRenewal?: number
}

export async function getStorageStats(
    tenantId: string,
    planId: PlanId,
    // ✅ storageAddon object accept karo (school.storageAddon)
    storageAddon?: {
        extraStorageGB?: number
        validUntil?: Date | string
        autoRenew?: boolean
        gracePeriodEndsAt?: Date | string
    } | null
): Promise<StorageStats> {
    await connectDB()

    const planBaseGB = PLAN_STORAGE_GB[planId] ?? 2
    const addonCap = PLAN_STORAGE_ADDON_CAP_GB[planId] ?? 20
    const isUnlimited = planBaseGB === -1

    // ── Addon expiry check ──
    const now = new Date()
    const addonValidUntil = storageAddon?.validUntil
        ? new Date(storageAddon.validUntil)
        : undefined
    const addonExpired = addonValidUntil ? addonValidUntil < now : false

    // Expired addon count nahi hoga
    const addonGB = addonExpired ? 0 : (storageAddon?.extraStorageGB ?? 0)

    const totalLimitGB = isUnlimited ? -1 : planBaseGB + addonGB
    const totalLimitBytes = isUnlimited
        ? Number.MAX_SAFE_INTEGER
        : totalLimitGB * 1024 * 1024 * 1024

    // ── Actual used bytes from DB ──
    const school = await School.findById(tenantId)
        .select('storageUsedBytes')
        .lean() as any

    const usedBytes: number = school?.storageUsedBytes ?? 0
    const usedGB = Math.round((usedBytes / (1024 * 1024 * 1024)) * 100) / 100

    const usedPercent = isUnlimited
        ? 0
        : Math.min(100, Math.round((usedBytes / totalLimitBytes) * 100))

    const freeBytes = isUnlimited
        ? -1
        : Math.max(0, totalLimitBytes - usedBytes)

    const freeGB = isUnlimited
        ? -1
        : Math.round((freeBytes / (1024 * 1024 * 1024)) * 100) / 100

    const remainingAddonGB = addonCap === -1
        ? -1
        : Math.max(0, addonCap - addonGB)

    const daysUntilRenewal = addonValidUntil
        ? Math.ceil((addonValidUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : undefined

    return {
        planBaseGB,
        addonGB,
        totalLimitGB,
        usedBytes,
        usedGB,
        usedPercent,
        freeBytes,
        freeGB,
        isUnlimited,
        isNearLimit: !isUnlimited && usedPercent >= 80,
        isFull: !isUnlimited && usedPercent >= 95,
        addonCap,
        remainingAddonGB,
        canPurchaseMore: !isUnlimited && (addonCap === -1 || addonGB < addonCap),
        addonValidUntil,
        addonExpired,
        daysUntilRenewal: daysUntilRenewal && daysUntilRenewal > 0
            ? daysUntilRenewal
            : undefined,
    }
}

// ══════════════════════════════════════════════════════════
// UPDATE STORAGE USAGE
// ══════════════════════════════════════════════════════════

export async function updateStorageUsage(
    tenantId: string,
    byteDelta: number
): Promise<void> {
    await connectDB()
    await School.findByIdAndUpdate(tenantId, {
        $inc: { storageUsedBytes: byteDelta },
    })
}

// ══════════════════════════════════════════════════════════
// RECALCULATE FROM R2
// ══════════════════════════════════════════════════════════

export async function recalculateStorageUsage(
    tenantId: string
): Promise<number> {
    await connectDB()
    const actualBytes = await calculateSchoolStorageBytes(tenantId)
    await School.findByIdAndUpdate(tenantId, {
        $set: { storageUsedBytes: actualBytes },
    })
    return actualBytes
}

// ══════════════════════════════════════════════════════════
// CHECK STORAGE LIMIT (before upload)
// ══════════════════════════════════════════════════════════

export interface StorageCheckResult {
    canUpload: boolean
    usedBytes: number
    limitBytes: number
    fileSizeBytes: number
    remainingBytes: number
    message?: string
}

export async function checkStorageLimit(
    tenantId: string,
    planId: PlanId,
    fileSizeBytes: number,
    storageAddon?: {
        extraStorageGB?: number
        validUntil?: Date | string
    } | null
): Promise<StorageCheckResult> {
    const stats = await getStorageStats(tenantId, planId, storageAddon)

    if (stats.isUnlimited) {
        return {
            canUpload: true,
            usedBytes: stats.usedBytes,
            limitBytes: -1,
            fileSizeBytes,
            remainingBytes: -1,
        }
    }

    const limitBytes = stats.totalLimitGB * 1024 * 1024 * 1024
    const remainingBytes = Math.max(0, limitBytes - stats.usedBytes)
    const canUpload = fileSizeBytes <= remainingBytes

    return {
        canUpload,
        usedBytes: stats.usedBytes,
        limitBytes,
        fileSizeBytes,
        remainingBytes,
        message: !canUpload
            ? `Storage full! ${stats.freeGB} GB bachi hai. Storage pack kharidein (₹49/month se shuru).`
            : undefined,
    }
}