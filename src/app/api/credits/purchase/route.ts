// FILE: src/app/api/credits/purchase/route.ts
// FIXED: Cap check BEFORE creating Razorpay order

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { CREDIT_PACKS, ADDON_PRICING, PLANS } from '@/config/pricing'
import { School } from '@/models/School'
import { connectDB } from '@/lib/db'
import Razorpay from 'razorpay'
import type { PlanId } from '@/config/pricing'

export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<{
        type: 'credit_pack' | 'extra_students' | 'extra_teachers'
        packId: string
    }>(req, {
        allowedRoles: ['admin'],
        rateLimit: 'api',
    })
    if (guard instanceof NextResponse) return guard

    const { body, session } = guard
    const { type, packId } = body

    await connectDB()

    let amount = 0
    let description = ''

    if (type === 'credit_pack') {
        const pack = CREDIT_PACKS.find(p => p.id === packId)
        if (!pack) {
            return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 })
        }
        amount = pack.price
        description = `${pack.name} — ${pack.credits} credits`

    } else if (type === 'extra_students') {
        const pack = ADDON_PRICING.extraStudents[packId as keyof typeof ADDON_PRICING.extraStudents]
        if (!pack) {
            return NextResponse.json({ error: 'Invalid student pack' }, { status: 400 })
        }

        // ── CAP CHECK BEFORE ORDER ──
        const school = await School.findById(session.user.tenantId)
            .select('plan addonLimits')
            .lean() as any

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        const planConfig = PLANS[school.plan as PlanId]
        const currentExtra = school.addonLimits?.extraStudents ?? 0
        const maxAddon = planConfig.maxAddonStudents

        if (maxAddon !== -1) {
            const afterPurchase = currentExtra + pack.students
            if (afterPurchase > maxAddon) {
                const remainingSlots = Math.max(0, maxAddon - currentExtra)
                const nextPlanName =
                    school.plan === 'starter' ? 'Growth' :
                        school.plan === 'growth' ? 'Pro' :
                            school.plan === 'pro' ? 'Enterprise' : ''

                return NextResponse.json({
                    error: remainingSlots === 0
                        ? `${planConfig.name} plan mein addon limit full ho gayi (max +${maxAddon} students). ${nextPlanName ? `${nextPlanName} plan upgrade karein.` : ''}`
                        : `Is pack mein ${pack.students} students hain lekin sirf ${remainingSlots} aur add ho sakte hain. Chhota pack choose karein.`,
                    remainingSlots,
                    maxAddon,
                    currentExtra,
                }, { status: 400 })
            }
        }

        amount = pack.price
        description = `Extra ${pack.students} students add-on`

    } else if (type === 'extra_teachers') {
        const pack = ADDON_PRICING.extraTeachers[packId as keyof typeof ADDON_PRICING.extraTeachers]
        if (!pack) {
            return NextResponse.json({ error: 'Invalid teacher pack' }, { status: 400 })
        }

        // ── CAP CHECK BEFORE ORDER ──
        const school = await School.findById(session.user.tenantId)
            .select('plan addonLimits')
            .lean() as any

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        const planConfig = PLANS[school.plan as PlanId]
        const currentExtra = school.addonLimits?.extraTeachers ?? 0
        const maxAddon = planConfig.maxAddonTeachers

        if (maxAddon !== -1) {
            const afterPurchase = currentExtra + pack.teachers
            if (afterPurchase > maxAddon) {
                const remainingSlots = Math.max(0, maxAddon - currentExtra)
                const nextPlanName =
                    school.plan === 'starter' ? 'Growth' :
                        school.plan === 'growth' ? 'Pro' :
                            school.plan === 'pro' ? 'Enterprise' : ''

                return NextResponse.json({
                    error: remainingSlots === 0
                        ? `${planConfig.name} plan mein teacher addon limit full ho gayi (max +${maxAddon} staff). ${nextPlanName ? `${nextPlanName} plan upgrade karein.` : ''}`
                        : `Is pack mein ${pack.teachers} teachers hain lekin sirf ${remainingSlots} aur add ho sakte hain. Chhota pack choose karein.`,
                    remainingSlots,
                    maxAddon,
                    currentExtra,
                }, { status: 400 })
            }
        }

        amount = pack.price
        description = `Extra ${pack.teachers} teachers add-on`

    } else {
        return NextResponse.json({ error: 'Invalid purchase type' }, { status: 400 })
    }

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: `${type}_${packId}_${Date.now()}`,
        notes: {
            tenantId: session.user.tenantId,
            type,
            packId,
            description,
        },
    })

    return NextResponse.json({
        success: true,
        orderId: order.id,
        amount,
        description,
        key: process.env.RAZORPAY_KEY_ID,
    })
}