// -------------------------------------------------------------
// FILE: src/app/api/fees/webhook/route.ts
// Razorpay webhook — payment confirm hone pe auto-update
// REPLACE existing webhook file
// -------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { Student } from '@/models/Student'
import { sendSMS, SMS_TEMPLATES } from '@/lib/sms'
import { generateReceiptPDF } from '@/lib/pdf'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = req.headers.get('x-razorpay-signature') ?? ''

    // Signature verify karo
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (sig !== expected) {
      console.error('Webhook signature mismatch')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('Razorpay webhook event:', event.event)

    await connectDB()

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const notes = payment.notes ?? {}

      // Fee record dhundho order ID se
      const fee = await Fee.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          $set: {
            status: 'paid',
            paidAmount: payment.amount / 100,
            razorpayPaymentId: payment.id,
            paidAt: new Date(),
            paymentMode: 'online',
          },
        },
        { new: true }
      )

      if (fee) {
        // Receipt number generate karo
        const receiptNumber = `RCP-${Date.now()}`
        await Fee.findByIdAndUpdate(fee._id, { receiptNumber })

        // Receipt PDF generate karo (background mein)
        try {
          const receiptUrl = await generateReceiptPDF(fee._id.toString())
          await Fee.findByIdAndUpdate(fee._id, { receiptUrl })
        } catch (pdfErr) {
          console.error('Receipt PDF error (non-fatal):', pdfErr)
        }

        // SMS to parent
        try {
          const student = await Student.findById(fee.studentId).lean() as any
          if (student?.parentPhone) {
            await sendSMS(
              student.parentPhone,
              SMS_TEMPLATES.feePaid(
                student.admissionNo ?? 'Student',
                fee.paidAmount,
                receiptNumber
              )
            )
          }
        } catch (smsErr) {
          console.error('SMS error (non-fatal):', smsErr)
        }
      }
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      console.log('Payment failed:', payment.id, payment.error_description)
      // Optionally notify admin or student
    }

    return NextResponse.json({ received: true })

  } catch (err: any) {
    console.error('Webhook error:', err)
    // Always return 200 to Razorpay (don't retry)
    return NextResponse.json({ received: true })
  }
}