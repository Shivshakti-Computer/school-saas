// FILE: src/app/api/cron/daily/route.ts
// UPDATED: Add monthly credit grants

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { grantMonthlyCredits } from '@/lib/credits'
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email'

export async function GET(req: NextRequest) {
    // Verify cron secret
    const secret = req.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const today = new Date()
    const isFirstOfMonth = today.getDate() === 1

    let results = {
        trialReminders: 0,
        creditsGranted: 0,
        subscriptionsExpired: 0,
    }

    // ── Monthly credit grants (1st of every month) ──
    if (isFirstOfMonth) {
        const activeSchools = await School.find({ isActive: true })
            .select('_id plan trialEndsAt subscriptionId')
            .lean() as any[]

        for (const school of activeSchools) {
            try {
                const isTrial = !school.subscriptionId && new Date(school.trialEndsAt) > today
                if (!isTrial) {
                    const activeSub = await Subscription.findOne({
                        tenantId: school._id,
                        status: 'active',
                    }).lean() as any

                    if (activeSub) {
                        await grantMonthlyCredits(school._id.toString(), activeSub.plan, false)
                        results.creditsGranted++
                    }
                }
            } catch (err) {
                console.error(`Credit grant failed for ${school._id}:`, err)
            }
        }
    }

    // ── Trial ending reminders ──
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
            (new Date(school.trialEndsAt).getTime() - today.getTime()) / 86400000
        )
        if ([7, 3, 1].includes(daysLeft)) {
            const { subject, html } = EMAIL_TEMPLATES.trialReminder(
                school.name,
                daysLeft,
                `${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription`
            )
            await sendEmail(school.email, subject, html)
            results.trialReminders++
        }
    }

    return NextResponse.json({ success: true, results })
}