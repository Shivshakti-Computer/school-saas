// FILE: src/app/api/fees/route.ts
// GET only — list fees with filters + search
// POST removed (was duplicate of /api/fees/pay)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { Student } from '@/models/Student'
import { User } from '@/models/User'


// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// })

// // Create Razorpay order for fee payment
// export async function POST(req: NextRequest) {
//   const session = await getServerSession(authOptions)
//   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

//   await connectDB()
//   const { feeId } = await req.json()
//   const { filter } = withTenant(session.user.tenantId)

//   const fee = await Fee.findOne(filter({ _id: feeId }))
//   if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 })

//   // Create Razorpay order
//   const order = await razorpay.orders.create({
//     amount: fee.amount * 100, // paise
//     currency: 'INR',
//     receipt: `fee_${feeId}`,
//     notes: {
//       feeId: feeId,
//       tenantId: session.user.tenantId,
//       studentId: fee.studentId.toString(),
//     }
//   })

//   await Fee.findByIdAndUpdate(feeId, { razorpayOrderId: order.id })

//   return NextResponse.json({
//     orderId: order.id,
//     amount: order.amount,
//     currency: order.currency,
//     keyId: process.env.RAZORPAY_KEY_ID,
//   })
// }


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const status = req.nextUrl.searchParams.get('status')
    const cls = req.nextUrl.searchParams.get('class')
    const search = req.nextUrl.searchParams.get('search')

    const query: any = { tenantId: session.user.tenantId }
    if (status) query.status = status

    // If search, find matching student IDs first
    let studentIdFilter: string[] | null = null
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' }

      // Search in User names
      const matchedUsers = await User.find({
        tenantId: session.user.tenantId,
        role: 'student',
        $or: [
          { name: searchRegex },
          { phone: searchRegex },
        ],
      }).select('_id').lean()
      const userIds = matchedUsers.map(u => u._id)

      // Search in Student admissionNo
      const matchedStudents = await Student.find({
        tenantId: session.user.tenantId,
        $or: [
          { admissionNo: searchRegex },
          ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : []),
        ],
      }).select('_id').lean()

      studentIdFilter = matchedStudents.map(s => s._id.toString())

      if (studentIdFilter.length === 0) {
        return NextResponse.json({ fees: [] })
      }
      query.studentId = { $in: studentIdFilter }
    }

    let fees = await Fee.find(query)
      .populate({
        path: 'studentId',
        select: 'admissionNo class section',
        populate: { path: 'userId', select: 'name phone' },
      })
      .populate('structureId', 'name term')
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