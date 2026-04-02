// FILE: src/app/api/superadmin/schools/[id]/extend-trial/route.ts
// UPDATED: Trial extend ke saath free credits bhi deta hai

import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { MessageCredit } from '@/models/MessageCredit'
import { CreditTransaction } from '@/models/CreditTransaction'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// Trial extend karne pe yeh credits milenge
const TRIAL_EXTEND_FREE_CREDITS = 50

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        await connectDB()

        const body = await req.json().catch(() => ({}))
        const days = body.days ?? 7 // default 7 days

        const school = await School.findById(id)
        if (!school) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const newTrialEnd = new Date(school.trialEndsAt)
        // Agar expire ho gaya to aaj se start
        if (newTrialEnd < new Date()) {
            newTrialEnd.setTime(Date.now())
        }
        newTrialEnd.setDate(newTrialEnd.getDate() + days)

        await School.findByIdAndUpdate(id, { trialEndsAt: newTrialEnd })

        // ── Free credits bhi add karo on extension ──
        let credit = await MessageCredit.findOne({ tenantId: id })
        if (!credit) {
            credit = await MessageCredit.create({
                tenantId: id,
                balance: 0,
                totalEarned: 0,
                totalUsed: 0,
            })
        }

        await MessageCredit.findOneAndUpdate(
            { tenantId: id },
            {
                $inc: {
                    balance: TRIAL_EXTEND_FREE_CREDITS,
                    totalEarned: TRIAL_EXTEND_FREE_CREDITS,
                },
            }
        )

        await CreditTransaction.create({
            tenantId: id,
            type: 'trial_grant',
            amount: TRIAL_EXTEND_FREE_CREDITS,
            channel: 'system',
            purpose: 'trial_extension',
            description: `Trial extended by ${days} days — ${TRIAL_EXTEND_FREE_CREDITS} free credits added`,
            createdBy: session.user.id,
        })

        const updatedCredit = await MessageCredit.findOne({ tenantId: id }).lean()

        return NextResponse.json({
            success: true,
            trialEndsAt: newTrialEnd.toISOString(),
            creditsAdded: TRIAL_EXTEND_FREE_CREDITS,
            newCreditBalance: (updatedCredit as any)?.balance ?? 0,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}