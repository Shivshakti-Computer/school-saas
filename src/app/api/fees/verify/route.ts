// FILE: src/app/api/fees/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { School } from '@/models/School'
import { Student } from '@/models/Student'
import { logAudit } from '@/lib/audit'
import crypto from 'crypto'

function generateReceiptNo(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `RCP-${y}${m}${d}-${rand}`
}

// ─── Decrypt school Razorpay secret (same logic as getSchoolRazorpay) ───
function decryptSecret(encryptedSecret: string): string {
  const key = Buffer.from(
    process.env.ENCRYPTION_KEY ?? 'default-32-char-key-here-12345678',
    'utf8'
  ).slice(0, 32)
  const [ivHex, encHex] = encryptedSecret.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const enc = Buffer.from(encHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // ─── Parse body safely ───
    let body: {
      razorpay_order_id?: string
      razorpay_payment_id?: string
      razorpay_signature?: string
      feeId?: string
      amount?: number
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      feeId,
      amount,
    } = body

    // ─── Required fields ───
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !feeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ─── School fetch ───
    const school = await School.findById(session.user.tenantId)
      .select('paymentSettings name')
      .lean() as any

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // ─── Get decrypted secret (same as getSchoolRazorpay logic) ───
    let secret: string

    const settings = school?.paymentSettings
    if (settings?.razorpayKeySecret) {
      // School ki encrypted secret hai — decrypt karo
      try {
        secret = decryptSecret(settings.razorpayKeySecret)
      } catch {
        // Decryption fail — fallback to platform secret
        secret = process.env.RAZORPAY_KEY_SECRET!
      }
    } else {
      // School ki key nahi — platform secret use karo
      secret = process.env.RAZORPAY_KEY_SECRET!
    }

    if (!secret) {
      return NextResponse.json(
        { error: 'Razorpay secret not configured' },
        { status: 503 }
      )
    }

    // ─── Step 1: Signature verify (same as subscription/verify) ───
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSig !== razorpay_signature) {
      await logAudit({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        userRole: 'admin',
        action: 'PAYMENT_FAILED',
        resource: 'Payment',
        description: 'Invalid fee payment signature',
        metadata: { razorpay_order_id, feeId },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        status: 'FAILURE',
      })

      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // ─── Step 2: Fee fetch ───
    const fee = await Fee.findOne({
      _id: feeId,
      tenantId: session.user.tenantId,
    })

    if (!fee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }

    // ─── Step 3: Double processing check ───
    const alreadyProcessed = fee.payments?.some(
      (p: any) => p.razorpayPaymentId === razorpay_payment_id
    )

    if (alreadyProcessed) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        receiptNumber: fee.receiptNumber,
        status: fee.status,
        totalPaid: fee.paidAmount,
        remaining: Math.max(0, fee.finalAmount - fee.paidAmount),
      })
    }

    // ─── Step 4: Amount calculate ───
    const remaining = fee.finalAmount - fee.paidAmount
    const payAmount = amount
      ? Math.min(Number(amount), remaining)
      : remaining

    if (payAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
    }

    const newTotalPaid = fee.paidAmount + payAmount
    const isFullyPaid = newTotalPaid >= fee.finalAmount
    const newStatus = isFullyPaid ? 'paid' : 'partial'
    const receiptNumber = generateReceiptNo()
    const now = new Date()

    const paymentRecord = {
      amount: payAmount,
      paymentMode: 'online' as const,
      razorpayPaymentId: razorpay_payment_id,
      receiptNumber,
      paidAt: now,
      collectedBy: session.user.id,
      notes: `Razorpay Order: ${razorpay_order_id}`,
    }

    // ─── Step 5: Fee update ───
    await Fee.findByIdAndUpdate(fee._id, {
      $set: {
        status: newStatus,
        paidAmount: newTotalPaid,
        razorpayPaymentId: razorpay_payment_id,
        paidAt: now,
        paymentMode: 'online',
        receiptNumber,
      },
      $push: { payments: paymentRecord },
    })

    // ─── Step 6: Student info for receipt ───
    const student = await Student.findById(fee.studentId)
      .populate('userId', 'name phone')
      .lean() as any

    // ─── Step 7: Audit log success ───
    await logAudit({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      userName: session.user.name || 'Unknown',
      userRole: 'admin',
      action: 'PAYMENT_SUCCESS',
      resource: 'Payment',
      resourceId: fee._id.toString(),
      description: `Fee payment verified: ₹${payAmount} — ${student?.userId?.name || 'Student'} (${newStatus})`,
      metadata: {
        feeId: fee._id.toString(),
        razorpay_payment_id,
        razorpay_order_id,
        receiptNumber,
        payAmount,
        newTotalPaid,
        remaining: Math.max(0, fee.finalAmount - newTotalPaid),
        status: newStatus,
        studentId: fee.studentId?.toString(),
      },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    })

    // ─── Step 8: Receipt data return ───
    const receiptData = {
      receiptNumber,
      studentName: student?.userId?.name || 'N/A',
      admissionNo: student?.admissionNo || 'N/A',
      class: student?.class || '',
      section: student?.section || '',
      totalAmount: fee.finalAmount,
      paidAmount: payAmount,
      totalPaidSoFar: newTotalPaid,
      remainingAmount: Math.max(0, fee.finalAmount - newTotalPaid),
      paymentMode: 'online',
      paidAt: now.toISOString(),
      status: newStatus,
      schoolName: school?.name || session.user.schoolName || '',
    }

    return NextResponse.json({
      success: true,
      receiptNumber,
      status: newStatus,
      paidAmount: payAmount,
      totalPaid: newTotalPaid,
      remaining: Math.max(0, fee.finalAmount - newTotalPaid),
      receipt: receiptData,
    })

  } catch (err: any) {
    console.error('Fee verify error:', err)
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}