// FILE: src/app/api/fees/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { Student } from '@/models/Student'
import { School } from '@/models/School'

function generateReceiptNo(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `RCP-${y}${m}${d}-${rand}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = req.headers.get('x-razorpay-signature') ?? ''

    await connectDB()

    const event = JSON.parse(body)

    // Find the fee to get tenantId, then verify with school's secret
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const notes = payment.notes ?? {}
      const feeId = notes.feeId
      const tenantId = notes.tenantId

      if (!feeId || !tenantId) {
        console.error('Webhook: Missing feeId or tenantId in notes')
        return NextResponse.json({ received: true })
      }

      // Get school's Razorpay secret for verification
      const school = await School.findById(tenantId)
        .select('paymentSettings')
        .lean() as any

      const secret = school?.paymentSettings?.razorpayKeySecret ||
        process.env.RAZORPAY_KEY_SECRET!

      // Verify signature
      const expected = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')

      if (sig !== expected) {
        console.error('Webhook signature mismatch for tenant:', tenantId)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }

      const fee = await Fee.findOne({ razorpayOrderId: payment.order_id })
      if (!fee) {
        console.error('Webhook: Fee not found for order:', payment.order_id)
        return NextResponse.json({ received: true })
      }

      const paidAmountRupees = payment.amount / 100
      const newTotalPaid = fee.paidAmount + paidAmountRupees
      const isFullyPaid = newTotalPaid >= fee.finalAmount
      const receiptNumber = generateReceiptNo()

      const paymentRecord = {
        amount: paidAmountRupees,
        paymentMode: 'online' as const,
        razorpayPaymentId: payment.id,
        receiptNumber,
        paidAt: new Date(),
      }

      await Fee.findByIdAndUpdate(fee._id, {
        $set: {
          status: isFullyPaid ? 'paid' : 'partial',
          paidAmount: newTotalPaid,
          razorpayPaymentId: payment.id,
          paidAt: new Date(),
          paymentMode: 'online',
          receiptNumber,
        },
        $push: {
          payments: paymentRecord,
        },
      })

      console.log(`Webhook: Fee ${fee._id} - Paid ₹${paidAmountRupees}, Total: ₹${newTotalPaid}/${fee.finalAmount}, Status: ${isFullyPaid ? 'paid' : 'partial'}`)
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      console.log('Payment failed:', payment.id, payment.error_description)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ received: true })
  }
}