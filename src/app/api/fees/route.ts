import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Razorpay from 'razorpay'
import { authOptions } from '@/lib/auth'
import { connectDB, withTenant } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { sendSMS, SMS_TEMPLATES } from '@/lib/sms'

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// Create Razorpay order for fee payment
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { feeId } = await req.json()
    const { filter } = withTenant(session.user.tenantId)

    const fee = await Fee.findOne(filter({ _id: feeId }))
    if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 })

    // Create Razorpay order
    const order = await razorpay.orders.create({
        amount: fee.amount * 100, // paise
        currency: 'INR',
        receipt: `fee_${feeId}`,
        notes: {
            feeId: feeId,
            tenantId: session.user.tenantId,
            studentId: fee.studentId.toString(),
        }
    })

    await Fee.findByIdAndUpdate(feeId, { razorpayOrderId: order.id })

    return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
    })
}
 
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
 
    await connectDB()
 
    const status = req.nextUrl.searchParams.get('status')
    const cls    = req.nextUrl.searchParams.get('class')
 
    const query: any = { tenantId: session.user.tenantId }
    if (status) query.status = status
 
    let fees = await Fee.find(query)
      .populate({
        path:     'studentId',
        select:   'admissionNo class section',
        populate: { path: 'userId', select: 'name phone' },
      })
      .populate('structureId', 'name')
      .sort({ dueDate: 1 })
      .lean()
 
    // Class filter (after populate)
    if (cls) {
      fees = fees.filter((f: any) => f.studentId?.class === cls)
    }
 
    return NextResponse.json({ fees })
 
  } catch (err: any) {
    console.error('Fees GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}