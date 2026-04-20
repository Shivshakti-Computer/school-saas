// FILE: src/app/api/cron/daily/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { grantMonthlyCredits } from '@/lib/credits'
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
        trialReminders:       0,
        creditsGranted:       0,
        creditErrors:         0,
        subscriptionsExpired: 0,
        emailErrors:          0,
    }

    // ── Credit Grants — Subscription Anniversary ─────────────
    // Har school ka subscription start date check hoga
    // Har 30 din baad credits milenge (calendar month se nahi)
    //
    // Example:
    //   Sub start: 15 Jan → Credits: 14 Feb, 16 Mar, 15 Apr ...
    //   Sub start: 1 Jan  → Credits: 31 Jan, 2 Mar, 1 Apr ...
    // ─────────────────────────────────────────────────────────
    console.log('[CRON] Checking subscription anniversaries for credit grants...')

    const activeSchools = await School.find({ isActive: true })
        .select('_id plan trialEndsAt subscriptionId')
        .lean() as any[]

    for (const school of activeSchools) {
        try {
            const isTrial =
                !school.subscriptionId &&
                new Date(school.trialEndsAt) > today

            // Trial schools ko cron se credits nahi — sirf paid plans
            if (isTrial) continue

            const activeSub = await Subscription.findOne({
                tenantId: school._id,
                status:   'active',
            }).lean() as any

            if (!activeSub) continue

            // Subscription start date se aaj tak kitne din
            const subStartDate = new Date(activeSub.createdAt)
            subStartDate.setHours(0, 0, 0, 0)

            const daysSinceStart = Math.floor(
                (today.getTime() - subStartDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )

            // Har 30 din ka anniversary — day 0 ko nahi (subscription start wala din)
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

    // ── Trial Ending Reminders ───────────────────────────────
    // Sirf 7, 3, 1 din baad reminder bhejo
    // ─────────────────────────────────────────────────────────
    const trialEndingSoon = await School.find({
        isActive:        true,
        subscriptionId:  { $exists: false },
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
        date:    today.toISOString().split('T')[0],
        results,
    })
}