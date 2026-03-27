// -------------------------------------------------------------
// FILE: src/app/api/student/fees/pay/route.ts
// POST → Razorpay order banao (student/parent online pay kare)
// -------------------------------------------------------------
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Student } from '@/models/Student'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { Fee } from '@/models/Fee'
 
const rzp = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})
 
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['student', 'parent'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
 
    await connectDB()
    const { feeId } = await req.json()
 
    // Fee verify karo — sirf is student ki ho
    let resolvedStudentId: string | null = null
    if (session.user.role === 'student') {
      const stu = await Student.findOne({ userId: session.user.id, tenantId: session.user.tenantId }).select('_id').lean()
      resolvedStudentId = stu?._id?.toString() ?? null
    } else {
      const p = await User.findById(session.user.id).select('studentRef').lean() as any
      resolvedStudentId = p?.studentRef?.toString() ?? null
    }
 
    const fee = await Fee.findOne({
      _id:       feeId,
      tenantId:  session.user.tenantId,
      studentId: resolvedStudentId,
      status:    'pending',
    })
    if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
 
    const order = await rzp.orders.create({
      amount:   fee.finalAmount * 100,
      currency: 'INR',
      receipt:  `fee_${feeId}`,
      notes:    { feeId, tenantId: session.user.tenantId },
    })
 
    await Fee.findByIdAndUpdate(feeId, { razorpayOrderId: order.id })
 
    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
      name:     session.user.schoolName,
      feeId,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
 