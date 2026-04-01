// FILE: src/app/api/fees/pay/route.ts
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { School } from '@/models/School'
import { getSchoolRazorpay } from '@/lib/razorpay'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // ─── Parse body safely ───
    let body: { feeId?: string; amount?: number }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { feeId, amount: customAmount } = body

    if (!feeId) {
      return NextResponse.json({ error: 'feeId is required' }, { status: 400 })
    }

    // ─── Fee fetch ───
    const fee = await Fee.findOne({
      _id: feeId,
      tenantId: session.user.tenantId,
      status: { $in: ['pending', 'partial'] },
    })

    if (!fee) {
      return NextResponse.json(
        { error: 'Fee not found or already paid' },
        { status: 404 }
      )
    }

    // ─── School settings check ───
    const school = await School.findById(session.user.tenantId)
      .select('paymentSettings')
      .lean() as any

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const hasOnlinePayment =
      school?.paymentSettings?.enableOnlinePayment &&
      school?.paymentSettings?.razorpayKeyId

    if (!hasOnlinePayment) {
      return NextResponse.json(
        {
          error: 'Online payment not configured. Please add Razorpay keys in Payment Settings.',
          needsSetup: true,
        },
        { status: 503 }
      )
    }

    // ─── Amount calculate ───
    const remaining = fee.finalAmount - fee.paidAmount
    const amountToPay = customAmount
      ? Math.min(Number(customAmount), remaining)
      : remaining

    if (amountToPay <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // ─── Razorpay instance — getSchoolRazorpay uses decryption ───
    const rzp = await getSchoolRazorpay(session.user.tenantId)
    if (!rzp) {
      return NextResponse.json(
        { error: 'Payment gateway initialization failed' },
        { status: 503 }
      )
    }

    // ─── Create order ───
    let order: any
    try {
      order = await rzp.orders.create({
        amount: Math.round(amountToPay * 100), // paise
        currency: 'INR',
        receipt: `fee_${feeId}_${Date.now()}`.slice(0, 40),
        notes: {
          feeId: feeId,
          tenantId: session.user.tenantId,
          studentId: fee.studentId?.toString() || '',
        },
      })
    } catch (rzpErr: any) {
      console.error('Razorpay order create error:', rzpErr)
      return NextResponse.json(
        {
          error:
            rzpErr?.error?.description ||
            rzpErr?.message ||
            'Failed to create Razorpay order',
        },
        { status: 502 }
      )
    }

    // ─── Save orderId to fee ───
    await Fee.findByIdAndUpdate(feeId, { razorpayOrderId: order.id })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,     // paise mein
      currency: order.currency,
      keyId: school.paymentSettings.razorpayKeyId, // Frontend ke liye
      remaining,
      payingAmount: amountToPay,
    })

  } catch (err: any) {
    console.error('Fee pay route error:', err)
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}