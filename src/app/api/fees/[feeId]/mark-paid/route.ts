import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Fee } from "@/models/Fee"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"


export async function POST(
  req: NextRequest,
  { params }: { params: { feeId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
 
    await connectDB()
    const { paymentMode = 'cash' } = await req.json()
 
    const fee = await Fee.findOne({
      _id:      params.feeId,
      tenantId: session.user.tenantId,
    })
    if (!fee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }
 
    const receiptNumber = `RCP-${Date.now()}`
 
    await Fee.findByIdAndUpdate(fee._id, {
      status:        'paid',
      paidAmount:    fee.finalAmount,
      paidAt:        new Date(),
      paymentMode,
      collectedBy:   session.user.id,
      receiptNumber,
    })
 
    return NextResponse.json({ success: true, receiptNumber })
 
  } catch (err: any) {
    console.error('Mark paid error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}