// FILE: src/app/api/student/fees/pay/route.ts
// POST → Student/Parent online pay — uses school Razorpay keys
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

    const { feeId, amount: customAmount } = await req.json()

    // Resolve student ID
    let resolvedStudentId: string | null = null
    if (session.user.role === 'student') {
      const stu = await Student.findOne({
        userId: session.user.id,
        tenantId: session.user.tenantId
      }).select('_id').lean()
      resolvedStudentId = stu?._id?.toString() ?? null
    } else {
      const p = await User.findById(session.user.id).select('studentRef').lean() as any
      resolvedStudentId = p?.studentRef?.toString() ?? null
    }

    const fee = await Fee.findOne({
      _id: feeId,
      tenantId: session.user.tenantId,
      studentId: resolvedStudentId,
      status: { $in: ['pending', 'partial'] },
    })

    if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 })

    // Check school Razorpay config
    const school = await School.findById(session.user.tenantId)
      .select('paymentSettings name')
      .lean() as any

    if (!school?.paymentSettings?.enableOnlinePayment || !school?.paymentSettings?.razorpayKeyId) {
      return NextResponse.json({
        error: 'Online payment not available for this school'
      }, { status: 503 })
    }

    const rzp = await getSchoolRazorpay(session.user.tenantId)
    if (!rzp) return NextResponse.json({ error: 'Payment gateway error' }, { status: 503 })

    const remaining = fee.finalAmount - fee.paidAmount
    const amountToPay = customAmount ? Math.min(Number(customAmount), remaining) : remaining

    const order = await rzp.orders.create({
      amount: Math.round(amountToPay * 100),
      currency: 'INR',
      receipt: `fee_${feeId}_${Date.now()}`,
      notes: { feeId, tenantId: session.user.tenantId },
    })

    await Fee.findByIdAndUpdate(feeId, { razorpayOrderId: order.id })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: school.paymentSettings.razorpayKeyId,
      name: school.name || session.user.schoolName,
      feeId,
      remaining,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}