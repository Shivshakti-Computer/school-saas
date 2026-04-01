// FILE: src/app/api/fees/pay/route.ts
// POST → create Razorpay order for online payment (admin side)
// Uses school-specific Razorpay keys
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { School } from '@/models/School'
import { getSchoolRazorpay } from '@/lib/razorpay'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const { feeId, amount: customAmount } = await req.json()

  const fee = await Fee.findOne({
    _id: feeId,
    tenantId: session.user.tenantId,
    status: { $in: ['pending', 'partial'] },
  })

  if (!fee) return NextResponse.json({ error: 'Fee not found or already paid' }, { status: 404 })

  // Check if school has Razorpay configured
  const school = await School.findById(session.user.tenantId)
    .select('paymentSettings')
    .lean() as any

  const hasRazorpay = school?.paymentSettings?.enableOnlinePayment &&
    school?.paymentSettings?.razorpayKeyId

  if (!hasRazorpay) {
    return NextResponse.json({
      error: 'Online payment not configured. Please add Razorpay keys in Payment Settings.',
      needsSetup: true,
    }, { status: 503 })
  }

  const rzp = await getSchoolRazorpay(session.user.tenantId)
  if (!rzp) return NextResponse.json({ error: 'Payment gateway error' }, { status: 503 })

  const remaining = fee.finalAmount - fee.paidAmount
  // Allow custom amount for partial payment, default to full remaining
  const amountToPay = customAmount ? Math.min(Number(customAmount), remaining) : remaining

  if (amountToPay <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const keyId = school.paymentSettings.razorpayKeyId

  const order = await rzp.orders.create({
    amount: Math.round(amountToPay * 100), // paise
    currency: 'INR',
    receipt: `fee_${feeId}_${Date.now()}`,
    partial_payment: false,
    notes: {
      feeId: feeId,
      tenantId: session.user.tenantId,
      studentId: fee.studentId.toString(),
      isPartial: amountToPay < remaining ? 'true' : 'false',
    },
  })

  await Fee.findByIdAndUpdate(feeId, { razorpayOrderId: order.id })

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
    remaining,
    payingAmount: amountToPay,
  })
}