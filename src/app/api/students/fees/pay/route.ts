// FILE: src/app/api/students/fees/pay/route.ts
// POST → Student/Parent online pay — FIXED with proper error handling
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Student } from '@/models/Student'
import { School } from '@/models/School'
import { getSchoolRazorpay } from '@/lib/razorpay'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { Fee } from '@/models/Fee'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['student', 'parent'].includes(session.user.role)) {
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

    // ─── Resolve student ID ───
    let resolvedStudentId: string | null = null
    if (session.user.role === 'student') {
      const stu = await Student.findOne({
        userId: session.user.id,
        tenantId: session.user.tenantId,
      }).select('_id').lean()
      resolvedStudentId = stu?._id?.toString() ?? null
    } else {
      const p = await User.findById(session.user.id)
        .select('studentRef').lean() as any
      resolvedStudentId = p?.studentRef?.toString() ?? null
    }

    if (!resolvedStudentId) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // ─── Fee fetch — student ka hi hona chahiye ───
    const fee = await Fee.findOne({
      _id: feeId,
      tenantId: session.user.tenantId,
      studentId: resolvedStudentId,
      status: { $in: ['pending', 'partial'] },
    })

    if (!fee) {
      return NextResponse.json(
        { error: 'Fee not found or already paid' },
        { status: 404 }
      )
    }

    // ─── School Razorpay config check ───
    const school = await School.findById(session.user.tenantId)
      .select('paymentSettings name')
      .lean() as any

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    if (
      !school?.paymentSettings?.enableOnlinePayment ||
      !school?.paymentSettings?.razorpayKeyId
    ) {
      return NextResponse.json(
        { error: 'Online payment is not available for this school' },
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

    // ─── Razorpay instance — getSchoolRazorpay handles decryption ───
    let rzp: any
    try {
      rzp = await getSchoolRazorpay(session.user.tenantId)
    } catch (rzpInitErr: any) {
      console.error('Razorpay init error:', rzpInitErr)
      return NextResponse.json(
        { error: 'Payment gateway initialization failed' },
        { status: 503 }
      )
    }

    if (!rzp) {
      return NextResponse.json(
        { error: 'Payment gateway not available' },
        { status: 503 }
      )
    }

    // ─── Create Razorpay order ───
    let order: any
    try {
      order = await rzp.orders.create({
        amount: Math.round(amountToPay * 100), // paise
        currency: 'INR',
        receipt: `fee_${feeId}_${Date.now()}`.slice(0, 40),
        notes: {
          feeId: feeId,
          tenantId: session.user.tenantId,
          studentId: resolvedStudentId,
        },
      })
    } catch (orderErr: any) {
      console.error('Razorpay order create error:', orderErr)
      return NextResponse.json(
        {
          error:
            orderErr?.error?.description ||
            orderErr?.message ||
            'Failed to create payment order',
        },
        { status: 502 }
      )
    }

    // ─── Save orderId ───
    await Fee.findByIdAndUpdate(feeId, { razorpayOrderId: order.id })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,       // paise mein — Razorpay directly use karta hai
      currency: order.currency,
      keyId: school.paymentSettings.razorpayKeyId,
      name: school.name || 'School Fee',
      feeId,
      remaining,
      payingAmount: amountToPay,
    })

  } catch (err: any) {
    console.error('Student fee pay route error:', err)
    // ✅ Always return valid JSON
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}