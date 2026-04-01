// FILE: src/app/api/students/fees/verify/route.ts
// POST → Student side Razorpay payment verify
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { School } from '@/models/School'
import { Student } from '@/models/Student'
import crypto from 'crypto'

function generateReceiptNo(): string {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
    return `RCP-${y}${m}${d}-${rand}`
}

function decryptSecret(encryptedSecret: string): string {
    const key = Buffer.from(
        process.env.ENCRYPTION_KEY ?? 'default-32-char-key-here-12345678',
        'utf8'
    ).slice(0, 32)
    const [ivHex, encHex] = encryptedSecret.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const enc = Buffer.from(encHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || !['student', 'parent'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        let body: any
        try {
            body = await req.json()
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            feeId,
            amount,
        } = body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !feeId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // ─── School secret fetch + decrypt ───
        const school = await School.findById(session.user.tenantId)
            .select('paymentSettings name')
            .lean() as any

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        let secret: string
        const settings = school?.paymentSettings
        if (settings?.razorpayKeySecret) {
            try {
                secret = decryptSecret(settings.razorpayKeySecret)
            } catch {
                secret = process.env.RAZORPAY_KEY_SECRET!
            }
        } else {
            secret = process.env.RAZORPAY_KEY_SECRET!
        }

        if (!secret) {
            return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
        }

        // ─── Signature verify ───
        const expectedSig = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

        if (expectedSig !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
        }

        // ─── Resolve student ID ───
        let resolvedStudentId: string | null = null
        if (session.user.role === 'student') {
            const stu = await Student.findOne({
                userId: session.user.id,
                tenantId: session.user.tenantId,
            }).select('_id').lean()
            resolvedStudentId = stu?._id?.toString() ?? null
        } else {
            const { User } = await import('@/models/User')
            const p = await User.findById(session.user.id).select('studentRef').lean() as any
            resolvedStudentId = p?.studentRef?.toString() ?? null
        }

        // ─── Fee fetch — student ka hi fee hona chahiye ───
        const fee = await Fee.findOne({
            _id: feeId,
            tenantId: session.user.tenantId,
            studentId: resolvedStudentId,
        })

        if (!fee) {
            return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
        }

        // ─── Double processing check ───
        const alreadyProcessed = fee.payments?.some(
            (p: any) => p.razorpayPaymentId === razorpay_payment_id
        )
        if (alreadyProcessed) {
            return NextResponse.json({
                success: true,
                alreadyProcessed: true,
                receiptNumber: fee.receiptNumber,
                status: fee.status,
            })
        }

        // ─── Amount calculate ───
        const remaining = fee.finalAmount - fee.paidAmount
        const payAmount = amount ? Math.min(Number(amount), remaining) : remaining
        const newTotalPaid = fee.paidAmount + payAmount
        const isFullyPaid = newTotalPaid >= fee.finalAmount
        const newStatus = isFullyPaid ? 'paid' : 'partial'
        const receiptNumber = generateReceiptNo()
        const now = new Date()

        await Fee.findByIdAndUpdate(fee._id, {
            $set: {
                status: newStatus,
                paidAmount: newTotalPaid,
                razorpayPaymentId: razorpay_payment_id,
                paidAt: now,
                paymentMode: 'online',
                receiptNumber,
            },
            $push: {
                payments: {
                    amount: payAmount,
                    paymentMode: 'online',
                    razorpayPaymentId: razorpay_payment_id,
                    receiptNumber,
                    paidAt: now,
                    notes: `Razorpay Order: ${razorpay_order_id}`,
                },
            },
        })

        return NextResponse.json({
            success: true,
            receiptNumber,
            status: newStatus,
            paidAmount: payAmount,
            totalPaid: newTotalPaid,
            remaining: Math.max(0, fee.finalAmount - newTotalPaid),
        })

    } catch (err: any) {
        console.error('Student fee verify error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}