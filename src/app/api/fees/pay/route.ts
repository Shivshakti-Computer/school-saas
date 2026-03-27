/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/fees/pay/route.ts
   POST → create Razorpay order for online payment
   ─────────────────────────────────────────────────────────── */
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { getSchoolRazorpay } from '@/lib/razorpay'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const { feeId } = await req.json()

  const fee = await Fee.findOne({
    _id: feeId,
    tenantId: session.user.tenantId,
    status: 'pending',
  })
  if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 })

  // ✅ getSchoolRazorpay → Razorpay | null
  // Internally: school key hai toh woh, nahi toh env fallback — null kabhi nahi aata practically
  const rzp = await getSchoolRazorpay(session.user.tenantId)
  if (!rzp) return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })

  // keyId: getSchoolRazorpay ke andar same fallback logic hai
  // DB se dobara fetch avoid karne ke liye — school key ya env key
  const { School } = await import('@/models/School')
  const school = await School.findById(session.user.tenantId)
    .select('paymentSettings')
    .lean() as any

  const keyId = school?.paymentSettings?.razorpayKeyId
    ?? process.env.RAZORPAY_KEY_ID!

  const amountToPay = fee.finalAmount - fee.paidAmount

  const order = await rzp.orders.create({
    amount: amountToPay * 100,
    currency: 'INR',
    receipt: `fee_${feeId}`,
    notes: {
      feeId: feeId,
      tenantId: session.user.tenantId,
    },
  })

  await Fee.findByIdAndUpdate(feeId, { razorpayOrderId: order.id })

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
  })
}