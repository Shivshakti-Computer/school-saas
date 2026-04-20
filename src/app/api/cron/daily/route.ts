// FILE: src/app/api/cron/daily/route.ts
// UPDATED: Storage addon management added
// ─────────────────────────────────────────────────────────
// Daily Tasks:
//   1. Credit grants (subscription anniversary)
//   2. Trial reminders (7, 3, 1 days)
//   3. Storage addon expiry check + grace period
//   4. Storage usage recalculation (weekly)
//   5. Storage low/full warnings
// ─────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { MessageCredit } from '@/models/MessageCredit'
import { CreditTransaction } from '@/models/CreditTransaction'
import { grantMonthlyCredits } from '@/lib/credits'
import {
    renewStorageAddon,
    getStorageStats,
    recalculateStorageUsage,
} from '@/lib/storageAddon'
import { resendSendEmail } from '@/lib/message/providers/resend'
import { EMAIL_TEMPLATES } from '@/lib/message/templates'
import type { PlanId } from '@/config/pricing'

export async function GET(req: NextRequest) {

    // ── Cron Secret Verify ───────────────────────────────────
    const secret = req.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    await connectDB()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const results = {
        // Credits & Trials
        trialReminders: 0,
        creditsGranted: 0,
        creditErrors: 0,
        subscriptionsExpired: 0,
        emailErrors: 0,
        // ── NEW: Storage tracking ──
        storageRenewed: 0,
        storageExpired: 0,
        storageGracePeriodEnded: 0,
        storageRecalculated: 0,
        storageLowWarnings: 0,
        storageFullWarnings: 0,
        storageErrors: 0,
    }

    // ═══════════════════════════════════════════════════════
    // 1. CREDIT GRANTS — Subscription Anniversary
    // ═══════════════════════════════════════════════════════
    console.log('[CRON] Checking subscription anniversaries for credit grants...')

    const activeSchools = await School.find({ isActive: true })
        .select('_id plan trialEndsAt subscriptionId email name storageAddon')
        .lean() as any[]

    for (const school of activeSchools) {
        try {
            const isTrial =
                !school.subscriptionId &&
                new Date(school.trialEndsAt) > today

            // Trial schools ko cron se credits nahi
            if (isTrial) continue

            const activeSub = await Subscription.findOne({
                tenantId: school._id,
                status: 'active',
            }).lean() as any

            if (!activeSub) continue

            // Anniversary check (every 30 days)
            const subStartDate = new Date(activeSub.createdAt)
            subStartDate.setHours(0, 0, 0, 0)

            const daysSinceStart = Math.floor(
                (today.getTime() - subStartDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )

            const isAnniversary = daysSinceStart > 0 && daysSinceStart % 30 === 0

            if (!isAnniversary) continue

            const planToUse = (activeSub.plan ?? school.plan) as PlanId

            await grantMonthlyCredits(
                school._id.toString(),
                planToUse,
                false
            )

            results.creditsGranted++
            console.log(
                `[CRON] ✅ Credits granted: ${school._id}` +
                ` | plan: ${planToUse}` +
                ` | day: ${daysSinceStart}`
            )

        } catch (err) {
            results.creditErrors++
            console.error(
                `[CRON] ❌ Credit grant failed: ${school._id}`,
                err
            )
        }
    }

    // ═══════════════════════════════════════════════════════
    // 2. STORAGE ADDON RENEWAL & EXPIRY (NEW)
    // ═══════════════════════════════════════════════════════
    console.log('[CRON] Processing storage addon renewals & expiry...')

    const schoolsWithStorage = await School.find({
        isActive: true,
        'storageAddon.extraStorageGB': { $gt: 0 },
    })
        .select('_id name email plan storageAddon')
        .lean() as any[]

    for (const school of schoolsWithStorage) {
        try {
            const addon = school.storageAddon
            if (!addon?.validUntil) continue

            const validUntil = new Date(addon.validUntil)
            const gracePeriodEndsAt = addon.gracePeriodEndsAt
                ? new Date(addon.gracePeriodEndsAt)
                : null

            // ── Case 1: Storage addon expired but auto-renew enabled ──
            if (validUntil < today && addon.autoRenew && !gracePeriodEndsAt) {

                // Check if school has active subscription (renewal needs payment)
                const activeSub = await Subscription.findOne({
                    tenantId: school._id,
                    status: 'active',
                }).lean() as any

                if (activeSub) {
                    // Renew storage addon (synced with subscription)
                    const renewResult = await renewStorageAddon(
                        school._id.toString()
                    )

                    if (renewResult.renewed) {
                        results.storageRenewed++
                        console.log(
                            `[CRON] ✅ Storage renewed: ${school.name}` +
                            ` | +${addon.extraStorageGB} GB`
                        )
                    }
                } else {
                    // No active sub — start grace period (7 days)
                    const graceEnd = new Date(today)
                    graceEnd.setDate(graceEnd.getDate() + 7)

                    await School.findByIdAndUpdate(school._id, {
                        $set: {
                            'storageAddon.gracePeriodEndsAt': graceEnd,
                            'storageAddon.autoRenew': false,
                        },
                    })

                    // Send warning email
                    if (school.email) {
                        try {
                            await resendSendEmail(
                                school.email,
                                'Skolify — Storage Addon Expired',
                                generateStorageExpiredEmail(
                                    school.name,
                                    addon.extraStorageGB,
                                    graceEnd
                                ),
                                'Skolify Team',
                                true
                            )
                        } catch {
                            // Non-critical
                        }
                    }

                    results.storageExpired++
                    console.log(
                        `[CRON] ⚠️ Storage expired (grace till ${graceEnd.toLocaleDateString()}): ${school.name}`
                    )
                }
            }

            // ── Case 2: Grace period ended — REMOVE addon storage ──
            if (gracePeriodEndsAt && gracePeriodEndsAt < today) {

                const removedGB = addon.extraStorageGB

                // Reset addon storage to 0
                await School.findByIdAndUpdate(school._id, {
                    $set: {
                        'storageAddon.extraStorageGB': 0,
                        'storageAddon.validUntil': null,
                        'storageAddon.gracePeriodEndsAt': null,
                        'storageAddon.lastRenewedAt': null,
                        'storageAddon.autoRenew': false,
                    },
                })

                // Update MessageCredit
                await MessageCredit.findOneAndUpdate(
                    { tenantId: school._id },
                    { $set: { extraStorageGB: 0 } }
                )

                // Log transaction
                await CreditTransaction.create({
                    tenantId: school._id,
                    type: 'storage_purchase',
                    amount: 0,
                    balanceBefore: 0,
                    balanceAfter: 0,
                    description:
                        `Storage addon removed after grace period — ${removedGB} GB freed. ` +
                        `Files may be deleted if usage exceeds plan limit.`,
                })

                // Send final notification email
                if (school.email) {
                    try {
                        await resendSendEmail(
                            school.email,
                            'Skolify — Storage Addon Removed',
                            generateStorageRemovedEmail(
                                school.name,
                                removedGB
                            ),
                            'Skolify Team',
                            true
                        )
                    } catch {
                        // Non-critical
                    }
                }

                results.storageGracePeriodEnded++
                console.log(
                    `[CRON] 🗑️ Storage addon removed (grace ended): ${school.name}` +
                    ` | -${removedGB} GB`
                )
            }

        } catch (err) {
            results.storageErrors++
            console.error(
                `[CRON] ❌ Storage processing failed: ${school._id}`,
                err
            )
        }
    }

    // ═══════════════════════════════════════════════════════
    // 3. STORAGE USAGE RECALCULATION (Weekly — every Sunday)
    // ═══════════════════════════════════════════════════════
    if (today.getDay() === 0) {  // Sunday
        console.log('[CRON] Weekly storage recalculation...')

        for (const school of activeSchools) {
            try {
                await recalculateStorageUsage(school._id.toString())
                results.storageRecalculated++
            } catch (err) {
                results.storageErrors++
                console.error(
                    `[CRON] ❌ Storage recalc failed: ${school._id}`,
                    err
                )
            }
        }

        console.log(
            `[CRON] ✅ Storage recalculated for ${results.storageRecalculated} schools`
        )
    }

    // ═══════════════════════════════════════════════════════
    // 4. STORAGE LOW/FULL WARNINGS
    // ═══════════════════════════════════════════════════════
    console.log('[CRON] Checking storage usage warnings...')

    for (const school of activeSchools) {
        try {
            const planId = school.plan as PlanId
            if (planId === 'enterprise') continue  // Unlimited

            const stats = await getStorageStats(
                school._id.toString(),
                planId,
                school.storageAddon
            )

            if (stats.isUnlimited) continue

            // ── 80% used → Low warning (only once per week) ──
            if (stats.usedPercent >= 80 && stats.usedPercent < 95) {
                // Check if warning already sent this week
                const lastWarning = await CreditTransaction.findOne({
                    tenantId: school._id,
                    type: 'storage_purchase',
                    description: { $regex: /Storage low warning sent/ },
                    createdAt: {
                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                }).lean()

                if (!lastWarning && school.email) {
                    try {
                        await resendSendEmail(
                            school.email,
                            `Skolify — Storage ${stats.usedPercent}% Full`,
                            generateStorageLowEmail(
                                school.name,
                                stats.usedGB,
                                stats.totalLimitGB,
                                stats.usedPercent
                            ),
                            'Skolify Team',
                            true
                        )

                        // Log to prevent spam
                        await CreditTransaction.create({
                            tenantId: school._id,
                            type: 'storage_purchase',
                            amount: 0,
                            balanceBefore: 0,
                            balanceAfter: 0,
                            description: `Storage low warning sent — ${stats.usedPercent}% used`,
                        })

                        results.storageLowWarnings++
                    } catch {
                        results.emailErrors++
                    }
                }
            }

            // ── 95% used → Full warning (daily until resolved) ──
            if (stats.usedPercent >= 95) {
                if (school.email) {
                    try {
                        await resendSendEmail(
                            school.email,
                            `🚨 Skolify — Storage Almost Full!`,
                            generateStorageFullEmail(
                                school.name,
                                stats.usedGB,
                                stats.totalLimitGB,
                                stats.freeGB
                            ),
                            'Skolify Team',
                            true
                        )

                        results.storageFullWarnings++
                    } catch {
                        results.emailErrors++
                    }
                }
            }

        } catch (err) {
            results.storageErrors++
        }
    }

    // ═══════════════════════════════════════════════════════
    // 5. TRIAL ENDING REMINDERS
    // ═══════════════════════════════════════════════════════
    const trialEndingSoon = await School.find({
        isActive: true,
        subscriptionId: { $exists: false },
        trialEndsAt: {
            $gte: today,
            $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
    }).lean() as any[]

    for (const school of trialEndingSoon) {
        const daysLeft = Math.ceil(
            (new Date(school.trialEndsAt).getTime() - today.getTime()) /
            86400000
        )

        if (![7, 3, 1].includes(daysLeft)) continue
        if (!school.email?.trim()) continue

        try {
            const { subject, html } = EMAIL_TEMPLATES.trialReminder(
                school.name,
                daysLeft,
                `${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription`
            )

            await resendSendEmail(
                school.email,
                subject,
                html,
                'Skolify Team',
                true
            )

            results.trialReminders++
            console.log(
                `[CRON] 📧 Trial reminder sent: ${school.name}` +
                ` (${daysLeft} day${daysLeft > 1 ? 's' : ''} left)`
            )

        } catch (emailErr) {
            results.emailErrors++
            console.error(
                `[CRON] ❌ Trial reminder failed: ${school._id}`,
                emailErr
            )
        }
    }

    console.log('[CRON] ✅ Daily cron completed:', results)

    return NextResponse.json({
        success: true,
        date: today.toISOString().split('T')[0],
        results,
    })
}

// ═══════════════════════════════════════════════════════════
// EMAIL TEMPLATES (Storage Notifications)
// ═══════════════════════════════════════════════════════════

function generateStorageExpiredEmail(
    schoolName: string,
    expiredGB: number,
    gracePeriodEndsAt: Date
): string {
    const dateStr = gracePeriodEndsAt.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
    })

    return `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#F59E0B">⚠️ Storage Addon Expired</h2>
            <p>Hi ${schoolName},</p>
            
            <p>Aapka <strong>+${expiredGB} GB storage addon</strong> expire ho gaya hai 
            kyunki active subscription nahi hai.</p>
            
            <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:12px;padding:16px;margin:16px 0">
                <p style="margin:0;color:#92400E"><strong>📅 Grace Period:</strong></p>
                <p style="margin:8px 0 0;color:#78350F">
                    Aapke files <strong>${dateStr}</strong> tak safe hain.
                    Iske baad addon storage hata diya jaayega.
                </p>
            </div>
            
            <h3 style="color:#0F172A">Aap kya kar sakte hain?</h3>
            <ul style="color:#475569">
                <li>Subscription renew karein → storage addon auto-renew ho jaayega</li>
                <li>Files download/backup karein</li>
                <li>Plan upgrade karein for more included storage</li>
            </ul>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription"
               style="display:inline-block;background:#F59E0B;color:#fff;padding:12px 24px;
                      border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
                Renew Subscription →
            </a>
            
            <p style="color:#94A3B8;font-size:12px;margin-top:24px">
                Skolify — Powered by Shivshakti Computer Academy
            </p>
        </div>
    `
}

function generateStorageRemovedEmail(
    schoolName: string,
    removedGB: number
): string {
    return `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#EF4444">🗑️ Storage Addon Removed</h2>
            <p>Hi ${schoolName},</p>
            
            <p>Grace period khatam ho gaya hai. Aapka <strong>+${removedGB} GB storage addon</strong> 
            account se hata diya gaya hai.</p>
            
            <div style="background:#FEE2E2;border:1px solid #FCA5A5;border-radius:12px;padding:16px;margin:16px 0">
                <p style="margin:0;color:#991B1B"><strong>⚠️ Important:</strong></p>
                <p style="margin:8px 0 0;color:#7F1D1D">
                    Agar aapki storage usage plan limit se zyada hai, 
                    new uploads block ho jaayenge. 
                    Plan upgrade ya storage addon repurchase karein.
                </p>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription"
               style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 24px;
                      border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
                Buy Storage Pack →
            </a>
            
            <p style="color:#94A3B8;font-size:12px;margin-top:24px">
                Skolify — Powered by Shivshakti Computer Academy
            </p>
        </div>
    `
}

function generateStorageLowEmail(
    schoolName: string,
    usedGB: number,
    totalGB: number,
    usedPercent: number
): string {
    return `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#F59E0B">📊 Storage ${usedPercent}% Full</h2>
            <p>Hi ${schoolName},</p>
            
            <p>Aapka storage usage <strong>${usedGB} GB / ${totalGB} GB</strong> ho gaya hai.</p>
            
            <div style="background:#F1F5F9;border-radius:12px;padding:20px;margin:16px 0">
                <div style="background:#E2E8F0;border-radius:8px;height:24px;overflow:hidden">
                    <div style="background:#F59E0B;width:${usedPercent}%;height:100%;
                                display:flex;align-items:center;justify-content:center;
                                color:white;font-weight:600;font-size:12px">
                        ${usedPercent}%
                    </div>
                </div>
                <p style="margin:12px 0 0;color:#64748B;font-size:13px">
                    ${usedGB} GB used out of ${totalGB} GB
                </p>
            </div>
            
            <p>Storage full hone se pehle upgrade karein:</p>
            <ul style="color:#475569">
                <li><strong>5 GB Pack:</strong> ₹49/month</li>
                <li><strong>20 GB Pack:</strong> ₹149/month (Most Popular)</li>
                <li><strong>50 GB Pack:</strong> ₹299/month</li>
            </ul>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription"
               style="display:inline-block;background:#F59E0B;color:#fff;padding:12px 24px;
                      border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
                Buy Storage Pack →
            </a>
            
            <p style="color:#94A3B8;font-size:12px;margin-top:24px">
                Skolify — Powered by Shivshakti Computer Academy
            </p>
        </div>
    `
}

function generateStorageFullEmail(
    schoolName: string,
    usedGB: number,
    totalGB: number,
    freeGB: number
): string {
    return `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#DC2626">🚨 Storage Almost Full!</h2>
            <p>Hi ${schoolName},</p>
            
            <p style="color:#991B1B;font-weight:600">
                Sirf <strong>${freeGB} GB</strong> bachi hai! Naye uploads jald block ho jaayenge.
            </p>
            
            <div style="background:#FEE2E2;border:1px solid #FCA5A5;border-radius:12px;padding:20px;margin:16px 0">
                <div style="background:#FCA5A5;border-radius:8px;height:24px;overflow:hidden">
                    <div style="background:#DC2626;width:95%;height:100%;
                                display:flex;align-items:center;justify-content:center;
                                color:white;font-weight:700;font-size:12px">
                        ${usedGB} GB / ${totalGB} GB
                    </div>
                </div>
            </div>
            
            <h3 style="color:#0F172A">Turant action lein:</h3>
            <ol style="color:#475569">
                <li>Storage addon kharidein (₹49/month se shuru)</li>
                <li>Plan upgrade karein for more included storage</li>
                <li>Old/unused files delete karein</li>
            </ol>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription"
               style="display:inline-block;background:#DC2626;color:#fff;padding:14px 28px;
                      border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">
                Buy Storage Now →
            </a>
            
            <p style="color:#94A3B8;font-size:12px;margin-top:24px">
                Skolify — Powered by Shivshakti Computer Academy
            </p>
        </div>
    `
}