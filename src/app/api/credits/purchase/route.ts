// FILE: src/app/api/credits/purchase/route.ts
// Purchase credit pack OR extra students/teachers
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { RATE_LIMITS } from '@/lib/security'
import { CREDIT_PACKS, ADDON_PRICING, getOrderAmountPaise } from '@/config/pricing'
import Razorpay from 'razorpay'

// Step 1: Create order
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

    let amount = 0
    let description = ''

    if (type === 'credit_pack') {
        const pack = CREDIT_PACKS.find(p => p.id === packId)
        if (!pack) return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 })
        amount = pack.price
        description = `${pack.name} — ${pack.credits} credits`
    } else if (type === 'extra_students') {
        const pack = ADDON_PRICING.extraStudents[packId as keyof typeof ADDON_PRICING.extraStudents]
        if (!pack) return NextResponse.json({ error: 'Invalid student pack' }, { status: 400 })
        amount = pack.price
        description = `Extra ${pack.students} students add-on`
    } else if (type === 'extra_teachers') {
        const pack = ADDON_PRICING.extraTeachers[packId as keyof typeof ADDON_PRICING.extraTeachers]
        if (!pack) return NextResponse.json({ error: 'Invalid teacher pack' }, { status: 400 })
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
        amount: amount * 100, // paise
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