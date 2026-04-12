// FILE: src/app/api/cron/daily/route.ts
// UPDATED:
//   - @/lib/email → @/lib/message/providers/resend (correct import)
//   - EMAIL_TEMPLATES → @/lib/message/templates
//   - resendSendEmail isHtml: true (system email)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { grantMonthlyCredits } from '@/lib/credits'
import { resendSendEmail } from '@/lib/message/providers/resend'  // ✅ Fix
import { EMAIL_TEMPLATES } from '@/lib/message/templates'          // ✅ Fix

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
    const isFirstOfMonth = today.getDate() === 1

    const results = {
        trialReminders: 0,
        creditsGranted: 0,
        creditErrors: 0,
        subscriptionsExpired: 0,
        emailErrors: 0,
    }

    // ── Monthly Credit Grants (1st of every month) ───────────
    if (isFirstOfMonth) {
        console.log('[CRON] First of month — granting monthly credits')

        const activeSchools = await School.find({ isActive: true })
            .select('_id plan trialEndsAt subscriptionId')
            .lean() as any[]

        for (const school of activeSchools) {
            try {
                const isTrial =
                    !school.subscriptionId &&
                    new Date(school.trialEndsAt) > today

                if (!isTrial) {
                    const activeSub = await Subscription.findOne({
                        tenantId: school._id,
                        status: 'active',
                    }).lean() as any

                    if (activeSub) {
                        await grantMonthlyCredits(
                            school._id.toString(),
                            activeSub.plan,
                            false
                        )
                        results.creditsGranted++
                        console.log(
                            `[CRON] Credits granted: ${school._id} (${activeSub.plan})`
                        )
                    }
                }
            } catch (err) {
                console.error(
                    `[CRON] Credit grant failed for ${school._id}:`,
                    err
                )
                results.creditErrors++
            }
        }
    }

    // ── Trial Ending Reminders ───────────────────────────────
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

        // Sirf 7, 3, 1 din pe reminder bhejo
        if (![7, 3, 1].includes(daysLeft)) continue

        // Email exist karta hai tabhi bhejo
        if (!school.email?.trim()) continue

        try {
            const { subject, html } = EMAIL_TEMPLATES.trialReminder(
                school.name,
                daysLeft,
                `${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription`
            )

            // ✅ isHtml: true — system email, full HTML template
            await resendSendEmail(
                school.email,
                subject,
                html,
                'Skolify Team',
                true    // ← isHtml
            )

            results.trialReminders++
            console.log(
                `[CRON] Trial reminder sent: ${school.name} (${daysLeft} days left)`
            )
        } catch (emailErr) {
            console.error(
                `[CRON] Trial reminder email failed for ${school._id}:`,
                emailErr
            )
            results.emailErrors++
        }
    }

    console.log('[CRON] Daily cron completed:', results)

    return NextResponse.json({
        success: true,
        results,
    })
}