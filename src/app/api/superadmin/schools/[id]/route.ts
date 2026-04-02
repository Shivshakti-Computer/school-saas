// FILE: src/app/api/superadmin/schools/[id]/route.ts
// UPDATED: Credit adjust + addonLimits support

import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { PLANS } from '@/config/pricing'
import type { PlanId } from '@/config/pricing'
import { School } from '@/models/School'
import { MessageCredit } from '@/models/MessageCredit'
import { CreditTransaction } from '@/models/CreditTransaction'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
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
        const body = await req.json()

        const update: any = {}

        // ── Toggle active ──
        if (typeof body.isActive === 'boolean') {
            update.isActive = body.isActive
        }

        // ── Plan change ──
        if (body.plan && Object.keys(PLANS).includes(body.plan)) {
            update.plan = body.plan
            update.modules = PLANS[body.plan as PlanId]?.modules ?? []
            if (body.manualOverride) {
                update.subscriptionId = `manual_${Date.now()}`
            }
        }

        // ── Addon limits (superadmin override) ──
        if (body.addonLimits) {
            update.addonLimits = body.addonLimits
        }

        // ── Credit adjustment ──
        if (typeof body.adjustCredits === 'number' && body.adjustCredits !== 0) {
            const amount = body.adjustCredits

            let credit = await MessageCredit.findOne({ tenantId: id })
            if (!credit) {
                credit = await MessageCredit.create({
                    tenantId: id,
                    balance: 0,
                    totalEarned: 0,
                    totalUsed: 0,
                })
            }

            const newBalance = Math.max(0, (credit.balance ?? 0) + amount)

            await MessageCredit.findOneAndUpdate(
                { tenantId: id },
                {
                    $set: { balance: newBalance },
                    ...(amount > 0 ? { $inc: { totalEarned: amount } } : {}),
                }
            )

            await CreditTransaction.create({
                tenantId: id,
                type: amount > 0 ? 'manual_add' : 'manual_deduct',
                amount,
                channel: 'manual',
                purpose: 'superadmin_adjustment',
                description: `Superadmin manual: ${amount > 0 ? '+' : ''}${amount} credits`,
                createdBy: session.user.id,
            })
        }

        // Apply school updates if any
        let school = null
        if (Object.keys(update).length > 0) {
            school = await School.findByIdAndUpdate(
                id,
                { $set: update },
                { new: true }
            )
            if (!school) {
                return NextResponse.json({ error: 'School not found' }, { status: 404 })
            }
        }

        // Return updated credit balance too
        const credit = await MessageCredit.findOne({ tenantId: id }).lean()

        return NextResponse.json({
            success: true,
            school: school ? JSON.parse(JSON.stringify(school)) : null,
            creditBalance: (credit as any)?.balance ?? 0,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}