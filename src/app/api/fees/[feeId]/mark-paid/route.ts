// FILE: src/app/api/fees/[feeId]/mark-paid/route.ts
// Now supports partial payment + receipt generation
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Fee } from "@/models/Fee"
import { Student } from "@/models/Student"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

function generateReceiptNo(tenantId: string): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `RCP-${y}${m}${d}-${rand}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ feeId: string }> }
) {
  try {
    const { feeId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { paymentMode = 'cash', amount, notes } = await req.json()

    const fee = await Fee.findOne({
      _id: feeId,
      tenantId: session.user.tenantId,
    })

    if (!fee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }

    if (fee.status === 'paid') {
      return NextResponse.json({ error: 'Fee already paid' }, { status: 400 })
    }

    if (fee.status === 'waived') {
      return NextResponse.json({ error: 'Fee is waived' }, { status: 400 })
    }

    const remaining = fee.finalAmount - fee.paidAmount

    // If no amount specified, pay full remaining
    const payAmount = amount ? Math.min(Number(amount), remaining) : remaining

    if (payAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
    }

    const receiptNumber = generateReceiptNo(session.user.tenantId)
    const newPaidAmount = fee.paidAmount + payAmount
    const isFullyPaid = newPaidAmount >= fee.finalAmount

    // Add payment record
    const paymentRecord = {
      amount: payAmount,
      paymentMode,
      receiptNumber,
      paidAt: new Date(),
      collectedBy: session.user.id,
      notes: notes || '',
    }

    await Fee.findByIdAndUpdate(fee._id, {
      $set: {
        status: isFullyPaid ? 'paid' : 'partial',
        paidAmount: newPaidAmount,
        paidAt: new Date(),
        paymentMode,
        collectedBy: session.user.id,
        receiptNumber, // Latest receipt
      },
      $push: {
        payments: paymentRecord,
      },
    })

    // Get student info for receipt data
    const student = await Student.findById(fee.studentId)
      .populate('userId', 'name phone')
      .lean() as any

    const receiptData = {
      receiptNumber,
      studentName: student?.userId?.name || 'N/A',
      admissionNo: student?.admissionNo || 'N/A',
      class: student?.class || '',
      section: student?.section || '',
      totalAmount: fee.finalAmount,
      paidAmount: payAmount,
      totalPaidSoFar: newPaidAmount,
      remainingAmount: fee.finalAmount - newPaidAmount,
      paymentMode,
      paidAt: new Date().toISOString(),
      status: isFullyPaid ? 'paid' : 'partial',
      schoolName: session.user.schoolName || '',
    }

    return NextResponse.json({
      success: true,
      receiptNumber,
      status: isFullyPaid ? 'paid' : 'partial',
      paidAmount: payAmount,
      totalPaid: newPaidAmount,
      remaining: fee.finalAmount - newPaidAmount,
      receipt: receiptData,
    })
  } catch (err: any) {
    console.error('Mark paid error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}