// FILE: src/app/api/credits/verify/route.ts
// Verify payment and credit the account

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { purchaseCreditPack, purchaseExtraStudents, purchaseExtraTeachers } from '@/lib/credits'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<{
        razorpayOrderId: string
        razorpayPaymentId: string
        razorpaySignature: string
        type: 'credit_pack' | 'extra_students' | 'extra_teachers'
        packId: string
    }>(req, { allowedRoles: ['admin'], rateLimit: 'api' })

    if (guard instanceof NextResponse) return guard

    const { body, session } = guard
    const {
        razorpayOrderId, razorpayPaymentId,
        razorpaySignature, type, packId,
    } = body

    // Verify signature
    const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex')

    if (expectedSig !== razorpaySignature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const tenantId = session.user.tenantId

    let result: any

    if (type === 'credit_pack') {
        result = await purchaseCreditPack(tenantId, packId as any, razorpayOrderId, razorpayPaymentId)
    } else if (type === 'extra_students') {
        result = await purchaseExtraStudents(tenantId, packId as any, razorpayOrderId, razorpayPaymentId)
    } else if (type === 'extra_teachers') {
        result = await purchaseExtraTeachers(tenantId, packId as any, razorpayOrderId, razorpayPaymentId)
    } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result })
}